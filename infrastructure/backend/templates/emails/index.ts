/**
 * Inspired Transactional Email Template Manager
 * Centralized email templates for studio verification, claim approvals, and admin notifications.
 */

export interface EmailTemplatePayload {
  ownerName?: string;
  applicantName?: string;
  studioName?: string;
  locationPrefix?: string;
  address?: string;
  websiteUrl?: string;
  privacyUrl?: string;
  termsUrl?: string;
  dashboardUrl?: string;
  claimUrl?: string;
  supportUrl?: string;
  verificationCode?: string;
  rejectionReason?: string;
  stagingUrl?: string;
  invitedEmail?: string;
}

/** Render simple mustache-like variables in HTML template */
export function renderEmailTemplate(templateHtml: string, data: EmailTemplatePayload): string {
  let output = templateHtml;

  // Handle conditional Handlebars blocks: {{#if rejectionReason}} ... {{/if}}
  if (data.rejectionReason && data.rejectionReason.trim().length > 0) {
    output = output.replace(/\{\{#if rejectionReason\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    output = output.replace(/\{\{#if rejectionReason\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // Replace variable placeholders: {{variableName}}
  const replacements: Record<string, string> = {
    ownerName: data.ownerName || 'Studio Owner',
    applicantName: data.applicantName || 'Applicant',
    studioName: data.studioName || 'Yoga Studio',
    locationPrefix: data.locationPrefix || 'W12',
    address: data.address || '',
    websiteUrl: data.websiteUrl || 'https://inspired.yoga',
    privacyUrl: data.privacyUrl || 'https://inspired.yoga/privacy',
    termsUrl: data.termsUrl || 'https://inspired.yoga/terms',
    dashboardUrl: data.dashboardUrl || 'https://inspired.yoga/my-studios',
    claimUrl: data.claimUrl || 'https://inspired.yoga/claim-studio',
    supportUrl: data.supportUrl || 'https://inspired.yoga/support',
    verificationCode: data.verificationCode || '000000',
    rejectionReason: data.rejectionReason || '',
    stagingUrl: data.stagingUrl || 'https://inspired-yoga-app-staging.web.app',
    invitedEmail: data.invitedEmail || '',
  };

  Object.entries(replacements).forEach(([key, val]) => {
    const regExp = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    output = output.replace(regExp, val);
  });

  return output;
}
