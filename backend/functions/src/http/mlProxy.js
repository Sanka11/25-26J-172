// backend/functions/src/http/mlProxy.js
const functions = require("firebase-functions");
const axios = require("axios");
const { ML_SERVICE_URL } = require("../config");

const predictRisk = functions.https.onRequest(async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const payload = req.body; // expects JSON with student_id, gpa, attendance_rate, assignments_completed

    // Call ML service
    const response = await axios.post(ML_SERVICE_URL, payload);

    // ML returns: { risk_score: number }
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("ML proxy error:", error.message);
    return res.status(500).json({ error: "ML service error" });
  }
});

module.exports = { predictRisk };
