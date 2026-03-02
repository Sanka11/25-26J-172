// backend/functions/src/http/processStudentWeekly.js

const { getStudentWeeklyActivity } = require("../ml/studentWeeklyReader");
const { callDisengagementML } = require("./disengagementService");
const { saveStudentRiskResult } = require("../ml/studentRiskWriter");
const { getLastStudentRisk } = require("../ml/studentRiskReader");

function computeRiskTrend(previousError, currentError, epsilon = 0.005) {
  if (previousError === null || previousError === undefined) return "UNKNOWN";
  if (currentError > previousError + epsilon) return "INCREASING";
  if (currentError < previousError - epsilon) return "DECREASING";
  return "STABLE";
}

async function processStudentWeekly(studentId) {
  const weeks = await getStudentWeeklyActivity(studentId, 10);
  if (!weeks || weeks.length === 0) return null;

  const prev = await getLastStudentRisk(studentId);

  const previousError = prev?.reconstruction_error ?? null;
  const lastAction = prev?.recommended_action ?? "DO_NOTHING";
  const noResponseStreak = prev?.no_response_streak ?? 0;
  const fatigueLevel = prev?.fatigue_level ?? 0;

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
    last_action: lastAction,
    no_response_streak: noResponseStreak,
    fatigue_level: fatigueLevel,
    risk_trend: "UNKNOWN",
  };

  const mlResult = await callDisengagementML(mlPayload);

  const riskTrend = computeRiskTrend(
    previousError,
    mlResult.reconstruction_error
  );

  await saveStudentRiskResult(studentId, {
    reconstruction_error: mlResult.reconstruction_error,
    risk_level: mlResult.risk_level,
    recommended_action: mlResult.recommended_action,
    decision_reason: mlResult.decision_reason,
    risk_trend: riskTrend,
    no_response_streak:
      mlResult.recommended_action === lastAction
        ? noResponseStreak + 1
        : 0,
    fatigue_level: fatigueLevel,
    week: weeks[0]?.week,
  });

  return {
    student_id: studentId,
    risk_level: mlResult.risk_level,
    recommended_action: mlResult.recommended_action,
    risk_trend: riskTrend,
  };
}

module.exports = {
  processStudentWeekly,
};