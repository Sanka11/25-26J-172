const { getFirestore } = require("firebase-admin/firestore");
const fetch = require("node-fetch");
const {
  getOrInitInterventionState,
} = require("../ml/intervention/getOrInitInterventionState");

const db = getFirestore();

const RL_API = "http://127.0.0.1:8000/disengagement/rl-only";
const EPS = 0.002;

// -----------------------------
// Helper: compute risk trend
// -----------------------------
function computeTrend(lastError, currentError) {
  if (lastError === null || lastError === undefined) return "STABLE";

  const delta = currentError - lastError;
  if (delta > EPS) return "INCREASING";
  if (delta < -EPS) return "DECREASING";
  return "STABLE";
}

// -----------------------------
// Batch RL Runner
// -----------------------------
async function runRlBatch(req, res) {
  try {
    // 1️⃣ Get latest GRU record per student
    const snap = await db
      .collection("student_gru_risk_history")
      .orderBy("student_id")
      .orderBy("run_date", "desc")
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "No GRU history found" });
    }

    // Group by student
    const grouped = {};
    snap.docs.forEach(doc => {
      const d = doc.data();
      if (!grouped[d.student_id]) grouped[d.student_id] = [];
      grouped[d.student_id].push(d);
    });

    let processed = 0;
    let skipped = 0;

    // 2️⃣ Process each student
    for (const studentId of Object.keys(grouped)) {
      const records = grouped[studentId];

      if (records.length === 0) {
        skipped++;
        continue;
      }

      const current = records[0];
      const previous = records[1] || null;

      const currentError = current.reconstruction_error;
      const lastError = previous ? previous.reconstruction_error : null;
      const riskTrend = computeTrend(lastError, currentError);

      // 3️⃣ Get or init intervention state
      const state = await getOrInitInterventionState(studentId);

      // 4️⃣ Call REAL RL model
      const rlResponse = await fetch(RL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_risk: current.risk_level,
          risk_trend: riskTrend,
          last_action: state.last_action,
          no_response_streak: state.no_response_streak,
          fatigue_level: state.fatigue_level
        })
      });

      const rlOut = await rlResponse.json();

      // 5️⃣ Update fatigue (same logic as training)
      let newFatigue = state.fatigue_level;
      if (rlOut.action === "DO_NOTHING") {
        newFatigue = Math.max(newFatigue - 1, 0);
      } else {
        newFatigue = Math.min(newFatigue + 1, 2);
      }

      // 6️⃣ Save intervention history
      await db.collection("student_intervention_history").add({
        student_id: studentId,
        risk: current.risk_level,
        trend: riskTrend,
        action: rlOut.action,
        reason: rlOut.reason,
        q_value: rlOut.q_value ?? null,
        timestamp: new Date()
      });

      // 7️⃣ Update intervention state
      await db
        .collection("student_intervention_state")
        .doc(studentId)
        .update({
          last_action: rlOut.action,
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
    console.error("RL batch error:", err);
    res.status(500).json({ error: "RL batch failed" });
  }
}

module.exports = { runRlBatch };