#!/usr/bin/env node
/**
 * scripts/fetch-issue-context.mjs
 *
 * Deterministically prepares rich issue context for the autonomous agent workflow:
 * 1. Fetches target issue metadata, description, and comments into .context/target/issue.md.
 * 2. Parses and downloads attached images/mockups into .context/target/images/ with SSRF & size protections.
 * 3. Inspects parent milestone / parent issue to generate boundary context into .context/epic/summary.md.
 * 4. Discovers 1-hop linked issues (#<id>) and downloads their context into .context/linked/<id>/.
 */

import fs from 'node:fs';
import path from 'node:path';

const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const GH_TOKEN = process.env.GH_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const CONTEXT_DIR = path.resolve('.context');
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per asset
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

if (!ISSUE_NUMBER || !GITHUB_REPOSITORY) {
  console.error('Error: Missing required environment variables ISSUE_NUMBER or GITHUB_REPOSITORY.');
  process.exit(1);
}

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Inspired-Feature-Context-Fetcher',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {})
};

// Trusted domains allowed for image asset downloads (prevents SSRF and metadata attacks)
const TRUSTED_IMAGE_HOSTS = new Set([
  'github.com',
  'user-images.githubusercontent.com',
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com'
]);

// Allowed collaborator roles for comments (mitigates indirect prompt injection from third parties)
const TRUSTED_COMMENT_ROLES = new Set(['COLLABORATOR', 'MEMBER', 'OWNER']);

async function apiFetch(endpoint) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com/repos/${GITHUB_REPOSITORY}${endpoint}`;
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      console.warn(
        `Rate limit status: remaining=${res.headers.get('x-ratelimit-remaining')}, reset=${res.headers.get('x-ratelimit-reset')}`
      );
    }
    throw new Error(`GitHub API request failed (${res.status} ${res.statusText}): ${url}`);
  }
  return res.json();
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function extractImageUrls(markdownText) {
  if (!markdownText) return [];
  const urls = new Set();

  // Markdown image format: ![alt](url)
  const mdRegex = /!\[.*?\]\((https:\/\/[^\s\)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(markdownText)) !== null) {
    urls.add(match[1]);
  }

  // HTML img format: <img ... src="url" ...>
  const htmlRegex = /<img\s+[^>]*src=["'](https:\/\/[^"']+)["']/g;
  while ((match = htmlRegex.exec(markdownText)) !== null) {
    urls.add(match[1]);
  }

  return Array.from(urls);
}

function isTrustedImageHost(urlString) {
  try {
    const urlObj = new URL(urlString);
    if (urlObj.protocol !== 'https:') return false;
    // Host must match trusted list or be a trusted AWS S3 GitHub asset redirect
    if (TRUSTED_IMAGE_HOSTS.has(urlObj.hostname)) return true;
    if (urlObj.hostname.endsWith('.githubusercontent.com')) return true;
    if (urlObj.hostname.endsWith('.s3.amazonaws.com') && urlObj.hostname.includes('github-production-user-asset')) return true;
    return false;
  } catch {
    return false;
  }
}

async function downloadImage(url, destDir, index) {
  if (!isTrustedImageHost(url)) {
    console.warn(`Security Warning: Skipping untrusted image host: ${url}`);
    return null;
  }

  ensureDir(destDir);
  try {
    // Notice: Never transmit GH_TOKEN to image asset downloads (prevents credential exfiltration)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Inspired-Feature-Context-Fetcher'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!res.ok) {
      console.warn(`Warning: Failed to download image ${url} (${res.status} ${res.statusText})`);
      return null;
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_IMAGE_SIZE_BYTES) {
      console.warn(`Security Warning: Skipping image exceeding ${MAX_IMAGE_SIZE_BYTES} bytes (${contentLength} bytes): ${url}`);
      return null;
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const mimeExtMap = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };

    // Disallow SVG to prevent script/XML entity injection
    const cleanExt = mimeExtMap[contentType] || '.png';
    const filename = `image-${index + 1}${cleanExt}`;
    const filePath = path.join(destDir, filename);

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      console.warn(`Security Warning: Image payload exceeded maximum size during download: ${url}`);
      return null;
    }

    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    console.log(`Saved image: ${filePath} (${cleanExt})`);
    return filename;
  } catch (err) {
    console.warn(`Warning: Could not download image ${url}:`, err.message);
    return null;
  }
}

async function fetchIssue(number) {
  return apiFetch(`/issues/${number}`);
}

async function fetchIssueComments(number) {
  try {
    const comments = await apiFetch(`/issues/${number}/comments?per_page=10`);
    // Filter comments to only trusted collaborators / members to block prompt injection from third parties
    return comments.filter((c) => TRUSTED_COMMENT_ROLES.has(c.author_association) || c.user?.login === 'kmarcell');
  } catch (err) {
    console.warn(`Warning: Failed to fetch comments for #${number}:`, err.message);
    return [];
  }
}

