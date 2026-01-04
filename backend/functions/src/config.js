/**
 * backend/functions/src/config.js
 *
 * Firebase Functions v2 / v7 compatible configuration
 * NO functions.config() usage
 * Safe for Emulator, Deployment, and PP1 demo
 */

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/predict-risk";
const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL ||
  "http://127.0.0.1:8000/recommendation";
const ML_STRUGGLE_URL =
  process.env.ML_STRUGGLE_URL || "http://127.0.0.1:8000/struggle";

module.exports = {
  ML_SERVICE_URL,
  RECOMMENDATION_SERVICE_URL,
  ML_STRUGGLE_URL,
};
