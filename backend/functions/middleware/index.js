/**
 * backend/functions/middleware/index.js
 * Export all middleware modules
 */

const authMiddleware = require("./authMiddleware");

module.exports = {
  ...authMiddleware,
};
