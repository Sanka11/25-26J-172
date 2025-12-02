// backend/functions/src/config.js
const functions = require("firebase-functions");

// Are we running in the local emulator?
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

/**
 * ML_SERVICE_URL:
 *  - When using emulator locally → points to your laptop's FastAPI (8000)
 *  - When deployed → uses Firebase Functions config (ml.service_url)
 */
const ML_SERVICE_URL = isEmulator ?
  "http://127.0.0.1:8000/predict-risk" :
  (functions.config().ml && functions.config().ml.service_url) ||
    "https://your-ml-service-domain.com/predict-risk";
// replace later when you deploy
const RECOMMENDATION_SERVICE_URL = isEmulator ?
  "http://127.0.0.1:8000/recommendation" :
  (functions.config().ml && functions.config().ml.recommendation_url) ||
    "https://your-ml-service-domain.com/recommendation";

module.exports = {
  ML_SERVICE_URL,
  RECOMMENDATION_SERVICE_URL,
};
