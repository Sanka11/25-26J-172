const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

async function getRlHistory(req, res) {
  try {
    const { studentId } = req.params;

    let q = db.collection("student_rl_intervention_history");

    if (studentId) {
      q = q.where("student_id", "==", studentId).orderBy("createdAt", "desc");
    } else {
      q = q.orderBy("createdAt", "desc");
    }

    const snap = await q.limit(500).get();

    const results = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json({ data: results });

  } catch (error) {
    console.error("RL history fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch RL intervention history"
    });
  }
}

module.exports = { getRlHistory };
