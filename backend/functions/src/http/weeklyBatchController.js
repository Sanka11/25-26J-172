// backend/functions/src/http/weeklyBatchController.js

const admin = require("../../firebase");
const { getStudentWeeklyActivity } = require("../ml/studentWeeklyReader");
const { callDisengagementML } = require("./disengagementService");
const { saveStudentRiskResult } = require("../ml/studentRiskWriter");

const db = admin.firestore();

const BATCH_SIZE = 20; // safe chunk size to avoid timeout

async function runWeeklyBatch(req, res) {
  try {
    const stateRef = db.collection("batch_state").doc("weekly_risk");
    const stateSnap = await stateRef.get();

    const state = stateSnap.exists ? stateSnap.data() : {};
    const lastStudentId = state.last_student_id || null;

    // 🔹 Fetch students in chunks (ordered)
    let query = db
      .collection("students")
      .orderBy("student_id")
      .limit(BATCH_SIZE);

    if (lastStudentId) {
      query = query.startAfter(lastStudentId);
    }

    const studentsSnap = await query.get();

    // ✅ No more students → batch completed
    if (studentsSnap.empty) {
      await stateRef.set(
        {
          running: false,
          last_student_id: null,
          updated_at: new Date(), // ✅ manual timestamp
        },
        { merge: true }
      );

      return res.json({
        status: "Weekly batch completed",
        students_processed: 0,
        completed: true,
      });
    }

    let processed = 0;
    let lastProcessedId = null;

    for (const doc of studentsSnap.docs) {
      const studentId = doc.data().student_id;

      const weeks = await getStudentWeeklyActivity(studentId, 10);
      if (!weeks || weeks.length === 0) continue;

      const mlPayload = {
        last_10_weeks: weeks.map(w => ({
          login_freq: w.login_freq,
          session_duration: w.session_duration,
          inactivity_days: w.inactivity_days,
          assignment_completion: w.assignment_completion,
          quiz_score: w.quiz_score,
          forum_posts: w.forum_posts,
          video_watch_ratio: w.video_watch_ratio,
          late_submissions: w.late_submissions,
          alert_interactions: w.alert_interactions,
          help_requests: w.help_requests,
        })),
        last_action: "DO_NOTHING",
        no_response_streak: 0,
        fatigue_level: 0,
        risk_trend: "STABLE",
      };

      const mlResult = await callDisengagementML(mlPayload);

      await saveStudentRiskResult(studentId, {
        ...mlResult,
        week: weeks[0]?.week,
        created_at: new Date(), // ✅ manual timestamp
      });

      processed++;
      lastProcessedId = studentId;
    }

    // 🔹 Save batch progress
    await stateRef.set(
      {
        running: true,
        last_student_id: lastProcessedId,
        updated_at: new Date(), // ✅ manual timestamp
      },
      { merge: true }
    );

    return res.json({
      status: "Batch chunk processed",
      students_processed: processed,
      last_student_id: lastProcessedId,
      completed: false,
    });
  } catch (err) {
    console.error("Weekly batch error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  runWeeklyBatch,
};