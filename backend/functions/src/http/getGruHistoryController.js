const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();

/**
 * Get GRU Risk History
 * Returns all GRU batch results
 */
async function getGruHistory(req, res) {
  try {
    const snap = await db
      .collection("student_gru_risk_history")
      .orderBy("run_date", "desc")
      .limit(500)
      .get();

    const results = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json(results);

  } catch (error) {
    console.error("GRU history fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch GRU history"
    });
  }
}

module.exports = { getGruHistory };