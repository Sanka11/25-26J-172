// Quiz controllers

const {
  createQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizByLevel,
  fetchQuizByUser,
} = require("./src/http/quizController");

const {
  generateWorkload,
  generateLectureAlerts,
  getWeeklyWorkload,
  generateOverloadReminders,
  dismissReminder,
  getActiveReminders,
  generateBusyWeekReminders,
  getEnrolledSubjects,
} = require("./src/http/workloadController");
// recommendation savindi
const { getRecommendations } = require("./src/http/recommendationProxy");
const { dailyWorkloadEmailScheduler } = require("./src/http/emailScheduler");

// ML controllers
const { predictRisk } = require("./src/http/mlProxy");

// Student risk explainability controller
const {
  getStudentRiskExplanation,
} = require("./src/http/studentRiskExplanation");

// Student risk history (temporal tracking)
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


// Express API (for RL & disengagement etc.)
exports.api = require("./api").api;
// -------------------------------
// Recommendation savindi
// -------------------------------
exports.getRecommendations = getRecommendations;

// -------------------------------
// Quiz exports savindi
// -------------------------------
exports.createQuiz = createQuiz;
exports.submitQuiz = submitQuiz;
exports.getAllQuizzes = getAllQuizzes;
exports.getQuizByLevel = getQuizByLevel;
exports.fetchQuizByUser = fetchQuizByUser;

// -------------------------------
// workload savindi
// -------------------------------
exports.generateLectureAlerts = generateLectureAlerts;
exports.getWeeklyWorkload = getWeeklyWorkload;
exports.generateOverloadReminders = generateOverloadReminders;
exports.dismissReminder = dismissReminder;
exports.getActiveReminders = getActiveReminders;
exports.generateBusyWeekReminders = generateBusyWeekReminders;
exports.getEnrolledSubjects = getEnrolledSubjects;
exports.generateWorkload = generateWorkload;
exports.dailyWorkloadEmailScheduler = dailyWorkloadEmailScheduler;

// -------------------------------
// ML exports
// -------------------------------
exports.predictRisk = predictRisk;

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

// academic data (deadlines)

const {
  getAllDeadlines,
  getModuleInfo,
  getUpcomingDeadlines,
} = require("./src/http/academicDataController");

exports.getAllDeadlines = getAllDeadlines;
exports.getModuleInfo = getModuleInfo;
exports.getUpcomingDeadlines = getUpcomingDeadlines;
