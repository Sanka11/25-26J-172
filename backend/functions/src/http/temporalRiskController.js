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
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ student_id: studentId, history: [] });
    }

    const history = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          semester_label:  d.semester_label  ?? d.semester  ?? null,
          risk_probability: d.risk_probability != null ? Number(d.risk_probability) : null,
          risk_percentage:  d.risk_percentage  != null ? Number(d.risk_percentage)  : null,
          risk_level:       d.risk_level  ?? null,
          risk_color:       d.risk_color  ?? null,
          risk_trend:       d.risk_trend  ?? null,
          marks_snapshot:   d.marks_snapshot  ?? null,
          recorded_at:      d.recorded_at?.toDate?.()?.toISOString() ?? null,
        };
      })
      .sort((a, b) => {
        if (!a.recorded_at) return 1;
        if (!b.recorded_at) return -1;
        return new Date(a.recorded_at) - new Date(b.recorded_at);
      });

    return res.status(200).json({ student_id: studentId, history });
  } catch (error) {
    console.error("Risk history fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch student risk history",
      details: error.message,
    });
  }
};
