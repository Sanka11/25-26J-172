/**
 * backend/functions/services/firestoreService.js
 * Firestore database operations for user settings and profiles
 */

const admin = require("firebase-admin");
const logger = require("../utils/logger");

class FirestoreService {
  constructor() {
    this.db = admin.firestore();
    this.settingsCollection = "user_settings";
    this.usersCollection = "users";
    logger.info("FirestoreService initialized");
  }

  /**
   * Retrieve user settings from Firestore
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} User settings or null if not found
   */
  async getUserSettings(userId) {
    try {
      const doc = await this.db
        .collection(this.settingsCollection)
        .doc(userId)
        .get();

      if (doc.exists) {
        logger.debug(`Retrieved settings for user ${userId}`);
        return doc.data();
      }

      logger.debug(`No settings found for user ${userId}`);
      return null;
    } catch (error) {
      logger.error(
        `Error retrieving settings for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update user settings in Firestore
   * @param {string} userId - The user's ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<boolean>} True if successful
   */
  async updateUserSettings(userId, settings) {
    try {
      // Ensure timestamp is updated
      settings.lastUpdated = new Date().toISOString();

      // Merge update (updates only specified fields)
      await this.db
        .collection(this.settingsCollection)
        .doc(userId)
        .set(settings, { merge: true });

      logger.info(`Settings updated for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error updating settings for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create default settings for new user
   * @param {string} userId - The user's ID
   * @param {Object} defaults - Optional default settings overrides
   * @returns {Promise<boolean>} True if successful
   */
  async createUserSettings(userId, defaults = {}) {
    try {
      const settings = {
        userId,
        responseMode: defaults.responseMode || "hybrid",
        notifications: {
          examReminders: true,
          attendanceWarnings: true,
          assignmentDeadlines: true,
          paymentNotifications: true,
        },
        appearance: {
          theme: defaults.theme || "system",
          responseLength: "balanced",
        },
        dataPrivacy: true,
        notificationSettings: {
          enablePushNotifications: true,
          enableEmailNotifications: false,
          quietHours: {
            enabled: false,
            startTime: "22:00",
            endTime: "08:00",
          },
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      await this.db
        .collection(this.settingsCollection)
        .doc(userId)
        .set(settings);
      logger.info(`Default settings created for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error creating default settings for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user profile for personalization
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    try {
      const doc = await this.db
        .collection(this.usersCollection)
        .doc(userId)
        .get();

      if (doc.exists) {
        logger.debug(`Retrieved profile for user ${userId}`);
        return doc.data();
      }

      // Return default profile if not found
      const defaultProfile = {
        id: userId,
        displayName: "Student",
        email: "",
        academicLevel: "undergraduate",
        department: "",
        modules: [],
        interests: [],
        preferences: {},
        joinedDate: new Date().toISOString(),
      };

      logger.debug(`No profile found for user ${userId}, returning defaults`);
      return defaultProfile;
    } catch (error) {
      logger.error(
        `Error retrieving profile for user ${userId}: ${error.message}`,
      );
      // Return default profile on error
      return {
        id: userId,
        displayName: "Student",
        academicLevel: "undergraduate",
        modules: [],
        interests: [],
      };
    }
  }

  /**
   * Update user profile
   * @param {string} userId - The user's ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<boolean>} True if successful
   */
  async updateUserProfile(userId, profileData) {
    try {
      profileData.lastUpdated = new Date().toISOString();

      await this.db
        .collection(this.usersCollection)
        .doc(userId)
        .set(profileData, { merge: true });

      logger.info(`Profile updated for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error updating profile for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user's enrolled modules
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>} List of module IDs
   */
  async getUserModules(userId) {
    try {
      const profile = await this.getUserProfile(userId);
      return profile.modules || [];
    } catch (error) {
      logger.error(
        `Error retrieving modules for user ${userId}: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Add a module to user's profile
   * @param {string} userId - The user's ID
   * @param {string} moduleId - The module ID to add
   * @returns {Promise<boolean>} True if successful
   */
  async addUserModule(userId, moduleId) {
    try {
      const profile = await this.getUserProfile(userId);
      const modules = profile.modules || [];

      if (!modules.includes(moduleId)) {
        modules.push(moduleId);
        return this.updateUserProfile(userId, { modules });
      }

      return true;
    } catch (error) {
      logger.error(`Error adding module for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove a module from user's profile
   * @param {string} userId - The user's ID
   * @param {string} moduleId - The module ID to remove
   * @returns {Promise<boolean>} True if successful
   */
  async removeUserModule(userId, moduleId) {
    try {
      const profile = await this.getUserProfile(userId);
      let modules = profile.modules || [];

      if (modules.includes(moduleId)) {
        modules = modules.filter((m) => m !== moduleId);
        return this.updateUserProfile(userId, { modules });
      }

      return true;
    } catch (error) {
      logger.error(
        `Error removing module for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete user settings (for account deletion)
   * @param {string} userId - The user's ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteUserSettings(userId) {
    try {
      await this.db.collection(this.settingsCollection).doc(userId).delete();
      logger.info(`Settings deleted for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error deleting settings for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }
}

module.exports = FirestoreService;
