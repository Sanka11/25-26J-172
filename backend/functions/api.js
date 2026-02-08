/**
 * Firebase Functions backend (common entry)
 */

const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");

// -------------------------------
// Express app setup
// -------------------------------
const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

// -------------------------------
// Health check
// -------------------------------
app.get("/", (req, res) => {
  res.json({ message: "Backend Connected" });
});

// -------------------------------
// Explainable AI – Student Risk
// -------------------------------
// GET /api/student-risk-explanation?studentId=S1000
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

// ✅ FIXED PATH
app.get("/api/students/:studentId/risk-history", getStudentRiskHistory);

// ----------------------------------------------------
// Risk real-time
// ----------------------------------------------------
const { updateStudentMetrics } = require("./src/http/realtimeRiskController");

app.post("/api/student/update-metrics", updateStudentMetrics);

// ----------------------------------------------------
// Export Firebase HTTPS function
// ----------------------------------------------------
exports.api = onRequest(app);
