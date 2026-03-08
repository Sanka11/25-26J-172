const { getFirestore } = require("firebase-admin/firestore");
const fetch = require("node-fetch");

const {
  getOrInitInterventionState,
} = require("../ml/intervention/getOrInitInterventionState");

const db = getFirestore();

// ML-service URL (GRU only)
const GRU_API = "http://127.0.0.1:8000/disengagement/gru-only";

async function predictGruOnly(req, res) {
  try {
    const { studentId } = req.params;

    // 1️⃣ Get last 10 weeks of activity
    const snap = await db
      .collection("student_weekly_records")
      .where("student_id", "==", studentId)
      .orderBy("week", "desc")
      .limit(10)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "No weekly data found" });
    }

    const weeks = snap.docs
      .map(doc => doc.data())
      .reverse(); // oldest → newest (VERY IMPORTANT for GRU)

    // 2️⃣ Call GRU model (ml-service)
    const response = await fetch(GRU_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ last_10_weeks: weeks })
    });

    const gruResult = await response.json();

    // 3️⃣ Save GRU history
    await db.collection("student_gru_risk_history").add({
      student_id: studentId,
      risk_level: gruResult.risk_level,
      reconstruction_error: gruResult.reconstruction_error,
      run_date: new Date()
    });

    // 4️⃣ Ensure intervention state exists (bootstrap on first run)
    const interventionState = await getOrInitInterventionState(studentId);

    // 5️⃣ Response
    return res.json({
      studentId,
      gruResult,
      interventionState
    });

  } catch (err) {
    console.error("GRU prediction error:", err);
    res.status(500).json({ error: "GRU prediction failed" });
  }
}

module.exports = { predictGruOnly };