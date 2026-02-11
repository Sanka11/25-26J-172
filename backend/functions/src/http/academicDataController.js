// backend/functions/src/http/academicDataController.js
const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();

/**
 * Get all deadlines (sorted by date)
 */
const getAllDeadlines = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db
      .collection("deadlines")
      .orderBy("dueDate", "asc")
      .get();

    const deadlines = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(deadlines);
  } catch (error) {
    console.error("getAllDeadlines error:", error);
    return res
      .status(500)
      .json({ error: "Failed to load deadlines" });
  }
});

/**
 * Get module info including LIC details
 */
const getModuleInfo = functions.https.onRequest(async (req, res) => {
  try {
    const { moduleCode } = req.query;
    if (!moduleCode) {
      return res.status(400).json({ error: "Module code required" });
    }

    const doc = await db.collection("modules").doc(moduleCode).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Module not found" });
    }

    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("getModuleInfo error:", error);
    return res.status(500).json({ error: "Failed to load module info" });
  }
});

/**
 * Get upcoming deadlines (next 30 days)
 */
const getUpcomingDeadlines = functions.https.onRequest(async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection("deadlines")
      .where("dueDate", ">=", now)
      .where("dueDate", "<=", thirtyDaysFromNow)
      .orderBy("dueDate", "asc")
      .get();

    const deadlines = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(deadlines);
  } catch (error) {
    console.error("getUpcomingDeadlines error:", error);
    return res.status(500).json({ error: "Failed to load upcoming deadlines" });
  }
});

module.exports = {
  getAllDeadlines,
  getModuleInfo,
  getUpcomingDeadlines,
};