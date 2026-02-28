// backend/functions/src/http/weeklyBatchController.js

const { getStudentWeeklyActivity } = require("../ml/studentWeeklyReader");
const { callDisengagementML } = require("./disengagementService");
const { saveStudentRiskResult } = require("../ml/studentRiskWriter");
const admin = require("../firebase");

const db = admin.firestore();

/**
 * Run weekly ML prediction for ALL students
 * (manual trigger for now, cron later)
 */
async function runWeeklyBatch(req, res) {
  try {
    // 1️⃣ Get all unique student IDs
    const snapshot = await db
      .collection("student_activity_weekly")
      .select("student_id")
      .get();

    const studentIds = [
      ...new Set(snapshot.docs.map(d => d.data().student_id)),
    ];

    let processed = 0;

    // 2️⃣ Loop each student
    for (const studentId of studentIds) {
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
      });

      processed++;
    }

    return res.json({
      status: "Weekly batch completed",
      students_processed: processed,
    });

  } catch (err) {
    console.error("Weekly batch failed:", err);
    return res.status(500).json({
      error: "Weekly batch failed",
      details: err.message,
    });
  }
}

module.exports = {
  runWeeklyBatch,
};