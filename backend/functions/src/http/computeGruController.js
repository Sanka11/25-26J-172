const fetch = require("node-fetch");

const ML_URL = "http://127.0.0.1:8000";

exports.computeGru = async (req, res) => {
  try {
    const { weeks, previous_error } = req.body;

    if (!weeks || !Array.isArray(weeks) || weeks.length === 0) {
      return res.status(400).json({ error: "weeks array required" });
    }

    const response = await fetch(`${ML_URL}/disengagement/gru-only`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ last_10_weeks: weeks }),
    });

    const gruResult = await response.json();
    const { reconstruction_error, risk_level } = gruResult;

    if (reconstruction_error === undefined) {
      return res.status(500).json({ error: "Invalid GRU response", response: gruResult });
    }

    let risk_trend = "STABLE";
    if (previous_error !== null && previous_error !== undefined) {
      if (reconstruction_error > previous_error) risk_trend = "INCREASING";
      else if (reconstruction_error < previous_error) risk_trend = "DECREASING";
    }

    return res.json({ risk_level, reconstruction_error, risk_trend });

  } catch (error) {
    console.error("GRU compute error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
