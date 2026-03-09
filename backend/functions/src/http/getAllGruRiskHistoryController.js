const admin = require("../firebase");
const db = admin.firestore();

async function getAllGruRiskHistory(req, res) {
  try {
    const { studentId } = req.params;

    let query = db.collection("student_gru_risk_history");

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
    console.error("GRU history fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch GRU history",
    });
  }
}

module.exports = { getAllGruRiskHistory };