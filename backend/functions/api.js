const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");

// -------------------------------
// Express app setup
// -------------------------------
const app = express();
app.use(cors({ origin: true }));

// JSON for normal APIs ONLY
app.use(express.json());

// ----------------------------------------------------
// RAW body ONLY for WEEKLY CSV upload (keep this)
// ----------------------------------------------------
app.use(
  "/api/upload-weekly-csv",
  express.raw({ type: "*/*", limit: "10mb" })
);

// -------------------------------
// Health check
// -------------------------------
app.get("/", (req, res) => {
  res.json({ message: "Backend Connected" });
});

// -------------------------------
// Explainable AI – Student Risk
// -------------------------------
const {
  getStudentRiskExplanation,
} = require("./src/http/studentRiskExplanation");

app.get("/api/student-risk-explanation", getStudentRiskExplanation);

// ----------------------------------------------------
// EXISTING FEATURE ROUTES (DO NOT CHANGE)
// ----------------------------------------------------
const disengagementRoutes = require("./features/disengagement/routes");
app.use("/api", disengagementRoutes);

// ----------------------------------------------------
// RL FEATURE ROUTES
// ----------------------------------------------------
const rlRoutes = require("./features/rl/routes");
app.use("/api/rl", rlRoutes);

// ----------------------------------------------------
// Temporal Risk History (Semester-wise)
// ----------------------------------------------------
const {
  getStudentRiskHistory,
} = require("./src/http/temporalRiskController");

app.get("/api/students/:studentId/risk-history", getStudentRiskHistory);

// ----------------------------------------------------
// Risk real-time
// ----------------------------------------------------
const {
  updateStudentMetrics,
} = require("./src/http/realtimeRiskController");

app.post("/api/student/update-metrics", updateStudentMetrics);

// ----------------------------------------------------
// Test weekly single-student pipeline
// ----------------------------------------------------
const {
  testWeeklyPipeline,
} = require("./src/http/testWeeklyController");

app.get("/api/test-weekly/:studentId", testWeeklyPipeline);

// ----------------------------------------------------
// Test GRU reader (Firestore → backend)
// ----------------------------------------------------
const {
  testGruReader,
} = require("./src/http/testGruReaderController");

app.get("/api/test-gru-reader/:studentId", testGruReader);


// ----------------------------------------------------
// Weekly batch execution
// ----------------------------------------------------
const {
  runWeeklyBatch,
} = require("./src/http/weeklyBatchController");

app.post("/api/run-weekly-batch", runWeeklyBatch);

// ----------------------------------------------------
// CSV Upload – Student Weekly Activity (RAW)
// ----------------------------------------------------
const {
  uploadWeeklyCsv,
} = require("./src/http/uploadWeeklyCsvController");

app.post("/api/upload-weekly-csv", uploadWeeklyCsv);

// ----------------------------------------------------
// CSV Upload – Student Master Data (FILE UPLOAD)
// ----------------------------------------------------
const {
  uploadStudentCsv,
} = require("./src/http/uploadStudentCsvController");

const {
  uploadStudentWeeklyCsv,
} = require("./src/http/uploadStudentWeeklyCsvController");

app.post("/api/upload-student-csv", uploadStudentCsv);

app.post("/api/upload-student-weekly-csv", uploadStudentWeeklyCsv);

// ----------------------------------------------------
// Test GRU inference (Firestore → ML-service)
// ----------------------------------------------------
const {
  testGruInference,
} = require("./src/http/testGruInferenceController");

app.get("/api/test-gru-inference/:studentId", testGruInference);

// // ----------------------------------------------------
// // ML – GRU + RL combined prediction (NEW)
// // ----------------------------------------------------
// const {
//   gruRlPredict,
// } = require("./src/http/gruRlPredictController");

// app.post("/api/ml/gru-rl-predict", gruRlPredict);


// ----------------------------------------------------
// GRU batch run – all students (NEW)
// ----------------------------------------------------
const {
  runGruBatch,
} = require("./src/http/runGruBatchController");

app.post("/api/ml/run-gru-batch", runGruBatch);

// ----------------------------------------------------
// Test GRU history → RL input
// ----------------------------------------------------
const {
  testGruHistoryForRl,
} = require("./src/http/testGruHistoryForRlController");

app.get("/api/test-gru-history-rl/:studentId", testGruHistoryForRl);

const {
  predictGruOnly,
} = require("./src/http/predictGruOnlyController");

app.get("/api/gru/predict/:studentId", predictGruOnly);

const {
  getLatestGruWithTrend,
} = require("./src/http/getLatestGruWithTrendController");

app.get(
  "/api/gru/latest-with-trend/:studentId",
  getLatestGruWithTrend
);

const {
  gruRlPredict,
} = require("./src/http/gruRlPredictController");

app.get("/api/gru-rl/predict/:studentId", gruRlPredict);

const {
  runRlBatch,
} = require("./src/http/runRlBatchController");

app.post("/api/run-rl-batch", runRlBatch);

const { runBatchRl } = require("./src/http/runBatchRlController");
app.post("/api/run-batch-rl", runBatchRl);


// --- RL HISTORY CONTROLLER ---
const { getRlHistory } = require("./src/http/getRlHistoryController");

// Get ALL students
app.get("/api/ml/rl-history", getRlHistory);

// Get SINGLE student
app.get("/api/ml/rl-history/:studentId", getRlHistory);

const { getGruHistory } = require("./src/http/getGruHistoryController");

app.get("/api/ml/gru-history", getGruHistory);


// ----------------------------------------------------
// Export Firebase HTTPS function
// ----------------------------------------------------
exports.api = onRequest(app);