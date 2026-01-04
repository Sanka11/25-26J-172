// backend/functions/src/index.js

// Add other requires/exports here if you have more functions in future
// const functions = require("firebase-functions");

// const { predictStruggle } = require("./http/struggleController");
// const { createQuiz, submitQuiz } = require("./http/quizController");

// const { predictRisk } = require("./http/mlProxy");
// const { predictRecommendation } = require("./http/mlRecommendationProxy");
// const { predictStruggle } = require("./http/mlStruggleProxy");

// exports.predictRisk = predictRisk;
// exports.predictRecommendation = predictRecommendation;

// exports.predictStruggle = predictStruggle;

const {
  createQuiz,
  submitQuiz,
  getQuizzes,
  getQuizById,
} = require("./http/quizController");

const { predictStruggle } = require("./http/struggleController");
const { predictRisk } = require("./http/mlProxy");
const { predictRecommendation } = require("./http/mlRecommendationProxy");
const { checkLevelUnlock, getUserLevel } = require("./http/levelController");
const {
  submitChatFeedback,
  getChatFeedbackStats,
  listChatFeedback,
  deleteChatFeedback,
} = require("./http/chatFeedbackController");
const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require("./http/announcementController");

exports.createQuiz = createQuiz;
exports.submitQuiz = submitQuiz;
exports.getQuizzes = getQuizzes;
exports.getQuizById = getQuizById;

exports.predictStruggle = predictStruggle;
exports.predictRisk = predictRisk;
exports.predictRecommendation = predictRecommendation;
exports.checkLevelUnlock = checkLevelUnlock;
exports.getUserLevel = getUserLevel;
exports.createAnnouncement = createAnnouncement;
exports.getAnnouncements = getAnnouncements;
exports.updateAnnouncement = updateAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
exports.submitChatFeedback = submitChatFeedback;
exports.getChatFeedbackStats = getChatFeedbackStats;
exports.listChatFeedback = listChatFeedback;
exports.deleteChatFeedback = deleteChatFeedback;
