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

// IMPORTANT:
// RAW body ONLY for CSV upload (Firebase-compatible)
app.use("/api/upload-weekly-csv", express.raw({ type: "*/*", limit: "10mb" }));

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
const { getStudentRiskHistory } = require("./src/http/temporalRiskController");
const {
  getStudentPerformance,
  getStudentsByPerformance,
} = require("./src/http/studentPerformanceController");

app.get("/api/students/:studentId/risk-history", getStudentRiskHistory);
app.get("/api/students/:studentId/performance", getStudentPerformance);
app.get("/api/students/performance/classify", getStudentsByPerformance);

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
const { uploadWeeklyCsv } = require("./src/http/uploadWeeklyCsvController");

app.post("/api/upload-weekly-csv", uploadWeeklyCsv);

// ----------------------------------------------------
// Export Firebase HTTPS function
// ----------------------------------------------------
exports.api = onRequest(app);
