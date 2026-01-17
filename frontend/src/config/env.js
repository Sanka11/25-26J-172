// frontend/src/config/env.js

// const ENV = import.meta.env.VITE_ENV || "local";

// const PREDICT_RISK_URL =
//   import.meta.env.VITE_PREDICT_RISK_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictRisk";

// const PREDICT_RECOMMENDATION_URL =
//   import.meta.env.VITE_PREDICT_RECOMMENDATION_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictRecommendation";

// const PREDICT_STRUGGLE_URL =
//   import.meta.env.VITE_PREDICT_STRUGGLE_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/predictStruggle";

// // Quiz APIs
// const CREATE_QUIZ_URL =
//   import.meta.env.VITE_CREATE_QUIZ_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/createQuiz";

// const SUBMIT_QUIZ_URL =
//   import.meta.env.VITE_SUBMIT_QUIZ_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/submitQuiz";

// const GET_QUIZZES_URL =
//   import.meta.env.VITE_GET_QUIZZES_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getAllQuizzes";

// const GET_QUIZ_BY_ID_URL =
//   import.meta.env.VITE_GET_QUIZ_BY_ID_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/fetchQuizByUser";

// const CHECK_LEVEL_URL =
//   import.meta.env.VITE_CHECK_LEVEL_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/checkLevelUnlock";

// const GET_QUIZ_BY_LEVEL_URL =
//   import.meta.env.VITE_GET_QUIZ_BY_LEVEL_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getQuizByLevel";

// // Announcements
// const CREATE_ANNOUNCEMENT_URL =
//   import.meta.env.VITE_CREATE_ANNOUNCEMENT_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/createAnnouncement";

// const GET_ANNOUNCEMENTS_URL =
//   import.meta.env.VITE_GET_ANNOUNCEMENTS_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getAnnouncements";

// const UPDATE_ANNOUNCEMENT_URL =
//   import.meta.env.VITE_UPDATE_ANNOUNCEMENT_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/updateAnnouncement";

// const DELETE_ANNOUNCEMENT_URL =
//   import.meta.env.VITE_DELETE_ANNOUNCEMENT_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/deleteAnnouncement";

// // Chatbot feedback
// const SUBMIT_CHAT_FEEDBACK_URL =
//   import.meta.env.VITE_SUBMIT_CHAT_FEEDBACK_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/submitChatFeedback";

// const GET_CHAT_FEEDBACK_STATS_URL =
//   import.meta.env.VITE_GET_CHAT_FEEDBACK_STATS_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/getChatFeedbackStats";

// const LIST_CHAT_FEEDBACK_URL =
//   import.meta.env.VITE_LIST_CHAT_FEEDBACK_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/listChatFeedback";

// const DELETE_CHAT_FEEDBACK_URL =
//   import.meta.env.VITE_DELETE_CHAT_FEEDBACK_URL ||
//   "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/deleteChatFeedback";

// // Direct ML service endpoints (local FastAPI)
// const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || "http://127.0.0.1:8000";

// const ML_UPLOAD_URL =
//   import.meta.env.VITE_ML_UPLOAD_URL || `${ML_BASE_URL}/upload_pdf`;

// const ML_CHAT_URL = import.meta.env.VITE_ML_CHAT_URL || `${ML_BASE_URL}/chat`;

// const ML_FEEDBACK_URL =
//   import.meta.env.VITE_ML_FEEDBACK_URL || `${ML_BASE_URL}/feedback`;

// const ML_LIST_DOCS_URL =
//   import.meta.env.VITE_ML_LIST_DOCS_URL || `${ML_BASE_URL}/documents`;

// export const appConfig = {
//   ENV,

//   // ML
//   PREDICT_RISK_URL,
//   ML_BASE_URL,
//   ML_UPLOAD_URL,
//   ML_CHAT_URL,
//   ML_FEEDBACK_URL,
//   ML_LIST_DOCS_URL,
//   PREDICT_RECOMMENDATION_URL,
//   PREDICT_STRUGGLE_URL,

