const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ENV = import.meta.env.VITE_ENV || "local";
// savindi
//ssavindi admin
const GET_ALL_WORKLOADS_URL = `${BASE_URL}/getAllWorkloads`;
const UPDATE_TASK_COMPLETION_URL = `${BASE_URL}/updateTaskCompletion`;
const TRIGGER_WARNING_EMAIL_URL = `${BASE_URL}/triggerManualWarningEmail`;
//savindi student
const GENERATE_WORKLOAD_URL = `${BASE_URL}/generateWorkload`;
const CAREER_READINESS_URL = `${BASE_URL}/careerReadinessProxy`;
const GET_RECOMMENDATIONS_URL = `${BASE_URL}/getRecommendations`;
const PREDICT_STRUGGLE_URL = `${BASE_URL}/predictStruggle`;
// Quiz APIs -savindi
const CREATE_QUIZ_URL = `${BASE_URL}/createQuiz`;
const SUBMIT_QUIZ_URL = `${BASE_URL}/submitQuiz`;
const GET_QUIZZES_URL = `${BASE_URL}/getAllQuizzes`;
const GET_QUIZ_BY_ID_URL = `${BASE_URL}/fetchQuizByUser`;
const CHECK_LEVEL_URL = `${BASE_URL}/checkLevelUnlock`;
const GET_QUIZ_BY_LEVEL_URL = `${BASE_URL}/getQuizByLevel`;
const GET_WEEKLY_WORKLOAD_URL = `${BASE_URL}/getWeeklyWorkload`;
const GENERATE_LECTURE_ALERTS_URL = `${BASE_URL}/generateLectureAlerts`;
const GENERATE_BUSY_WEEK_REMINDERS_URL = `${BASE_URL}/generateBusyWeekReminders`;
const GET_ACTIVE_REMINDERS_URL = `${BASE_URL}/getActiveReminders`;
const DISMISS_REMINDER_URL = `${BASE_URL}/dismissReminder`;
const GET_STUDENT_ENROLLMENT_URL = `${BASE_URL}/getEnrolledSubjects`;
///

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

// Prediction APIs
const PREDICT_RISK_URL = `${BASE_URL}/predictRisk`;
const PREDICT_RISK_SHAP_URL = `${BASE_URL}/predictRiskShap`;
const PREDICT_NEXT_SEMESTER_URL = `${BASE_URL}/predictNextSemester`;
const GET_BULK_RISK_URL = `${BASE_URL}/getBulkRisk`;
const GET_STUDENT_RISK_URL = `${BASE_URL}/getStudentRiskExplanation`;
const UPDATE_STUDENT_MARKS_URL = `${BASE_URL}/updateStudentMarks`;
const GET_STUDENT_RISK_HISTORY_URL = `${BASE_URL}/getStudentRiskHistory`; // ← NEW

// Local ML Service
// app.main (chat/pdf endpoints) runs on 8002 by default in local development.
const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || "http://127.0.0.1:8002";
const ML_UPLOAD_URL = `${ML_BASE_URL}/upload_pdf`;
const ML_CHAT_URL = `${ML_BASE_URL}/chat`;
const ML_FEEDBACK_URL = `${ML_BASE_URL}/feedback`;
const ML_FEEDBACK_STATS_URL = `${ML_BASE_URL}/feedback/stats`;
const ML_LIST_DOCS_URL = `${ML_BASE_URL}/documents`;
const ML_INTERVENTION_REMINDER_URL = `${ML_BASE_URL}/student/intervention-reminder`;

// Academic APIs
const GET_ALL_DEADLINES_URL = `${BASE_URL}/getAllDeadlines`;
const GET_MODULE_INFO_URL = `${BASE_URL}/getModuleInfo`;
const GET_UPCOMING_DEADLINES_URL = `${BASE_URL}/getUpcomingDeadlines`;

export const appConfig = {
  ENV,

  // ML
  PREDICT_RISK_URL,
  PREDICT_RISK_SHAP_URL,
  PREDICT_NEXT_SEMESTER_URL,
  GET_BULK_RISK_URL,
  GET_STUDENT_RISK_URL,
  UPDATE_STUDENT_MARKS_URL,
  GET_STUDENT_RISK_HISTORY_URL, // ← NEW
  ML_BASE_URL,
  ML_UPLOAD_URL,
  ML_CHAT_URL,
  ML_FEEDBACK_URL,
  ML_FEEDBACK_STATS_URL,
  ML_LIST_DOCS_URL,
  ML_INTERVENTION_REMINDER_URL,

  // Quiz savindi
  CREATE_QUIZ_URL,
  SUBMIT_QUIZ_URL,
  GET_QUIZZES_URL,
  GET_QUIZ_BY_ID_URL,
  CHECK_LEVEL_URL,
  GET_QUIZ_BY_LEVEL_URL,
  GET_WEEKLY_WORKLOAD_URL,
  GENERATE_LECTURE_ALERTS_URL,
  GENERATE_BUSY_WEEK_REMINDERS_URL,
  GET_ACTIVE_REMINDERS_URL,
  DISMISS_REMINDER_URL,
  // savindi
  GET_ALL_WORKLOADS_URL,
  UPDATE_TASK_COMPLETION_URL,
  TRIGGER_WARNING_EMAIL_URL,

  GENERATE_WORKLOAD_URL,
  GET_RECOMMENDATIONS_URL,
  CAREER_READINESS_URL,
  PREDICT_STRUGGLE_URL,
  GET_STUDENT_ENROLLMENT_URL,

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
