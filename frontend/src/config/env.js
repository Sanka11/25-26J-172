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

// Announcements
const CREATE_ANNOUNCEMENT_URL =
  import.meta.env.VITE_CREATE_ANNOUNCEMENT_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/createAnnouncement";

const GET_ANNOUNCEMENTS_URL =
  import.meta.env.VITE_GET_ANNOUNCEMENTS_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getAnnouncements";

const UPDATE_ANNOUNCEMENT_URL =
  import.meta.env.VITE_UPDATE_ANNOUNCEMENT_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/updateAnnouncement";

const DELETE_ANNOUNCEMENT_URL =
  import.meta.env.VITE_DELETE_ANNOUNCEMENT_URL ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/deleteAnnouncement";

// Direct ML service endpoints (local FastAPI)
const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || "http://127.0.0.1:8000";

const ML_UPLOAD_URL =
  import.meta.env.VITE_ML_UPLOAD_URL || `${ML_BASE_URL}/upload_pdf`;

const ML_CHAT_URL = import.meta.env.VITE_ML_CHAT_URL || `${ML_BASE_URL}/chat`;

const ML_FEEDBACK_URL =
  import.meta.env.VITE_ML_FEEDBACK_URL || `${ML_BASE_URL}/feedback`;

export const appConfig = {
  ENV,

  // ML
  PREDICT_RISK_URL,
  ML_BASE_URL,
  ML_UPLOAD_URL,
  ML_CHAT_URL,
  ML_FEEDBACK_URL,
  PREDICT_RECOMMENDATION_URL,
  PREDICT_STRUGGLE_URL,

  // Quiz
  CREATE_QUIZ_URL,
  SUBMIT_QUIZ_URL,
  GET_QUIZZES_URL,
  GET_QUIZ_BY_ID_URL,
  CHECK_LEVEL_URL,
  GET_USER_LEVEL_URL,

  // Announcements
  CREATE_ANNOUNCEMENT_URL,
  GET_ANNOUNCEMENTS_URL,
  UPDATE_ANNOUNCEMENT_URL,
  DELETE_ANNOUNCEMENT_URL,
};
