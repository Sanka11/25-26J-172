// backend/functions/src/http/testWeeklyController.js

const { getStudentWeeklyActivity } = require("../ml/studentWeeklyReader");
const { callDisengagementML } = require("./disengagementService");
const { saveStudentRiskResult } = require("../ml/studentRiskWriter");

async function testWeeklyPipeline(req, res) {
  try {
    const { studentId } = req.params;

    const weeks = await getStudentWeeklyActivity(studentId, 10);

    if (!weeks || weeks.length === 0) {
      return res.json({
        student_id: studentId,
        weeks_count: 0,
        weeks: [],
      });
    }

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

    return res.json({
      student_id: studentId,
      weeks_count: weeks.length,
      ml_result: mlResult,
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  testWeeklyPipeline,
};