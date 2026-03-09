/**
 * backend/functions/utils/logger.js
 * Simple logging utility
 */

const isDevelopment = process.env.NODE_ENV !== "production";

const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  },

  debug: (message) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  },

  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  },

  warning: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  },

  error: (message) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  },
};

module.exports = logger;
