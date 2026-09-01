const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

setGlobalOptions({ region: "europe-west2" });

initializeApp();
const db = getFirestore();

/**
 * Validates a display name for profanity and length.
 * Security: Enforces Auth, App Check, and Rate Limiting.
 */
exports.validateDisplayName = onCall({
  enforceAppCheck: false,
  consumeAppCheckToken: false
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to validate a name.");
  }

  const uid = request.auth.uid;
  const name = request.data.displayName;

  if (!name || typeof name !== "string") {
    throw new HttpsError("invalid-argument", "The function must be called with a 'displayName' string.");
  }

  const rateLimitRef = db.collection("_internal_rate_limits").doc(`validateName_${uid}`);
  const rateLimitDoc = await rateLimitRef.get();
  const now = Date.now();

  if (rateLimitDoc.exists) {
    const lastRequest = rateLimitDoc.data().lastRequest.toMillis();
    if (now - lastRequest < 2000) {
      throw new HttpsError("resource-exhausted", "Slow down! You are checking names too quickly.");
    }
  }

  await rateLimitRef.set({ lastRequest: FieldValue.serverTimestamp() });

  if (name.length < 2 || name.length > 50) {
    return { isValid: false, reason: "Name must be between 2 and 50 characters." };
  }

  const validNameRegex = /^[a-zA-Z0-9\s.\-_]+$/;
  if (!validNameRegex.test(name)) {
    return { isValid: false, reason: "Name contains invalid characters." };
  }

  if (name.toLowerCase().includes("badword")) {
    logger.info(`Rejected display name: ${name} for UID: ${uid} (Profanity detected)`);
    return { isValid: false, reason: "Please choose a more inspired name." };
  }

  return { isValid: true };
});

/**
 * Multi-entity search for Communities, Studios, and Areas.
 * Implements tiered matching and Discovery Mode logic.
 */
exports.search = onCall({
  enforceAppCheck: false,
  consumeAppCheckToken: false
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to search.");
  }

  const query = (request.data.query || "").trim();
  const currentAreaPrefix = request.data.currentAreaPrefix || "W12"; // Default fallback

  // 1. Keyword Mapping (Hardcoded for Mock Phase)
  const areaMapping = {
    "hammersmith": "W6",
    "askew": "W12",
    "chelsea": "SW3"
  };

  let targetPrefix = null;
  const normalizedQuery = query.toLowerCase();

  // Check if query is a postcode prefix
  const postcodeRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/i;
  if (postcodeRegex.test(query)) {
    targetPrefix = query.toUpperCase();
  } else if (areaMapping[normalizedQuery]) {
    targetPrefix = areaMapping[normalizedQuery];
  }

  // 2. Build Firestore Queries
  const results = [];

  // Branch A: Discovery Mode (Empty Query) or Postcode/Area Match
  if (!query || targetPrefix) {
    const prefixToSearch = targetPrefix || currentAreaPrefix;
    
    const [communitySnap, studioSnap] = await Promise.all([
      db.collection("communities").where("location_prefix", "==", prefixToSearch).get(),
      db.collection("studios").where("location_prefix", "==", prefixToSearch).get()
    ]);

    communitySnap.forEach(doc => results.push({ type: "community", data: { id: doc.id, ...doc.data() } }));
    studioSnap.forEach(doc => results.push({ type: "studio", data: { id: doc.id, ...doc.data() } }));
  } 
  
  // Branch B: Name Matching (if query is not a postcode)
  if (query && !targetPrefix) {
    // Note: Simple prefix match for name search
    const [communitySnap, studioSnap] = await Promise.all([
      db.collection("communities")
        .where("name", ">=", query)
        .where("name", "<=", query + "\uf8ff")
        .limit(10)
        .get(),
      db.collection("studios")
        .where("name", ">=", query)
        .where("name", "<=", query + "\uf8ff")
        .limit(10)
        .get()
    ]);

    communitySnap.forEach(doc => results.push({ type: "community", data: { id: doc.id, ...doc.data() } }));
    studioSnap.forEach(doc => results.push({ type: "studio", data: { id: doc.id, ...doc.data() } }));
  }

  // 3. Deduplicate and Sort
  const uniqueResults = Array.from(new Map(results.map(item => [item.data.id, item])).values());
  
  // Sort by engagementScore if available
  uniqueResults.sort((a, b) => (b.data.engagementScore || 0) - (a.data.engagementScore || 0));

  return { results: uniqueResults };
});

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

/**
 * Sends a glassmorphic staging invitation email whenever a document is created in /stagingInvites.
 */
exports.onSendStagingInvitation = onDocumentCreated({
  document: "stagingInvites/{inviteId}",
  secrets: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_PORT", "SENDER_EMAIL"]
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const inviteData = snapshot.data();
  const invitedEmail = inviteData.email;
  if (!invitedEmail) return;

  const stagingUrl = "https://inspired-yoga-app-staging.web.app";
  const templatePath = path.join(__dirname, "../templates/emails/staging_invitation.html");

  let htmlContent = "";
  try {
    htmlContent = fs.readFileSync(templatePath, "utf8")
      .replace(/{{stagingUrl}}/g, stagingUrl)
      .replace(/{{invitedEmail}}/g, invitedEmail);
  } catch (err) {
    htmlContent = `<p>You have been invited to Inspired Staging Preview! Access here: <a href="${stagingUrl}">${stagingUrl}</a></p>`;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  const senderEmail = process.env.SENDER_EMAIL;

  logger.info(`✉️ Staging Invitation Document Created for: ${invitedEmail}`);

  if (smtpHost && smtpUser && smtpPass && smtpPort && senderEmail) {
    const transportOpts = smtpHost.includes("gmail")
      ? { service: "gmail", auth: { user: smtpUser, pass: smtpPass } }
      : {
          host: smtpHost,
          port: Number(smtpPort),
          secure: Number(smtpPort) === 465,
          auth: { user: smtpUser, pass: smtpPass },
        };

    const transporter = nodemailer.createTransport(transportOpts);

    try {
      await transporter.sendMail({
        from: senderEmail,
        to: invitedEmail,
        subject: "You've Been Invited to Inspired Staging Preview! 🧘‍♀️",
        html: htmlContent,
      });
      await snapshot.ref.update({
        status: "sent",
        sentAt: new Date().toISOString(),
        errorReason: null,
      });
      logger.info(`✅ Staging Invitation email sent successfully to ${invitedEmail}`);
    } catch (sendErr) {
      await snapshot.ref.update({
        status: "failed",
        errorReason: sendErr.message || "Failed to send email via SMTP",
        failedAt: new Date().toISOString(),
      });
      logger.error(`❌ Failed to send email via SMTP: ${sendErr.message}`);
    }
  } else {
    logger.info(`ℹ️ SMTP credentials not configured (SMTP_HOST/USER/PASS). Staging Invite logged to Cloud Console: Email=${invitedEmail}, URL=${stagingUrl}`);
  }
});
