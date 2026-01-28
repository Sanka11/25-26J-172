/**
 * Central ML-service configuration
 * Safe for local, emulator, and production
 */

// const ML_BASE_URL = process.env.ML_BASE_URL || "http://127.0.0.1:8000";

// const ML_RISK_URL = `${ML_BASE_URL}/predict-risk`;
// const ML_STRUGGLE_URL = `${ML_BASE_URL}/struggle`;
// const ML_CAREER_RECOMMEND_URL = `${ML_BASE_URL}/recommend/career`;

// module.exports = {
//   ML_BASE_URL,
//   ML_RISK_URL,
//   ML_STRUGGLE_URL,
//   ML_CAREER_RECOMMEND_URL,
// };
const ML_BASE_URL = process.env.ML_BASE_URL || "http://127.0.0.1:8000";

const ML_RISK_URL = `${ML_BASE_URL}/predict-risk`;
const ML_STRUGGLE_URL = `${ML_BASE_URL}/struggle`;
const ML_CAREER_RECOMMEND_URL = `${ML_BASE_URL}/career-readiness`;
const ML_COGNITIVE_LOAD_URL = `${ML_BASE_URL}/cognitive-load`;

module.exports = {
  ML_BASE_URL,
  ML_RISK_URL,
  ML_STRUGGLE_URL,
  ML_CAREER_RECOMMEND_URL,
  ML_COGNITIVE_LOAD_URL,
};
