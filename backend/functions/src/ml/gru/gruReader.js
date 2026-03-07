// src/ml/gru/gruReader.js

const admin = require("../../firebase");

/**
 * Fetch last 10 weeks of behavior for one student
 * Ordered from oldest → newest (GRU requirement)
 */
async function getLast10Weeks(studentId) {
  const snapshot = await admin
    .firestore()
    .collection("student_weekly_records")
    .where("student_id", "==", studentId)
    .orderBy("week", "desc")
    .limit(10)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const weeks = [];
  snapshot.forEach(doc => {
    const d = doc.data();

    weeks.push({
      login_count: d.login_count,
      avg_session_duration_min: d.avg_session_duration_min,
      total_active_time_min: d.total_active_time_min,
      days_since_last_login: d.days_since_last_login,
      page_views: d.page_views,
      assignments_submitted: d.assignments_submitted,
      on_time_submissions: d.on_time_submissions,
      late_submissions: d.late_submissions,
      alerts_responded: d.alerts_responded,
      response_rate: d.response_rate,
      week: d.week            // keep for debugging only
    });
  });

  // GRU expects chronological order
  return weeks.reverse();
}

module.exports = { getLast10Weeks };