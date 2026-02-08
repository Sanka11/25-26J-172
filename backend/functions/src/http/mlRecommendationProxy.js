const functions = require("firebase-functions");
const axios = require("axios");
const { ML_CAREER_RECOMMEND_URL } = require("../config");

/**
 * Career Readiness Recommendation (LLM-based)
 * Firebase Function → ML Service (FastAPI + Ollama)
 */
exports.careerReadinessProxy = functions.https.onRequest(async (req, res) => {
  try {
    const { user_skills, job_title } = req.body;

    // 🔹 Validate input
    if (!user_skills || !job_title) {
      return res.status(400).json({
        error: "user_skills and job_title are required",
      });
    }

    // 🔹 Call ML-service (FastAPI)
    const mlResponse = await axios.post(
      ML_CAREER_RECOMMEND_URL,
      {
        user_skills,
        job_title,
      },
      {
        timeout: 60000,
      },
    );

    // 🔹 Return ML response
    return res.status(200).json({
      service: "Career Readiness Recommendation",
      via: "Firebase Function → ML-Service (FastAPI + Ollama)",
      ...mlResponse.data,
    });
  } catch (error) {
    console.error("Career Recommendation Error:", error.message);

    return res.status(500).json({
      error: "ML-service unavailable",
      details: error.message,
    });
  }
});
