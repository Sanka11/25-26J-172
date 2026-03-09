const admin = require("../firebase");
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

      // fetch student details
      const studentDoc = await db
        .collection("Student_data")
        .doc(studentId)
        .get();

      const student = studentDoc.data();

      results.push({
        student_id: studentId,
        week: rl.week,
        risk_level: rl.risk_level,
        name: student?.name || "Unknown",
        email: student?.email || "",
        mobile: student?.mobile || "",
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