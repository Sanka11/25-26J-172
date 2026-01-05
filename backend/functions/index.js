// ================================
// Firebase main entry (REQUIRED)
// ================================

// Quiz controllers
const {
  createQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizByLevel,
  fetchQuizByUser,
} = require("./src/http/quizController");

// ML controllers
const { predictRisk } = require("./src/http/mlProxy");
const { predictRecommendation } = require("./src/http/mlRecommendationProxy");

// Student risk explainability controller
const {
  getStudentRiskExplanation,
} = require("./src/http/studentRiskExplanation");

// ✅ Student risk history (semester-wise temporal tracking)
const { getStudentRiskHistory } = require("./src/http/temporalRiskController");

// Announcement controllers
const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require("./src/http/announcementController");

// Chat feedback controllers
const {
  submitChatFeedback,
  getChatFeedbackStats,
  listChatFeedback,
  deleteChatFeedback,
} = require("./src/http/chatFeedbackController");

// -------------------------------
// Express API (RL, disengagement, etc.)
// -------------------------------
exports.api = require("./api").api;

// -------------------------------
// Quiz exports
// -------------------------------
exports.createQuiz = createQuiz;
exports.submitQuiz = submitQuiz;
exports.getAllQuizzes = getAllQuizzes;
exports.getQuizByLevel = getQuizByLevel;
exports.fetchQuizByUser = fetchQuizByUser;

// -------------------------------
// ML exports
// -------------------------------
exports.predictRisk = predictRisk;
exports.predictRecommendation = predictRecommendation;

// -------------------------------
// Student risk APIs
// -------------------------------
exports.getStudentRiskExplanation = getStudentRiskExplanation;
exports.getStudentRiskHistory = getStudentRiskHistory;

// -------------------------------
// Announcement APIs
// -------------------------------
exports.createAnnouncement = createAnnouncement;
exports.getAnnouncements = getAnnouncements;
exports.updateAnnouncement = updateAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;

// -------------------------------
// Chat feedback APIs
// -------------------------------
exports.submitChatFeedback = submitChatFeedback;
exports.getChatFeedbackStats = getChatFeedbackStats;
exports.listChatFeedback = listChatFeedback;
exports.deleteChatFeedback = deleteChatFeedback;
