const admin = require("../firebase");
const db = admin.firestore();

async function getPeerCheerStudents(req, res) {
  try {

    // Get RL records where PEER_CHEER triggered
    const rlSnapshot = await db
      .collection("student_rl_intervention_history")
      .where("action", "==", "PEER_CHEER")
      .get();

    const results = [];

    for (const doc of rlSnapshot.docs) {

      const rl = doc.data();
      const studentId = rl.student_id;

      // Fetch student data
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
        peers: student?.peers || []
      });

    }

    res.json({
      count: results.length,
      data: results,
    });

  } catch (error) {

    console.error("Peer cheer fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch peer cheer students",
    });

  }
}

module.exports = { getPeerCheerStudents };