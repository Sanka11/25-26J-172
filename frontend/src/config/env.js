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
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getAllQuizzes";

const GET_QUIZ_BY_ID_URL =
  import.meta.env.VITE_GET_QUIZ_BY_ID_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/fetchQuizByUser";

const GET_QUIZ_BY_LEVEL_URL =
  import.meta.env.GET_QUIZ_BY_LEVEL_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getQuizByLevel";

const GET_USER_LEVEL_URL =
  import.meta.env.VITE_GET_USER_LEVEL_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getUserLevel";

// ML service PDF upload
const ML_UPLOAD_URL =
  import.meta.env.VITE_ML_UPLOAD_URL || "http://127.0.0.1:8000/upload_pdf";

// ML service chatbot (RAG)
const ML_CHAT_URL =
  import.meta.env.VITE_ML_CHAT_URL || "http://127.0.0.1:8000/chat";

// ML service feedback endpoint
const ML_FEEDBACK_URL =
  import.meta.env.VITE_ML_FEEDBACK_URL || "http://127.0.0.1:8000/feedback";

export const appConfig = {
  ENV,

  // ML
  PREDICT_RISK_URL,
  PREDICT_RECOMMENDATION_URL,
  PREDICT_STRUGGLE_URL,

  // ML PDF upload
  ML_UPLOAD_URL,

  // Chatbot + feedback
  ML_CHAT_URL,
  ML_FEEDBACK_URL,

  // Quiz
  CREATE_QUIZ_URL,
  SUBMIT_QUIZ_URL,
  GET_QUIZZES_URL,
  GET_QUIZ_BY_ID_URL,
  GET_QUIZ_BY_LEVEL_URL,
  GET_USER_LEVEL_URL,
};
