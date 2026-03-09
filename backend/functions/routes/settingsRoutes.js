/**
 * backend/functions/routes/settingsRoutes.js
 * Express routes for user settings management
 */

const express = require("express");
const router = express.Router();
const { FirestoreService } = require("../services");
const logger = require("../utils/logger");

// Initialize service
const firestoreService = new FirestoreService();

/**
 * GET /api/settings/:userId
 * Retrieve user settings
 */
router.get("/api/settings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is accessing their own settings
    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's settings" });
    }

    const settings = await firestoreService.getUserSettings(userId);

    if (!settings) {
      // Return default settings if none exist
      const defaults = {
        userId,
        responseMode: "hybrid",
        notifications: {
          examReminders: true,
          attendanceWarnings: true,
          assignmentDeadlines: true,
          paymentNotifications: true,
        },
        appearance: {
          theme: "system",
          responseLength: "balanced",
        },
        dataPrivacy: true,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      return res.status(200).json(defaults);
    }

    res.status(200).json(settings);
  } catch (error) {
    logger.error(`Error retrieving settings: ${error.message}`);
    res.status(500).json({ error: "Error retrieving settings" });
  }
});

/**
 * PUT /api/settings/:userId
 * Update user settings
 */
router.put("/api/settings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    // Verify user is updating their own settings
    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot update other user's settings" });
    }

    // Update last modified timestamp
    settings.lastUpdated = new Date().toISOString();

    // Save to Firestore
    await firestoreService.updateUserSettings(userId, settings);

    res.status(200).json(settings);
  } catch (error) {
    logger.error(`Error updating settings: ${error.message}`);
    res.status(500).json({ error: "Error updating settings" });
  }
});

/**
 * POST /api/settings/:userId/mode
 * Change response mode for user
 */
router.post("/api/settings/:userId/mode", async (req, res) => {
  try {
    const { userId } = req.params;
    const { mode } = req.body;

    // Verify user is updating their own settings
    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot update other user's settings" });
    }

    // Validate mode
    const validModes = ["document", "web", "hybrid"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Must be one of: ${validModes.join(", ")}`,
      });
    }

    // Get current settings
    const currentSettings = await firestoreService.getUserSettings(userId);

    // Update response mode
    const updatedSettings = {
      ...(currentSettings || {}),
      responseMode: mode,
      lastUpdated: new Date().toISOString(),
    };

    // Save to Firestore
    await firestoreService.updateUserSettings(userId, updatedSettings);

    res.status(200).json({ mode });
  } catch (error) {
    logger.error(`Error changing response mode: ${error.message}`);
    res.status(500).json({ error: "Error changing response mode" });
  }
});

/**
 * GET /api/settings/:userId/notifications
 * Get user's notification preferences
 */
router.get("/api/settings/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's settings" });
    }

    const settings = await firestoreService.getUserSettings(userId);
    const notifications = settings?.notifications || {
      examReminders: true,
      attendanceWarnings: true,
      assignmentDeadlines: true,
      paymentNotifications: true,
    };

    res.status(200).json(notifications);
  } catch (error) {
    logger.error(`Error retrieving notification preferences: ${error.message}`);
    res
      .status(500)
      .json({ error: "Error retrieving notification preferences" });
  }
});

/**
 * PUT /api/settings/:userId/notifications
 * Update user's notification preferences
 */
router.put("/api/settings/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot update other user's settings" });
    }

    // Get current settings
    const currentSettings = await firestoreService.getUserSettings(userId);

    // Update notifications
    const updatedSettings = {
      ...(currentSettings || {}),
      notifications: preferences,
      lastUpdated: new Date().toISOString(),
    };

    // Save to Firestore
    await firestoreService.updateUserSettings(userId, updatedSettings);

    res.status(200).json(preferences);
  } catch (error) {
    logger.error(`Error updating notification preferences: ${error.message}`);
    res.status(500).json({ error: "Error updating notification preferences" });
  }
});

/**
 * GET /api/settings/:userId/appearance
 * Get user's appearance preferences
 */
router.get("/api/settings/:userId/appearance", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's settings" });
    }

    const settings = await firestoreService.getUserSettings(userId);
    const appearance = settings?.appearance || {
      theme: "system",
      responseLength: "balanced",
    };

    res.status(200).json(appearance);
  } catch (error) {
    logger.error(`Error retrieving appearance preferences: ${error.message}`);
    res.status(500).json({ error: "Error retrieving appearance preferences" });
  }
});

/**
 * PUT /api/settings/:userId/appearance
 * Update user's appearance preferences
 */
router.put("/api/settings/:userId/appearance", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot update other user's settings" });
    }

    // Get current settings
    const currentSettings = await firestoreService.getUserSettings(userId);

    // Update appearance
    const updatedSettings = {
      ...(currentSettings || {}),
      appearance: preferences,
      lastUpdated: new Date().toISOString(),
    };

    // Save to Firestore
    await firestoreService.updateUserSettings(userId, updatedSettings);

    res.status(200).json(preferences);
  } catch (error) {
    logger.error(`Error updating appearance preferences: ${error.message}`);
    res.status(500).json({ error: "Error updating appearance preferences" });
  }
});

module.exports = router;
