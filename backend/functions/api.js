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
// Endpoint:
// GET /api/student-risk-explanation?studentId=XXXX
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
// Endpoint examples:
// /api/rl/decide/:studentId
const rlRoutes = require("./features/rl/routes");
app.use("/api/rl", rlRoutes);

// ----------------------------------------------------
// Export Firebase HTTPS function
// ----------------------------------------------------
exports.api = onRequest(app);
