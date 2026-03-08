const { getFirestore } = require("firebase-admin/firestore");
const { decideAction } = require("../ml/rl/rlDecision");
const {
  getOrInitInterventionState,
} = require("../ml/intervention/getOrInitInterventionState");

const db = getFirestore();

function updateFatigue(fatigue, action) {
  if (action === "DO_NOTHING") return Math.max(fatigue - 1, 0);
  return Math.min(fatigue + 1, 2);
}

async function gruRlPredict(req, res) {
  try {
    const { studentId } = req.params;

    // 1️⃣ Get latest GRU + trend
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
    const previous = records[1] || null;

    const current_error = current.reconstruction_error;
    const last_error = previous ? previous.reconstruction_error : null;

    const EPS = 0.002;
    let risk_trend = "STABLE";
    if (last_error !== null) {
      const delta = current_error - last_error;
      if (delta > EPS) risk_trend = "INCREASING";
      else if (delta < -EPS) risk_trend = "DECREASING";
    }

    // 2️⃣ Get intervention state
    const state = await getOrInitInterventionState(studentId);

    // 3️⃣ RL DECISION
    const decision = decideAction({
      current_risk: current.risk_level,
      risk_trend,
      last_action: state.last_action,
      no_response_streak: state.no_response_streak,
      fatigue_level: state.fatigue_level,
    });

    // 4️⃣ Update state
    const newFatigue = updateFatigue(state.fatigue_level, decision.action);

    await db.collection("student_intervention_state")
      .doc(studentId)
      .update({
        last_action: decision.action,
        fatigue_level: newFatigue,
        updated_at: new Date()
      });

    // 5️⃣ Save intervention history
    await db.collection("student_intervention_history").add({
      student_id: studentId,
      risk: current.risk_level,
      trend: risk_trend,
      action: decision.action,
      reason: decision.reason,
      timestamp: new Date()
    });

    // 6️⃣ Response
    return res.json({
      studentId,
      risk: current.risk_level,
      trend: risk_trend,
      recommended_action: decision.action,
      reason: decision.reason
    });

  } catch (err) {
    console.error("GRU-RL error:", err);
    res.status(500).json({ error: "GRU-RL prediction failed" });
  }
}

module.exports = { gruRlPredict };