// src/http/runGruBatchController.js

const admin = require("../firebase");
const { callGruOnly } = require("../ml/gru/gruService");

exports.runGruBatch = async (req, res) => {
  try {
    const db = admin.firestore();

    // 1️⃣ Get all weekly records
    const snapshot = await db
      .collection("student_weekly_records")
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: "No weekly data found" });
    }

    // 2️⃣ Group by student_id
    const studentMap = {};
    snapshot.forEach(doc => {
      const d = doc.data();
      if (!studentMap[d.student_id]) {
        studentMap[d.student_id] = [];
      }
      studentMap[d.student_id].push(d);
    });

    let processed = 0;
    let skipped = 0;

    // 3️⃣ Process each student
    for (const studentId of Object.keys(studentMap)) {
      const weeks = studentMap[studentId]
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-10);

      if (weeks.length < 10) {
        skipped++;
        continue;
      }

      // 4️⃣ Call GRU
      const gruOut = await callGruOnly(weeks);

      // 5️⃣ Save result (history)
      await db.collection("student_gru_risk_history").add({
        student_id: studentId,
        run_date: new Date().toISOString(),
        window_end_week: weeks[weeks.length - 1].week,
        risk_level: gruOut.risk_level,
        reconstruction_error: gruOut.reconstruction_error,
        model: "gru_autoencoder_v1"
      });

      processed++;
    }

    return res.json({
      status: "GRU batch completed",
      students_processed: processed,
      students_skipped: skipped
    });

  } catch (err) {
    console.error("GRU batch error:", err);
    return res.status(500).json({ error: err.message });
  }
};