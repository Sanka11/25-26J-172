const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

// ===== RL CONFIG (MATCH TRAINING) =====
const RISK_MAP = { LOW: 0, NORMAL: 1, HIGH: 2 };
const TREND_MAP = { DECREASING: 0, STABLE: 1, INCREASING: 2 };
const ACTIONS = [
  "DO_NOTHING",
  "SOFT_NUDGE",
  "REMINDER",
  "PEER_CHEER",
  "HUMAN_ESCALATION",
];

// ⚠️ Simplified Q-values policy (mirrors learned behavior)
function decideAction({ current_risk, risk_trend, last_action, no_response_streak, fatigue_level }) {
  // 🔒 Guardrails FIRST (same as training)
  if (fatigue_level >= 2) {
    return { action: "DO_NOTHING", reason: "FATIGUE_BLOCK" };
  }

  if (no_response_streak >= 3 && last_action === "PEER_CHEER") {
    return { action: "HUMAN_ESCALATION", reason: "FORCED_HUMAN_ESCALATION" };
  }

  if (no_response_streak >= 2 && last_action === "REMINDER") {
    return { action: "PEER_CHEER", reason: "FORCED_PEER_CHEER" };
  }

  // ===== Policy logic (aligned with RL training) =====
  if (current_risk === "HIGH" && risk_trend === "INCREASING") {
    return { action: "REMINDER", reason: "RL_HIGH_INCREASING" };
  }

  if (current_risk === "HIGH" && risk_trend === "DECREASING") {
    return { action: "DO_NOTHING", reason: "RL_IMPROVING" };
  }

  if (current_risk === "NORMAL" && risk_trend === "INCREASING") {
    return { action: "SOFT_NUDGE", reason: "RL_NORMAL_INCREASING" };
  }

  return { action: "DO_NOTHING", reason: "RL_DEFAULT" };
}

module.exports = { decideAction };