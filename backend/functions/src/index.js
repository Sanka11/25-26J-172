
// const {
//   createQuiz,
//   submitQuiz,
//   getAllQuizzes,
//   getQuizByLevel,
//   fetchQuizByUser,
// } = require("./http/quizController");

// const { predictRisk } = require("./http/mlProxy");
// const { predictRecommendation } = require("./http/mlRecommendationProxy");

// exports.createQuiz = createQuiz;
// exports.submitQuiz = submitQuiz;
// exports.getAllQuizzes = getAllQuizzes;
// exports.getQuizByLevel = getQuizByLevel;
// exports.fetchQuizByUser = fetchQuizByUser;

// exports.predictRisk = predictRisk;
// exports.predictRecommendation = predictRecommendation;
// exports.api = require("./api").api;


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


exports.createAnnouncement = createAnnouncement;
exports.getAnnouncements = getAnnouncements;
exports.updateAnnouncement = updateAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
exports.submitChatFeedback = submitChatFeedback;
exports.getChatFeedbackStats = getChatFeedbackStats;
exports.listChatFeedback = listChatFeedback;
exports.deleteChatFeedback = deleteChatFeedback;