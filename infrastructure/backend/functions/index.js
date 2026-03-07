const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

/**
 * Validates a display name for profanity and length.
 * Security: Enforces Auth, App Check, and Rate Limiting.
 */
exports.validateDisplayName = onCall({
  enforceAppCheck: true, // Reject requests from bots/scripts
  consumeAppCheckToken: false // We don't need to consume it for this simple check
}, async (request) => {
  // 1. Authentication Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to validate a name.");
  }

  const uid = request.auth.uid;
  const name = request.data.displayName;

  if (!name || typeof name !== "string") {
    throw new HttpsError("invalid-argument", "The function must be called with a 'displayName' string.");
  }

  // 2. Rate Limiting (Cooldown: 1 request per 2 seconds per user)
  const rateLimitRef = db.collection("_internal_rate_limits").doc(`validateName_${uid}`);
  const rateLimitDoc = await rateLimitRef.get();
  const now = Date.now();

  if (rateLimitDoc.exists) {
    const lastRequest = rateLimitDoc.data().lastRequest.toMillis();
    if (now - lastRequest < 2000) {
      throw new HttpsError("resource-exhausted", "Slow down! You are checking names too quickly.");
    }
  }

  // Update rate limit timestamp
  await rateLimitRef.set({ lastRequest: FieldValue.serverTimestamp() });

  // 3. Validation Logic
  if (name.length < 2 || name.length > 50) {
    return { isValid: false, reason: "Name must be between 2 and 50 characters." };
  }

  // Basic character set validation
  const validNameRegex = /^[a-zA-Z0-9\s.\-_]+$/;
  if (!validNameRegex.test(name)) {
    return { isValid: false, reason: "Name contains invalid characters." };
  }

  // Placeholder for Cloud Natural Language API scan
  if (name.toLowerCase().includes("badword")) {
    logger.info(`Rejected display name: ${name} for UID: ${uid} (Profanity detected)`);
    return { isValid: false, reason: "Please choose a more inspired name." };
  }

  return { isValid: true };
});
