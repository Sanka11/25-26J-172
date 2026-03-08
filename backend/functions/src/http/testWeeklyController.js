// backend/functions/src/http/testWeeklyController.js

const {
  getStudentWeeklyActivityV2: getStudentWeeklyActivity,
} = require("../ml/studentWeeklyReaderV2");

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
    // 1️⃣ Fetch last 10 weeks from student_weekly_records
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
    // 2️⃣ Read previous saved risk (RL state feedback)
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
    // 3️⃣ BUILD ML PAYLOAD (EXACT GRU TRAINING FIELDS)
    // --------------------------------------------------
    const mlPayload = {
      last_10_weeks: weeks.map(w => ({
        // 🔥 EXACT feature names used in training
        login_count: Number(w.login_count) || 0,
        avg_session_duration_min: Number(w.avg_session_duration_min) || 0,
        total_active_time_min: Number(w.total_active_time_min) || 0,
        days_since_last_login: Number(w.days_since_last_login) || 0,
        page_views: Number(w.page_views) || 0,
        assignments_submitted: Number(w.assignments_submitted) || 0,
        on_time_submissions: Number(w.on_time_submissions) || 0,
        late_submissions: Number(w.late_submissions) || 0,
        alerts_responded: Number(w.alerts_responded) || 0,
        response_rate: Number(w.response_rate) || 0,
      })),

      // RL state
      last_action: lastAction,
      no_response_streak: noResponseStreak,
      fatigue_level: fatigueLevel,
      risk_trend: "UNKNOWN",
    };

    // 🔍 DEBUG (keep for now)
    console.log(
      "ML INPUT SAMPLE:",
      JSON.stringify(mlPayload.last_10_weeks[0], null, 2)
    );

    // --------------------------------------------------
    // 4️⃣ Call ML Service (GRU + RL)
    // --------------------------------------------------
    const mlResult = await callDisengagementML(mlPayload);

    const currentReconstructionError =
      mlResult.reconstruction_error;

    const riskTrend = computeRiskTrend(
      previousReconstructionError,
      currentReconstructionError
    );

    // --------------------------------------------------
    // 5️⃣ Save updated state for next run
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
      week: weeks[weeks.length - 1]?.week,
    });

    // --------------------------------------------------
    // 6️⃣ Return response
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