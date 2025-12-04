const functions = require("firebase-functions");
const axios = require("axios");
const { RECOMMENDATION_SERVICE_URL } = require("../config");

const predictRecommendation = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const payload = req.body;

    const response = await axios.post(RECOMMENDATION_SERVICE_URL, payload);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Recommendation ML error:", error.message);
    return res.status(500).json({ error: "Recommendation ML service error" });
  }
});

module.exports = { predictRecommendation };
