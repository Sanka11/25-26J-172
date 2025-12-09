// backend/functions/src/config.js
const functions = require("firebase-functions");

const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

/**
 * ML_SERVICE_URL:
 *  For your previous risk model -> /predict-risk
 * RECOMMENDATION_SERVICE_URL:
 *  For your new recommendation ML model -> /recommend
 */
const ML_SERVICE_URL = isEmulator
  ? "http://127.0.0.1:8000/predict-risk"
  : (functions.config().ml && functions.config().ml.service_url) ||
    "https://your-ml-service-domain.com/predict-risk";

const RECOMMENDATION_SERVICE_URL = isEmulator
  ? "http://127.0.0.1:8000/recommend" // FIXED HERE
  : (functions.config().ml && functions.config().ml.recommendation_url) ||
    "https://your-ml-service-domain.com/recommend"; // FIXED HERE

module.exports = {
  ML_SERVICE_URL,
  RECOMMENDATION_SERVICE_URL,
};