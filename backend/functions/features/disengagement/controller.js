const logger = require("firebase-functions/logger");
const service = require("./service");

/* ---------------------------------------
   SINGLE STUDENT (UNCHANGED)
--------------------------------------- */
exports.getSingleStudent = async (req, res) => {
  try {
    const data = await service.predictSingleStudent(req.params.id);
    res.json(data);
  } catch (err) {
    logger.error("ML single student error:", err.message);
    res.status(500).json({ error: "ML service error" });
  }
};

/* ---------------------------------------
   ALL STUDENTS – ASYNC (MAIN)
   Starts background ML job
--------------------------------------- */
exports.startAllStudentsJob = async (req, res) => {
  try {
    const data = await service.startPredictAllJob();
    res.json(data); // { job_id, status }
  } catch (err) {
    logger.error("ML async start error:", err.message);
    res.status(500).json({ error: "ML service error" });
  }
};

/* ---------------------------------------
   ALL STUDENTS – ASYNC RESULT
   Fetch job result by jobId
--------------------------------------- */
exports.getAllStudentsResult = async (req, res) => {
  try {
    const data = await service.getPredictAllJobResult(req.params.jobId);
    res.json(data);
  } catch (err) {
    logger.error("ML async result error:", err.message);
    res.status(500).json({ error: "ML service error" });
  }
};

/* ---------------------------------------
   ALL STUDENTS – SYNC (TESTING ONLY)
   ⚠️ Can timeout if used from Firebase
--------------------------------------- */
exports.getAllStudentsSync = async (req, res) => {
  try {
    const data = await service.predictAllStudentsSync();
    res.json(data);
  } catch (err) {
    logger.error("ML sync error:", err.message);
    res.status(500).json({ error: "ML service error" });
  }
};