async function processIssueContext(issue, targetDir) {
  ensureDir(targetDir);
  const imagesDir = path.join(targetDir, 'images');

  // Download all images from description
  const imageUrls = extractImageUrls(issue.body);
  const downloadedImages = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const filename = await downloadImage(imageUrls[i], imagesDir, i);
    if (filename) downloadedImages.push(filename);
  }

  // Fetch comments
  const comments = issue.comments > 0 ? await fetchIssueComments(issue.number) : [];

  const labels = (issue.labels || []).map((l) => typeof l === 'string' ? l : l.name).join(', ') || 'none';
  const milestone = issue.milestone ? issue.milestone.title : 'None';

  let markdown = `# Issue #${issue.number}: ${issue.title}\n\n`;
  markdown += `**State:** ${issue.state}\n`;
  markdown += `**Labels:** ${labels}\n`;
  markdown += `**Milestone:** ${milestone}\n`;
  markdown += `**URL:** ${issue.html_url}\n\n`;

  markdown += `## Description\n\n`;
  markdown += `<untrusted_user_input>\n${issue.body || '_No description provided._'}\n</untrusted_user_input>\n\n`;

  if (downloadedImages.length > 0) {
    markdown += `## Attached Visual Assets (Downloaded Locally)\n\n`;
    for (const img of downloadedImages) {
      markdown += `- \`images/${img}\`\n`;
    }
    markdown += `\n`;
  }

  if (comments.length > 0) {
    markdown += `## Discussion / Clarifications (Verified Maintainers)\n\n`;
    for (const c of comments) {
      const author = c.user ? c.user.login : 'user';
      markdown += `### Comment by @${author} (${c.created_at})\n\n<untrusted_user_input>\n${c.body}\n</untrusted_user_input>\n\n`;
    }
  }

  fs.writeFileSync(path.join(targetDir, 'issue.md'), markdown, 'utf8');
}

