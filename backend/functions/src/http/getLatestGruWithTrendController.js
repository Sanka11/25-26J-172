const { getFirestore } = require("firebase-admin/firestore");
const {
  getOrInitInterventionState,
} = require("../ml/intervention/getOrInitInterventionState");

const db = getFirestore();

const EPS = 0.002;

function computeTrend(lastError, currentError) {
  if (lastError === null || lastError === undefined) {
    return "STABLE";
  }

  const delta = currentError - lastError;

  if (delta > EPS) return "INCREASING";
  if (delta < -EPS) return "DECREASING";
  return "STABLE";
}

async function getLatestGruWithTrend(req, res) {
  try {
    const { studentId } = req.params;

    // 1️⃣ Get last 2 GRU records
    const snap = await db
      .collection("student_gru_risk_history")
      .where("student_id", "==", studentId)
      .orderBy("run_date", "desc")
      .limit(2)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "No GRU history found" });
    }

    const records = snap.docs.map(d => d.data());

    const current = records[0];
    const previous = records.length > 1 ? records[1] : null;

    const currentError = current.reconstruction_error;
    const lastError = previous ? previous.reconstruction_error : null;

    // 2️⃣ Compute trend
    const riskTrend = computeTrend(lastError, currentError);

    // 3️⃣ Ensure intervention state exists
    const interventionState = await getOrInitInterventionState(studentId);

    // 4️⃣ Response (RL-ready)
    return res.json({
      studentId,
      current_risk: current.risk_level,
      current_error: currentError,
      last_error: lastError,
      risk_trend: riskTrend,
      interventionState,
      run_date: current.run_date
    });

  } catch (err) {
    console.error("Trend computation error:", err);
    res.status(500).json({ error: "Failed to compute risk trend" });
  }
}

module.exports = { getLatestGruWithTrend };