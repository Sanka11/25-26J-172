const { getLatestGruRisk } = require("../ml/gru/getLatestGruRisk");
const { computeRiskTrend } = require("../ml/gru/computeRiskTrend");

exports.testGruHistoryForRl = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: "studentId required" });
    }

    const result = await getLatestGruRisk(studentId);

    if (!result) {
      return res.status(404).json({ error: "No GRU history found" });
    }

    const current = result.current;
    const previous = result.previous;

    const lastError = previous ? previous.reconstruction_error : null;
    const currentError = current.reconstruction_error;

    const riskTrend = computeRiskTrend(lastError, currentError);

    return res.json({
      studentId,
      current_risk: current.risk_level,
      current_error: currentError,
      last_error: lastError,
      risk_trend: riskTrend,
      run_date: current.run_date
    });

  } catch (err) {
    console.error("GRU history error:", err);
    res.status(500).json({ error: err.message });
  }
};