// backend/functions/src/http/testWeeklyController.js

const { getStudentWeeklyActivity } = require("../ml/studentWeeklyReader");
const { callDisengagementML } = require("./disengagementService");
const { saveStudentRiskResult } = require("../ml/studentRiskWriter");
const { getLastStudentRisk } = require("../ml/studentRiskReader");

/**
 * Utility: compute risk trend
 */
function computeRiskTrend(previousError, currentError, epsilon = 0.005) {
  if (previousError === null || previousError === undefined) {
    return "UNKNOWN";
  }
  if (currentError > previousError + epsilon) return "INCREASING";
  if (currentError < previousError - epsilon) return "DECREASING";
  return "STABLE";
}

async function testWeeklyPipeline(req, res) {
  try {
    const { studentId } = req.params;

    // --------------------------------------------------
    // 1️⃣ Fetch last N weeks (up to 10)
    // --------------------------------------------------
    const weeks = await getStudentWeeklyActivity(studentId, 10);

    if (!weeks || weeks.length === 0) {
      return res.json({
        student_id: studentId,
        data_summary: {
          weeks_available: 0,
          weeks_used_for_prediction: 0,
        },
        message: "No weekly activity data found",
      });
    }

    // --------------------------------------------------
    // 2️⃣ Read previous saved risk (state feedback)
    // --------------------------------------------------
    const previousRisk = await getLastStudentRisk(studentId);

    const previousReconstructionError =
      previousRisk?.reconstruction_error ?? null;

    const lastAction =
      previousRisk?.recommended_action ?? "DO_NOTHING";

    const noResponseStreak =
      previousRisk?.no_response_streak ?? 0;

    const fatigueLevel =
      previousRisk?.fatigue_level ?? 0;

    // --------------------------------------------------
    // 3️⃣ Build ML payload (REAL STATE)
    // --------------------------------------------------
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
      risk_trend: "UNKNOWN", // temporary, computed after GRU
    };

    // --------------------------------------------------
    // 4️⃣ Call FastAPI (GRU + RL)
    // --------------------------------------------------
    const mlResult = await callDisengagementML(mlPayload);

    const currentReconstructionError =
      mlResult.reconstruction_error;

    const riskTrend = computeRiskTrend(
      previousReconstructionError,
      currentReconstructionError
    );

    // --------------------------------------------------
    // 5️⃣ Save updated state for NEXT run
    // --------------------------------------------------
    await saveStudentRiskResult(studentId, {
      reconstruction_error: currentReconstructionError,
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

    // --------------------------------------------------
    // 6️⃣ Return BOTH outputs
    // --------------------------------------------------
    return res.json({
      current_output: {
        risk_level: mlResult.risk_level,
        reconstruction_error: currentReconstructionError,
        risk_trend: riskTrend,
        recommended_action: mlResult.recommended_action,
        decision_reason: mlResult.decision_reason,
      },

      detailed_output: {
        student_id: studentId,

        data_summary: {
          weeks_available: weeks.length,
          weeks_used_for_prediction: weeks.length,
        },

        gru_model_output: {
          previous_reconstruction_error: previousReconstructionError,
          current_reconstruction_error: currentReconstructionError,
          risk_trend: riskTrend,
          current_risk_level: mlResult.risk_level,
        },

        rl_state: {
          last_action: lastAction,
          no_response_streak: noResponseStreak,
          fatigue_level: fatigueLevel,
        },

        decision: {
          recommended_action: mlResult.recommended_action,
          decision_reason: mlResult.decision_reason,
        },
      },
    });

  } catch (err) {
    console.error("Pipeline error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  testWeeklyPipeline,
};