/**
 * Firebase Functions backend (common entry)
 */

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

// Register feature routes
const disengagementRoutes = require("./features/disengagement/routes");
app.use("/api", disengagementRoutes);

// Export function
exports.api = onRequest(app);
