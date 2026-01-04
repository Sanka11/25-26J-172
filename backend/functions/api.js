// /**
//  * Firebase Functions backend (common entry)
//  */

const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");

// Express app
const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

// Health check (common)
app.get("/", (req, res) => {
  res.json({ message: "Backend Connected" });
});

// ----------------------------------------------------
// EXISTING FEATURE ROUTES (DO NOT CHANGE)
// ----------------------------------------------------
const disengagementRoutes = require("./features/disengagement/routes");
app.use("/api", disengagementRoutes);

// ----------------------------------------------------
// 🔹 RL FEATURE ROUTES (ADDED BY <your name / RL module>)
// ----------------------------------------------------
// This connects Firebase backend → RL FastAPI service
// Endpoint: /api/rl/decide/:studentId
// Calls: http://127.0.0.1:8000/rl/decide/{studentId}
const rlRoutes = require("./features/rl/routes");
app.use("/api/rl", rlRoutes);

// ----------------------------------------------------
// Export Firebase HTTPS function
// ----------------------------------------------------
exports.api = onRequest(app);
