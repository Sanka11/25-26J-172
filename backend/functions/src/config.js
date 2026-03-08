const ML_BASE_URL =
  process.env.ML_BASE_URL ||
  "https://epithetically-wisest-kairi.ngrok-free.dev";

const ML_SERVICE_URL = ML_BASE_URL;
const ML_RISK_URL = `${ML_BASE_URL}/predict-risk`;
const ML_STRUGGLE_URL = `${ML_BASE_URL}/struggle`;
const ML_CAREER_RECOMMEND_URL = `${ML_BASE_URL}/career-readiness`;
const ML_RECOMMENDATION = `${ML_BASE_URL}/recommendations`;

module.exports = {
  ML_BASE_URL,
  ML_SERVICE_URL,
  ML_RISK_URL,
  ML_STRUGGLE_URL,
  ML_CAREER_RECOMMEND_URL,
  ML_RECOMMENDATION,
};