//   // Quiz
//   CREATE_QUIZ_URL,
//   SUBMIT_QUIZ_URL,
//   GET_QUIZZES_URL,
//   GET_QUIZ_BY_ID_URL,
//   CHECK_LEVEL_URL,
//   GET_QUIZ_BY_LEVEL_URL,

//   // Announcements
//   CREATE_ANNOUNCEMENT_URL,
//   GET_ANNOUNCEMENTS_URL,
//   UPDATE_ANNOUNCEMENT_URL,
//   DELETE_ANNOUNCEMENT_URL,

//   // Chatbot feedback
//   SUBMIT_CHAT_FEEDBACK_URL,
//   GET_CHAT_FEEDBACK_STATS_URL,
//   LIST_CHAT_FEEDBACK_URL,
//   DELETE_CHAT_FEEDBACK_URL,
// };
// frontend/src/config/env.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL ;

const ENV = import.meta.env.VITE_ENV || "local";

// Prediction APIs
const PREDICT_RISK_URL = `${BASE_URL}/predictRisk`;
const PREDICT_RECOMMENDATION_URL = `${BASE_URL}/predictRecommendation`;
const PREDICT_STRUGGLE_URL = `${BASE_URL}/predictStruggle`;

// Quiz APIs
const CREATE_QUIZ_URL = `${BASE_URL}/createQuiz`;
const SUBMIT_QUIZ_URL = `${BASE_URL}/submitQuiz`;
const GET_QUIZZES_URL = `${BASE_URL}/getAllQuizzes`;
const GET_QUIZ_BY_ID_URL = `${BASE_URL}/fetchQuizByUser`;
const CHECK_LEVEL_URL = `${BASE_URL}/checkLevelUnlock`;
const GET_QUIZ_BY_LEVEL_URL = `${BASE_URL}/getQuizByLevel`;

// Announcements
const CREATE_ANNOUNCEMENT_URL = `${BASE_URL}/createAnnouncement`;
const GET_ANNOUNCEMENTS_URL = `${BASE_URL}/getAnnouncements`;
const UPDATE_ANNOUNCEMENT_URL = `${BASE_URL}/updateAnnouncement`;
const DELETE_ANNOUNCEMENT_URL = `${BASE_URL}/deleteAnnouncement`;

// Chatbot feedback
const SUBMIT_CHAT_FEEDBACK_URL = `${BASE_URL}/submitChatFeedback`;
const GET_CHAT_FEEDBACK_STATS_URL = `${BASE_URL}/getChatFeedbackStats`;
const LIST_CHAT_FEEDBACK_URL = `${BASE_URL}/listChatFeedback`;
const DELETE_CHAT_FEEDBACK_URL = `${BASE_URL}/deleteChatFeedback`;

// Local ML Service
const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || "http://127.0.0.1:8000";
const ML_UPLOAD_URL = `${ML_BASE_URL}/upload_pdf`;
const ML_CHAT_URL = `${ML_BASE_URL}/chat`;
const ML_FEEDBACK_URL = `${ML_BASE_URL}/feedback`;
const ML_LIST_DOCS_URL = `${ML_BASE_URL}/documents`;

export const appConfig = {
  ENV,

  // ML
  PREDICT_RISK_URL,
  ML_BASE_URL,
  ML_UPLOAD_URL,
  ML_CHAT_URL,
  ML_FEEDBACK_URL,
  ML_LIST_DOCS_URL,
  PREDICT_RECOMMENDATION_URL,
  PREDICT_STRUGGLE_URL,

  // Quiz
  CREATE_QUIZ_URL,
  SUBMIT_QUIZ_URL,
  GET_QUIZZES_URL,
  GET_QUIZ_BY_ID_URL,
  CHECK_LEVEL_URL,
  GET_QUIZ_BY_LEVEL_URL,

  // Announcements
  CREATE_ANNOUNCEMENT_URL,
  GET_ANNOUNCEMENTS_URL,
  UPDATE_ANNOUNCEMENT_URL,
  DELETE_ANNOUNCEMENT_URL,

  // Chatbot feedback
  SUBMIT_CHAT_FEEDBACK_URL,
  GET_CHAT_FEEDBACK_STATS_URL,
  LIST_CHAT_FEEDBACK_URL,
  DELETE_CHAT_FEEDBACK_URL,
};
