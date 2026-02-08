
const BASE_URL = import.meta.env.VITE_API_BASE_URL ;

const ENV = import.meta.env.VITE_ENV || "local";
// Workload / Timetable APIs
const GENERATE_WORKLOAD_URL = `${BASE_URL}/generateWorkload`;
const GET_DAILY_WORKLOAD_URL = `${BASE_URL}/getDailyWorkload`;
const CREATE_SUBJECT_URL = `${BASE_URL}/createSubject`;
const ENROLL_INTERNSHIP_URL = `${BASE_URL}/enrollInternship`;
const ENROLL_SUBJECT_URL = `${BASE_URL}/enrollSubject`;
const GET_STUDENT_ENROLLMENT_URL = `${BASE_URL}/getStudentEnrollment`;
const GET_ALL_SUBJECTS_URL = `${BASE_URL}/getAllSubjects`;

// Prediction APIs
const PREDICT_RISK_URL = `${BASE_URL}/predictRisk`;
const PREDICT_STRUGGLE_URL = `${BASE_URL}/predictStruggle`;
// Career Recommendation (Knowledge Graph)
const CAREER_READINESS_URL = `${BASE_URL}/careerReadinessProxy`;
const COGNITIVE_LOAD_URL = `${BASE_URL}/detectCognitiveLoad`;

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
  CAREER_READINESS_URL,
  COGNITIVE_LOAD_URL,
  PREDICT_STRUGGLE_URL,

  // Quiz
  CREATE_QUIZ_URL,
  SUBMIT_QUIZ_URL,
  GET_QUIZZES_URL,
  GET_QUIZ_BY_ID_URL,
  CHECK_LEVEL_URL,
  GET_QUIZ_BY_LEVEL_URL,
  // Workload APIs ✅
  GENERATE_WORKLOAD_URL,
  GET_DAILY_WORKLOAD_URL,
  CREATE_SUBJECT_URL,
  ENROLL_INTERNSHIP_URL,
  ENROLL_SUBJECT_URL,
  GET_STUDENT_ENROLLMENT_URL,
  GET_ALL_SUBJECTS_URL,
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
