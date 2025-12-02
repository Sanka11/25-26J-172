// backend/functions/src/index.js


  // Add other requires/exports here if you have more functions in future
const { predictRisk } = require("./http/mlProxy");
const { predictRecommendation } = require("./http/mlRecommendationProxy");

exports.predictRisk = predictRisk;
exports.predictRecommendation = predictRecommendation;
