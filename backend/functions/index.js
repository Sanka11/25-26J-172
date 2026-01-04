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
//const { predictRisk } = require("./src/http/mlProxy");
//const { predictRecommendation } = require("./src/http/mlRecommendationProxy");

// Student risk explainability controller
//const {
//getStudentRiskExplanation,
//} = require("./src/http/studentRiskExplanation");

// Express API (RL, disengagement, etc.)
//exports.api = require("./api").api;

// Export quiz functions
exports.createQuiz = createQuiz;
exports.submitQuiz = submitQuiz;
exports.getAllQuizzes = getAllQuizzes;
exports.getQuizByLevel = getQuizByLevel;
exports.fetchQuizByUser = fetchQuizByUser;

// Export ML functions
//exports.predictRisk = predictRisk;
//exports.predictRecommendation = predictRecommendation;

// Export student risk explanation API
//exports.getStudentRiskExplanation = getStudentRiskExplanation;
