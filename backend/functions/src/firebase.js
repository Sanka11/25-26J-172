const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    // Fallback for local emulator without credentials
    admin.initializeApp({
      projectId: "demiguard-3b4e8",
    });
  }
}

module.exports = admin;
