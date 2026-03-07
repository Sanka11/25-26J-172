const { getLast10Weeks } = require("../ml/gru/gruReader");

exports.testGruReader = async (req, res) => {
  try {
    const studentId = req.query.studentId || "0001";
    const weeks = await getLast10Weeks(studentId);

    res.json({
      studentId,
      count: weeks.length,
      weeks
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};