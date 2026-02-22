const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Minimal placeholder function to satisfy the emulator
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Inspired Yoga Platform!");
});
