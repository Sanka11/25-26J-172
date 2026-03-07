const admin = require("firebase-admin");

// ---------------------------------------------
// Normalize student ID to 4 digits (0001)
// ---------------------------------------------
function normalizeStudentId(studentId) {
  if (!studentId) return null;

  return studentId
    .toString()
    .replace("S", "")
    .trim()
    .padStart(4, "0");
}

/**
 * Fetch last N weeks of student activity
 * and MAP to GRU training feature schema
 */
async function getStudentWeeklyActivityV2(studentId, limit = 10) {
  const normalizedId = normalizeStudentId(studentId);
  if (!normalizedId) return [];

  const db = admin.firestore();

  const snapshot = await db
    .collection("student_weekly_records")
    .where("student_id", "==", normalizedId)
    .orderBy("week", "desc") // newest first
    .limit(limit)
    .get();

  // ---------------------------------------------
  // Firestore → GRU feature mapping
  // ---------------------------------------------
  const weeks = snapshot.docs.map(doc => {
    const row = doc.data();

    const loginCount = row.login_freq ?? 0;
    const sessionDuration = row.session_duration ?? 0;
    const assignmentCompletion = row.assignment_completion ?? 0;
    const alertsResponded = row.alert_interactions ?? 0;
    const alertsSent = row.alerts_sent ?? 1;

    const assignmentsSubmitted = Math.round(assignmentCompletion * 5);

    return {
      // ✅ GRU TRAINING FEATURES (EXACT MATCH)
      login_count: loginCount,
      avg_session_duration_min: sessionDuration,
      total_active_time_min: loginCount * sessionDuration,
      days_since_last_login: row.inactivity_days ?? 0,
      page_views: Math.round(
        (row.video_watch_ratio ?? 0) * 100 +
        (row.forum_posts ?? 0) * 5
      ),
      assignments_submitted: assignmentsSubmitted,
      on_time_submissions: Math.round(
        assignmentsSubmitted * assignmentCompletion
      ),
      late_submissions: row.late_submissions ?? 0,
      alerts_responded: alertsResponded,
      response_rate: alertsResponded / Math.max(alertsSent, 1),

      // (optional metadata, safe to keep)
      week: row.week,
    };
  });

  // ---------------------------------------------
  // Model expects OLDEST → NEWEST
  // ---------------------------------------------
  return weeks.reverse();
}

module.exports = {
  getStudentWeeklyActivityV2,
};