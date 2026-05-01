require("dotenv").config();

// Quiz controllers
const {
  createQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizByLevel,
  fetchQuizByUser,
} = require("./src/http/quizController");
const {
  getAllWorkloads,
  updateTaskCompletion,
  triggerManualWarningEmail,
} = require("./src/http/adminWorkloadController");
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
const {
  predictRisk,
  predictRiskShap,
  predictNextSemester,
  getBulkRisk,
} = require("./src/http/mlProxy");

// Student risk explainability controller
const {
  getStudentRiskExplanation,
  updateStudentMarks,
  getStudentRiskHistory,
} = require("./src/http/studentRiskExplanation");

// Student profile management (it22354792)
const {
  createStudentProfile,
  bulkCreateStudentProfiles,
  checkStudentIdExists,
} = require("./src/http/studentProfileController");

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

// Academic data (deadlines)
const {
  getAllDeadlines,
  getModuleInfo,
  getUpcomingDeadlines,
} = require("./src/http/academicDataController");

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
// Workload savindi
// -------------------------------
exports.getAllWorkloads = getAllWorkloads;
exports.updateTaskCompletion = updateTaskCompletion;
exports.triggerManualWarningEmail = triggerManualWarningEmail;

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
exports.predictRiskShap = predictRiskShap;
exports.predictNextSemester = predictNextSemester;
exports.getBulkRisk = getBulkRisk;

// -------------------------------
// Student risk APIs
// -------------------------------
exports.getStudentRiskExplanation = getStudentRiskExplanation;
exports.updateStudentMarks = updateStudentMarks;
exports.getStudentRiskHistory = getStudentRiskHistory;

// -------------------------------
// Student profile management (it22354792)
// -------------------------------
exports.createStudentProfile = createStudentProfile;
exports.bulkCreateStudentProfiles = bulkCreateStudentProfiles;
exports.checkStudentIdExists = checkStudentIdExists;

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

// -------------------------------
// Academic data APIs
// -------------------------------
exports.getAllDeadlines = getAllDeadlines;
exports.getModuleInfo = getModuleInfo;
exports.getUpcomingDeadlines = getUpcomingDeadlines;
