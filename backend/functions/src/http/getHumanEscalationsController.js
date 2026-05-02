const admin = require("../firebase");
const { findStudentById } = require("./studentDataLookup");
const db = admin.firestore();

async function getHumanEscalations(req, res) {
  try {

    // get RL records where HUMAN_ESCALATION triggered
    const rlSnapshot = await db
      .collection("student_rl_intervention_history")
      .where("action", "==", "HUMAN_ESCALATION")
      .get();

    const results = [];

    for (const doc of rlSnapshot.docs) {

      const rl = doc.data();
      const studentId = rl.student_id;

      const student = await findStudentById(db, studentId);
      const studentData = student.data;

      results.push({
        student_id: studentId,
        week: rl.week,
        risk_level: rl.risk_level,
        risk_trend: rl.risk_trend || "STABLE",
        reconstruction_error: rl.reconstruction_error || null,
        // At-risk student contact details
        name: studentData.name || "Unknown",
        email: studentData.email,
        mobile: studentData.mobile,
        // Additional student info
        department: studentData.department,
        year: studentData.year,
        status: studentData.status,
        // Intervention details
        action: rl.action || "HUMAN_ESCALATION",
        decision_reason: rl.decision_reason || "",
        run_date: rl.run_date || null
      });

    }

    res.json({
      count: results.length,
      data: results,
    });

  } catch (error) {
    console.error("Human escalation fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch escalated students",
    });
  }
}

module.exports = { getHumanEscalations };
