const {
  createQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizByLevel,
} = require("./http/quizController");


const { predictRisk } = require("./http/mlProxy");
const { predictRecommendation } = require("./http/mlRecommendationProxy");



exports.createQuiz = createQuiz;
exports.submitQuiz = submitQuiz;
exports.getAllQuizzes = getAllQuizzes;
exports.getQuizByLevel = getQuizByLevel;


exports.predictRisk = predictRisk;
exports.predictRecommendation = predictRecommendation;
