// frontend/src/config/env.js

const ENV = import.meta.env.VITE_ENV || "local";

const PREDICT_RISK_URL =
  import.meta.env.VITE_PREDICT_RISK_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictRisk";

const PREDICT_RECOMMENDATION_URL =
  import.meta.env.VITE_PREDICT_RECOMMENDATION_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictRecommendation";

const PREDICT_STRUGGLE_URL =
  import.meta.env.VITE_PREDICT_STRUGGLE_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictStruggle";

// Quiz APIs
const CREATE_QUIZ_URL =
  import.meta.env.VITE_CREATE_QUIZ_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/createQuiz";

const SUBMIT_QUIZ_URL =
  import.meta.env.VITE_SUBMIT_QUIZ_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/submitQuiz";

const GET_QUIZZES_URL =
  import.meta.env.VITE_GET_QUIZZES_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getQuizzes";

const GET_QUIZ_BY_ID_URL =
  import.meta.env.VITE_GET_QUIZ_BY_ID_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getQuizById";

const CHECK_LEVEL_URL =
  import.meta.env.VITE_CHECK_LEVEL_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/checkLevelUnlock"; 
  
  
const GET_USER_LEVEL_URL =
  import.meta.env.VITE_GET_USER_LEVEL_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getUserLevel";  

export const appConfig = {
  ENV,

  // ML
  PREDICT_RISK_URL,
  PREDICT_RECOMMENDATION_URL,
  PREDICT_STRUGGLE_URL,

  // Quiz
  CREATE_QUIZ_URL,
  SUBMIT_QUIZ_URL,
  GET_QUIZZES_URL,
  GET_QUIZ_BY_ID_URL,
  CHECK_LEVEL_URL,
  GET_USER_LEVEL_URL,
};
