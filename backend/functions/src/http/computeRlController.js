const fetch = require("node-fetch");

const ML_URL = "http://127.0.0.1:8000";

exports.computeRl = async (req, res) => {
  try {
    const {
      weeks,
      risk_trend,
      last_action,
      no_response_streak,
      fatigue_level,
    } = req.body;

    if (!weeks || !Array.isArray(weeks) || weeks.length === 0) {
      return res.status(400).json({ error: "weeks array required" });
    }

    const rlInput = {
      last_10_weeks: weeks,
      risk_trend: risk_trend || "STABLE",
      last_action: last_action || "SOFT_NUDGE",
      no_response_streak: no_response_streak || 0,
      fatigue_level: fatigue_level || 0,
    };

    const response = await fetch(`${ML_URL}/disengagement/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rlInput),
    });

    const result = await response.json();

    return res.json({
      action: result.recommended_action || result.action,
      decision_reason: result.decision_reason || "",
      risk_level: result.risk_level,
      risk_trend: result.risk_trend,
    });

  } catch (error) {
    console.error("RL compute error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
