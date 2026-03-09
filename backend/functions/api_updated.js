// backend/functions/api_updated.js
// Main entry point with settings and chat routes integration

// Add these imports at the top
const express = require("express");
const cors = require("cors");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Import new route modules
const { settingsRoutes, chatRoutes } = require("./routes");

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const withAuthMiddleware = (req, res, next) => {
  const authorization = req.get("Authorization");
  if (!authorization) {
    return res.status(401).send("Missing Authorization header");
  }

  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).send("Invalid Authorization format");
  }

  const token = parts[1];

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch((error) => {
      console.error("Auth error:", error);
      return res.status(401).send("Unauthorized");
    });
};

// Apply authentication to protected routes
app.use("/api/settings", withAuthMiddleware);
app.use("/api/chat", withAuthMiddleware);

// Register route handlers
app.use("/", chatRoutes); // /api/chat/* endpoints
app.use("/", settingsRoutes); // /api/settings/* endpoints

// Health check endpoint
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint with details
app.get("/api/status", (req, res) => {
  return res.status(200).json({
    status: "online",
    version: "1.0.0",
    services: {
      chat: "active",
      settings: "active",
      rag: "active",
      webSearch: "active",
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  return res.status(error.status || 500).json({
    error: error.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

// Export as Cloud Function
exports.api = onRequest(app);

/**
 * INTEGRATION CHECKLIST:
 *
 * ✅ 1. Update backend/functions/index.js
 *    - Import and register settings_routes.py
 *    - Import and register chat_routes.py
 *    - Wire authentication middleware
 *
 * ✅ 2. Update backend/functions/api.js (THIS FILE)
 *    - Add settingsRoutes middleware
 *    - Add chatRoutes middleware
 *    - Configure CORS for frontend
 *
 * ✅ 3. Create Firestore service (app/services/firestore_service.py)
 *    Methods needed:
 *    - get_user_settings(user_id)
 *    - update_user_settings(user_id, settings)
 *    - get_user_profile(user_id)
 *    - create_user_settings(user_id, defaults)
 *
 * ✅ 4. Create Chat History service (app/services/chat_history_service.py)
 *    Methods needed:
 *    - save_message(message_dict)
 *    - get_user_chat_history(user_id)
 *    - get_recent_conversations(user_id, limit)
 *    - delete_user_chat_history(user_id)
 *    - search_conversations(user_id, query)
 *
 * ✅ 5. Create Personalization service (app/services/personalization_service.py)
 *    Methods needed:
 *    - get_user_profile(user_id)
 *    - build_personalization_context(profile, context)
 *    - get_academic_reminders(user_id, topic)
 *    - update_learning_preferences(user_id, preferences)
 *
 * ✅ 6. Update app/rag.py
 *    - Add response_mode parameter to answer_question()
 *    - Implement _search_rag_only()
 *    - Implement _search_web_only()
 *    - Implement _search_hybrid()
 *    - Add _check_rag_relevance() function
 *
 * ✅ 7. Update frontend - Wrap App with SettingsProvider
 *    In frontend/src/main.jsx:
 *    import { SettingsProvider } from './context/SettingsContext';
 *
 *    <React.StrictMode>
 *      <SettingsProvider>
 *        <App />
 *      </SettingsProvider>
 *    </React.StrictMode>
 *
 * ✅ 8. Update frontend/src/components/Chat.jsx
 *    - Import ChatbotSettings component
 *    - Add settings icon to header
 *    - Wire up response mode to API calls
 *    - Pass settings to chat endpoint
 */
