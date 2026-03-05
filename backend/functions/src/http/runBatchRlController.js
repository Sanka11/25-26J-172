const { getFirestore } = require("firebase-admin/firestore");
const fetch = require("node-fetch");

const db = getFirestore();

// ML-service RL endpoint
const RL_API = "http://127.0.0.1:8000/disengagement/rl-only";

// Threshold used in ML training
const EPS = 0.002;

// ----------------------------------
// Helper: compute risk trend
// ----------------------------------
function computeRiskTrend(lastError, currentError) {
  if (lastError === null || lastError === undefined) return "STABLE";

  const diff = currentError - lastError;

  if (diff > EPS) return "INCREASING";
  if (diff < -EPS) return "DECREASING";
  return "STABLE";
}

// ----------------------------------
// Batch RL Controller
// ----------------------------------
async function runBatchRl(req, res) {
  try {
    // 1️⃣ Get distinct students from GRU history
    const snap = await db.collection("student_gru_risk_history").get();

    const studentIds = [
      ...new Set(snap.docs.map(d => d.data().student_id))
    ];

    let processed = 0;
    let skipped = 0;

    for (const studentId of studentIds) {

      // 2️⃣ Get last 2 GRU runs
      const gruSnap = await db
        .collection("student_gru_risk_history")
        .where("student_id", "==", studentId)
        .orderBy("run_date", "desc")
        .limit(2)
        .get();

      if (gruSnap.empty) {
        skipped++;
        continue;
      }

      const gruDocs = gruSnap.docs.map(d => d.data());

      const current = gruDocs[0];
      const previous = gruDocs.length > 1 ? gruDocs[1] : null;

      const currentRisk = current.risk_level;
      const currentError = current.reconstruction_error;
      const lastError = previous ? previous.reconstruction_error : null;

      const riskTrend = computeRiskTrend(lastError, currentError);

      // 3️⃣ Load intervention state (or init)
      const stateRef = db
        .collection("student_intervention_state")
        .doc(studentId);

      const stateSnap = await stateRef.get();

      const state = stateSnap.exists
        ? stateSnap.data()
        : {
            last_action: "DO_NOTHING",
            no_response_streak: 0,
            fatigue_level: 0
          };

      // 4️⃣ Build RL payload
      const rlPayload = {
        current_risk: currentRisk,
        risk_trend: riskTrend,
        last_action: state.last_action,
        no_response_streak: state.no_response_streak,
        fatigue_level: state.fatigue_level
      };

      // 5️⃣ Call ML-service RL model
      const rlResponse = await fetch(RL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rlPayload)
      });

      const rlResult = await rlResponse.json();

      // 6️⃣ Save RL decision history
      await db.collection("student_rl_intervention_history").add({
        student_id: studentId,
        current_risk: currentRisk,
        risk_trend: riskTrend,
        last_action: state.last_action,
        recommended_action: rlResult.action,
        reason: rlResult.reason,
        q_value: rlResult.q_value ?? null,
        run_date: new Date()
      });

      // 7️⃣ Update intervention state
      let newNoResponse = state.no_response_streak;
      let newFatigue = state.fatigue_level;

      if (rlResult.action === "DO_NOTHING") {
        newFatigue = Math.max(newFatigue - 1, 0);
      } else {
        newFatigue = Math.min(newFatigue + 1, 2);
        newNoResponse += 1;
      }

      await stateRef.set({
        student_id: studentId,
        last_action: rlResult.action,
        no_response_streak: newNoResponse,
        fatigue_level: newFatigue,
        updated_at: new Date()
      });

      processed++;
    }

    return res.json({
      status: "RL batch completed",
      students_processed: processed,
      students_skipped: skipped
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Batch RL failed" });
  }
}

module.exports = { runBatchRl };