// src/http/testGruInferenceController.js

const { getLast10Weeks } = require("../ml/gru/gruReader");
const { callGruOnly } = require("../ml/gru/gruService");

exports.testGruInference = async (req, res) => {
  try {
    const { studentId } = req.params;

    const weeks = await getLast10Weeks(studentId);

    if (weeks.length < 10) {
      return res.status(400).json({
        error: "Student does not have 10 weeks of data"
      });
    }

    const gruResult = await callGruOnly(weeks);

    return res.json({
      studentId,
      gruResult
    });
  } catch (err) {
    console.error("GRU inference error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};