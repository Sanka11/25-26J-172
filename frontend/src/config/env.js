// frontend/src/config/env.js

const ENV = import.meta.env.VITE_ENV || "local";

const PREDICT_RISK_URL =
  import.meta.env.VITE_PREDICT_RISK_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictRisk";
  const PREDICT_RECOMMENDATION_URL =
    import.meta.env.VITE_PREDICT_RECOMMENDATION_URL ||
    "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictRecommendation";

export const appConfig = {
  ENV,
  PREDICT_RISK_URL,
  PREDICT_RECOMMENDATION_URL,
};
