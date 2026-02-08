// Quiz controllers
const {
  createQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizByLevel,
  fetchQuizByUser,
} = require("./src/http/quizController");
const {
  createSubject,
  getAllSubjects,
} = require("./src/http/subjectController");
const {
  enrollSubject,
  getStudentEnrollment,
} = require("./src/http/enrollmentController");
const { enrollInternship } = require("./src/http/internshipController");
const { generateStudentTodos } = require("./src/http/todoController");


const {
  generateWorkload,
  getDailyWorkload,
} = require("./src/http/workloadController");
// ML controllers
const { predictRisk } = require("./src/http/mlProxy");
const { careerReadinessProxy } = require("./src/http/mlRecommendationProxy");
const { detectCognitiveLoad } = require("./src/http/mlCognitiveLoadProxy");
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
// Quiz exports
// -------------------------------
exports.createQuiz = createQuiz;
exports.submitQuiz = submitQuiz;
exports.getAllQuizzes = getAllQuizzes;
exports.getQuizByLevel = getQuizByLevel;
exports.fetchQuizByUser = fetchQuizByUser;
exports.generateWorkload = generateWorkload;
exports.getDailyWorkload = getDailyWorkload;
exports.createSubject = createSubject;
exports.getAllSubjects = getAllSubjects;

exports.enrollSubject = enrollSubject;
exports.getStudentEnrollment = getStudentEnrollment;
exports.enrollInternship = enrollInternship;
exports.generateStudentTodos = generateStudentTodos;

exports.careerReadinessProxy = careerReadinessProxy;
exports.detectCognitiveLoad = detectCognitiveLoad;

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