async function buildEpicSummary(targetIssue) {
  const epicDir = path.join(CONTEXT_DIR, 'epic');
  ensureDir(epicDir);

  let summaryContent = '';

  // 1. Check for Milestone
  if (targetIssue.milestone) {
    const ms = targetIssue.milestone;
    console.log(`Target issue belongs to Milestone: "${ms.title}" (ID: ${ms.number})`);

    let siblingIssues = [];
    try {
      siblingIssues = await apiFetch(`/issues?milestone=${ms.number}&state=all&per_page=50`);
    } catch (err) {
      console.warn(`Warning: Could not fetch milestone issues:`, err.message);
    }

    summaryContent += `# Parent Milestone: ${ms.title}\n\n`;
    if (ms.description) {
      summaryContent += `**Description:** ${ms.description}\n\n`;
    }

    summaryContent += `## Sibling Tasks in this Milestone\n`;
    summaryContent += `*These represent the broader initiative. DO NOT implement scope from other open tasks.*\n\n`;
    summaryContent += `| # | Title | Status | Labels |\n`;
    summaryContent += `| :--- | :--- | :--- | :--- |\n`;

    for (const sib of siblingIssues) {
      if (sib.pull_request) continue; // Exclude PR objects returned by issues API
      const isCurrent = sib.number === targetIssue.number ? ' **(Current Target)**' : '';
      const labels = (sib.labels || []).map((l) => typeof l === 'string' ? l : l.name).join(', ') || '-';
      summaryContent += `| #${sib.number} | ${sib.title}${isCurrent} | \`${sib.state}\` | ${labels} |\n`;
    }
  } else {
    // 2. Check for Parent Issue pattern (e.g. "Part of #123", "Parent: #123")
    const parentMatch = targetIssue.body ? targetIssue.body.match(/(?:Part of|Parent:|Epic:)\s*#(\d+)/i) : null;
    if (parentMatch) {
      const parentNum = parentMatch[1];
      console.log(`Detected Parent Issue reference: #${parentNum}`);
      try {
        const parentIssue = await fetchIssue(parentNum);
        summaryContent += `# Parent Issue: #${parentIssue.number} - ${parentIssue.title}\n\n`;
        summaryContent += `**Status:** ${parentIssue.state}\n\n`;
        summaryContent += `### Parent Scope Overview\n\n${parentIssue.body || 'No description'}\n\n`;
      } catch (err) {
        console.warn(`Warning: Could not fetch parent issue #${parentNum}:`, err.message);
      }
    }
  }

  if (!summaryContent) {
    summaryContent = `# Milestone / Parent Context\n\nNo parent milestone or parent issue detected for Issue #${targetIssue.number}.\n`;
  }

  fs.writeFileSync(path.join(epicDir, 'summary.md'), summaryContent, 'utf8');
}

async function buildLinkedIssues(targetIssue) {
  if (!targetIssue.body) return;

  // Find all #<id> references in target issue description
  const issueRefRegex = /#(\d+)/g;
  const referencedNumbers = new Set();
  let match;
  while ((match = issueRefRegex.exec(targetIssue.body)) !== null) {
    const num = parseInt(match[1], 10);
    if (num !== targetIssue.number) {
      referencedNumbers.add(num);
    }
  }

  const linkedDir = path.join(CONTEXT_DIR, 'linked');
  ensureDir(linkedDir);

  const directLinks = Array.from(referencedNumbers).slice(0, 3); // Cap at 3 1-hop issues
  if (directLinks.length === 0) return;

  console.log(`Fetching 1-hop linked issues: ${directLinks.map((n) => '#' + n).join(', ')}`);

  for (const linkedNum of directLinks) {
    try {
      const linkedIssue = await fetchIssue(linkedNum);
      if (linkedIssue.pull_request) continue; // Skip pull requests

      const linkedSubDir = path.join(linkedDir, String(linkedNum));
      await processIssueContext(linkedIssue, linkedSubDir);
      console.log(`Processed linked issue context for #${linkedNum}`);
    } catch (err) {
      console.warn(`Warning: Could not fetch linked issue #${linkedNum}:`, err.message);
    }
  }
}

async function main() {
  console.log(`====================================================`);
  console.log(`Preparing Context for Issue #${ISSUE_NUMBER} in ${GITHUB_REPOSITORY}`);
  console.log(`====================================================`);

  ensureDir(CONTEXT_DIR);

  // 1. Fetch Target Issue
  const targetIssue = await fetchIssue(ISSUE_NUMBER);
  const targetDir = path.join(CONTEXT_DIR, 'target');
  await processIssueContext(targetIssue, targetDir);
  console.log(`Successfully generated .context/target/issue.md`);

  // 2. Build Epic / Milestone Boundary Summary
  await buildEpicSummary(targetIssue);
  console.log(`Successfully generated .context/epic/summary.md`);

  // 3. Build 1-hop Linked Issues
  await buildLinkedIssues(targetIssue);

  console.log(`Issue context preparation completed successfully.`);
}

main().catch((err) => {
  console.error('Fatal error preparing issue context:', err);
  process.exit(1);
});
