const rlService = require("./service");

exports.decideRL = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await rlService.getRLDecision(studentId);

    res.json(result);
  } catch (error) {
    console.error("RL service error:", error.message);
    res.status(500).json({
      error: "RL service unavailable"
    });
  }
};
