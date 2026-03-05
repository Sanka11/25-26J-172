// src/http/testGruReaderController.js

const { getLast10Weeks } = require("../ml/gru/gruReader");

exports.testGruReader = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const weeks = await getLast10Weeks(studentId);

    return res.json({
      studentId,
      weeksFetched: weeks.length,
      firstWeek: weeks[0] || null,
      lastWeek: weeks[weeks.length - 1] || null,
      weeks
    });
  } catch (err) {
    console.error("GRU Reader Test Error:", err);
    return res.status(500).json({ error: err.message });
  }
};