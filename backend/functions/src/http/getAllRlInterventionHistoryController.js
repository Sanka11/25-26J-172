const admin = require("../firebase");
const db = admin.firestore();

async function getAllRlInterventionHistory(req, res) {
  try {
    const { studentId } = req.params;

    let query = db.collection("student_rl_intervention_history");

    // if studentId provided → filter
    if (studentId) {
      query = query.where("student_id", "==", studentId);
    }

    const snapshot = await query.get();

    const results = [];

    snapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      count: results.length,
      data: results,
    });

  } catch (error) {
    console.error("RL history fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch RL history",
    });
  }
}

module.exports = { getAllRlInterventionHistory };