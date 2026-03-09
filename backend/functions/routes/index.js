/**
 * backend/functions/routes/index.js
 * Export all route modules
 */

const settingsRoutes = require("./settingsRoutes");
const chatRoutes = require("./chatRoutes");

module.exports = {
  settingsRoutes,
  chatRoutes,
};
