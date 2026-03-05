const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

async function getRlHistory(req, res) {
  try {
    const { studentId } = req.params;

    let query = db.collection("student_rl_intervention_history");

    if (studentId) {
      query = query
        .where("student_id", "==", studentId)
        .orderBy("run_date", "desc");
    } else {
      query = query.orderBy("run_date", "desc");
    }

    const snap = await query.limit(500).get();

    const results = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json(results);

  } catch (error) {
    console.error("RL history fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch RL intervention history"
    });
  }
}

module.exports = { getRlHistory };