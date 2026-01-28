const functions = require("firebase-functions");
const axios = require("axios");
const { ML_COGNITIVE_LOAD_URL } = require("../config");

/**
 * Cognitive Load Detection
 * Firebase Function → ML Service (FastAPI + Sentence Transformers + Ollama)
 */
exports.detectCognitiveLoad = functions.https.onRequest(async (req, res) => {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed. Use POST.",
      });
    }

    const { subjects } = req.body;

    // 🔹 Validation
    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        error: "subjects array is required",
      });
    }

    // 🔹 Call ML service
    const mlResponse = await axios.post(
      ML_COGNITIVE_LOAD_URL,
      { subjects },
      { timeout: 60000 },
    );

    // 🔹 Return ML response
    return res.status(200).json({
      service: "Cognitive Load Analysis",
      via: "Firebase Function → ML Service (Sentence Transformers + Ollama)",
      ...mlResponse.data,
    });
  } catch (error) {
    console.error("Cognitive Load Error:", error.message);

    return res.status(500).json({
      error: "ML service unavailable",
    });
  }
});
