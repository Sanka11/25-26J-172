const admin = require("../firebase");
const axios = require("axios");
const { ML_XAI_BASE_URL } = require("../config");

/**
 * POST /api/student/update-metrics
 */
exports.updateStudentMetrics = async (req, res) => {
  try {
    const {
      student_id,
      gpa,
      attendance_rate,
      assignments_completed,
      semester = 1,
    } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    let risk_probability;

    /* ======================================================
       1. TRY REAL ML SERVICE
       ====================================================== */
    try {
      const mlResponse = await axios.post(
        ML_XAI_BASE_URL,
        {
          student_id,
          gpa,
          attendance_rate,
          assignments_completed,
        },
        { timeout: 3000 },
      );

      // normalize safely (0–100 → 0–1)
      const rawScore = Number(mlResponse.data?.risk_score);
      risk_probability = rawScore > 1 ? rawScore / 100 : rawScore;
    } catch (mlError) {
      console.warn("⚠️ ML service unavailable, using fallback model");

      /* ======================================================
         1B. FALLBACK LOGIC (PP1 DEMO SAFE)
         ====================================================== */
      risk_probability =
        (1 - gpa / 4) * 0.4 +
        (1 - attendance_rate / 100) * 0.4 +
        (1 - assignments_completed / 10) * 0.2;

      risk_probability = Math.min(Math.max(risk_probability, 0), 1);
    }

    /* ======================================================
       2. DETERMINE TREND
       ====================================================== */
    let risk_trend = "Stable Risk";
    if (risk_probability >= 0.7) risk_trend = "Increasing Risk";
    else if (risk_probability < 0.4) risk_trend = "Decreasing Risk";

    /* ======================================================
       3. STORE IN FIRESTORE
       ====================================================== */
    await admin.firestore().collection("student_risk_history").add({
      student_id,
      semester,
      risk_probability,
      risk_trend,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      source: "realtime-update",
    });

    /* ======================================================
       4. RETURN RESPONSE
       ====================================================== */
    return res.status(200).json({
      student_id,
      semester,
      risk_probability,
      risk_trend,
      message: "Real-time risk updated successfully",
    });
  } catch (error) {
    console.error("❌ Realtime risk update error:", error);
    return res.status(500).json({
      error: "Failed to update student metrics",
      details: error.message,
    });
  }
};
