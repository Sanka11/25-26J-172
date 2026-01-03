// backend/functions/src/config.js
const functions = require("firebase-functions");

// Are we running in the local emulator?
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";


const ML_SERVICE_URL = isEmulator ?
  "http://127.0.0.1:8000/predict-risk" :
  (functions.config().ml && functions.config().ml.service_url) ||
    "https://your-ml-service-domain.com/predict-risk";
// replace later when you deploy
const RECOMMENDATION_SERVICE_URL = isEmulator ?
  "http://127.0.0.1:8000/recommendation" :
  (functions.config().ml && functions.config().ml.recommendation_url) ||
    "https://your-ml-service-domain.com/recommendation";


const ML_STRUGGLE_URL = isEmulator
  ? "http://127.0.0.1:8000/struggle"
  : (functions.config().ml && functions.config().ml.struggle_url) ||
    "https://your-ml-service-domain.com/struggle";
module.exports = {
  ML_SERVICE_URL,
  RECOMMENDATION_SERVICE_URL,
  ML_STRUGGLE_URL,
};
