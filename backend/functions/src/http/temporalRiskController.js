const admin = require("../firebase");

/**
 * GET /api/students/:studentId/risk-history
 */
exports.getStudentRiskHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const snapshot = await admin
      .firestore()
      .collection("student_risk_history")
      .where("student_id", "==", studentId)
      .orderBy("semester", "asc")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        student_id: studentId,
        history: [],
        message: "No risk history found",
      });
    }

    const history = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        semester: data.semester,
        risk_probability: Number(data.risk_probability),
        risk_trend: data.risk_trend,
        updated_at: data.updated_at || null,
      };
    });

    return res.status(200).json({
      student_id: studentId,
      history,
    });
  } catch (error) {
    console.error("❌ Risk history fetch error:", error);

    return res.status(500).json({
      error: "Failed to fetch student risk history",
      details: error.message,
    });
  }
};
