# Backend Integration Checklist

## Complete setup guide for integrating services, routes, and middleware

---

## Phase 1: File Structure Setup ✅

### Already Created (You can verify these files exist):

```
backend/functions/
├── services/
│   ├── index.js ✅
│   ├── firestoreService.js ✅
│   ├── chatHistoryService.js ✅
│   └── personalizationService.js ✅
├── routes/
│   ├── index.js ✅
│   ├── settingsRoutes.js ✅
│   └── chatRoutes.js ✅
├── middleware/
│   ├── index.js ✅
│   └── authMiddleware.js ✅
├── utils/
│   └── logger.js ✅
└── api_updated.js (Your existing file)
```

**Action**: Verify all files exist in their correct directories.

---

## Phase 2: Main API Update

### Task: Update `backend/functions/index.js` or `backend/functions/api_updated.js`

**2.1 Add imports at the top:**

```javascript
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// NEW IMPORTS
const { settingsRoutes, chatRoutes } = require("./routes");
const { withAuthMiddleware } = require("./middleware");
const logger = require("./utils/logger");

// Initialize Firebase Admin SDK (if not already done)
// admin.initializeApp();
```

**2.2 Create Express app and add middleware:**

```javascript
const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
app.use(withAuthMiddleware);

// Register routes
app.use("/", settingsRoutes);
app.use("/", chatRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

**Verification**:

```bash
# Test this in terminal after updating:
curl -X GET http://localhost:3000/api/health \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return: { "status": "ok", "timestamp": "..." }
```

---

## Phase 3: Dependencies Check

### Task: Verify `backend/functions/package.json` has required packages

**3.1 Required dependencies:**

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.0.0",
    "cors": "^2.8.5"
  }
}
```

**3.2 If any are missing, run:**

```bash
cd backend/functions/
npm install express firebase-admin firebase-functions cors
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 4: Environment Configuration

### Task: Create or update `.env` in `backend/functions/`

**4.1 Create `backend/functions/.env`:**

```env
# Environment
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Logging
LOG_LEVEL=debug
```

**4.2 Update if deploying to Firebase Functions:**

```bash
# Set environment variables (optional, for production)
firebase functions:config:set openai.key="your_key"
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 5: Firestore Collections Setup

### Task: Create collections in Firebase Console

**5.1 Go to Firebase Console:**

1. Project → Firestore Database
2. Create new collection

**5.2 Create 'user_settings' collection:**

- Collection ID: `user_settings`
- First document ID: Leave empty (auto-generate)
- Or manually set ID to a test user ID: `test-user-123`

**Sample document:**

```json
{
  "userId": "test-user-123",
  "responseMode": "hybrid",
  "notifications": {
    "examReminders": true,
    "attendanceWarnings": true,
    "assignmentDeadlines": true,
    "paymentNotifications": true
  },
  "appearance": {
    "theme": "light",
    "responseLength": "balanced"
  },
  "dataPrivacy": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

**5.3 Create 'users' collection:**

- Collection ID: `users`
- Document ID: Use a test user ID

**Sample document:**

```json
{
  "userId": "test-user-123",
  "email": "student@sliit.lk",
  "name": "Test Student",
  "studentId": "2024-001",
  "programme": "Information Technology",
  "semester": 4,
  "modules": ["CS101", "SE202", "ML301"],
  "learningPreferences": {
    "style": "visual",
    "pace": "moderate",
    "interactionLevel": "high"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

**5.4 Create 'chat_history' collection structure:**

- Collection ID: `chat_history`
- Document ID: Use a test user ID

Then create a subcollection:

- Subcollection ID: `messages`
- Add sample message:

```json
{
  "conversationId": "conv_123",
  "sender": "user",
  "content": "How do I pass this course?",
  "timestamp": "2024-01-15T10:05:00Z",
  "metadata": {
    "responseMode": "hybrid"
  }
}
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 6: Firestore Security Rules

### Task: Update Firestore Security Rules

**6.1 Go to Firebase Console:**

1. Firestore Database → Rules tab
2. Copy this rule set:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User Settings - Only accessible by owner
    match /user_settings/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // User Profiles - Only accessible by owner
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Chat History - Only accessible by owner
    match /chat_history/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }

    // Default: Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**6.2 Publish rules**

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 7: API Testing

### Task: Test all endpoints with proper authentication

**7.1 Get a Firebase ID Token**

```bash
# Use Firebase CLI to get a test token (requires authentication)
firebase login
firebase functions:shell  # Then use getAuth() in the shell

# OR use your frontend auth and grab the token from localStorage
# Check the browser console:
# firebase.auth().currentUser.getIdToken().then(token => console.log(token))
```

**7.2 Test Settings Endpoints**

```bash
# 1. GET all settings
curl -X GET http://localhost:3000/api/settings/test-user-123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -i

# Expected: 200 OK with settings object

# 2. UPDATE settings
curl -X PUT http://localhost:3000/api/settings/test-user-123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"responseMode":"web"}' \
  -i

# Expected: 200 OK with updated settings

# 3. Change response mode
curl -X POST http://localhost:3000/api/settings/test-user-123/mode \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"document"}' \
  -i

# Expected: 200 OK
```

**7.3 Test Chat Endpoints**

```bash
# 1. Send message
curl -X POST http://localhost:3000/api/chat/test-user-123/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":{"content":"How do I improve my GPA?"},"responseMode":"hybrid"}' \
  -i

# Expected: 200 OK with conversationId

# 2. Get chat history
curl -X GET http://localhost:3000/api/chat/test-user-123/history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -i

# Expected: 200 OK with messages array

# 3. Get chat statistics
curl -X GET http://localhost:3000/api/chat/test-user-123/statistics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -i

# Expected: 200 OK with stats object
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 8: Frontend API Service Update

### Task: Update `frontend/src/services/settingsService.js` to call backend

**8.1 Current structure (localStorage only):**

This file currently stores settings in localStorage. We need to update it to call our new API.

**8.2 Update to use API:**

Replace your `settingsService.js` with API calls:

```javascript
// frontend/src/services/settingsService.js

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// Get auth token from Firebase
const getAuthToken = async () => {
  const token = await window.firebase.auth().currentUser?.getIdToken();
  return token;
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const settingsService = {
  // Get settings
  async getUserSettings(userId) {
    try {
      const response = await api.get(`/api/settings/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return null;
    }
  },

  // Update settings
  async saveUserSettings(userId, settings) {
    try {
      const response = await api.put(`/api/settings/${userId}`, settings);
      return response.data;
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  },

  // Update response mode
  async updateResponseMode(userId, mode) {
    try {
      const response = await api.post(`/api/settings/${userId}/mode`, { mode });
      return response.data;
    } catch (error) {
      console.error("Error updating response mode:", error);
      throw error;
    }
  },

  // Export chat history
  async exportChatHistory(userId, format = "json") {
    try {
      const response = await api.post(
        `/api/chat/${userId}/export`,
        { format },
        { responseType: format === "csv" ? "blob" : "json" },
      );

      // Trigger download
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat_history_${Date.now()}.${format}`;
      link.click();

      return true;
    } catch (error) {
      console.error("Error exporting chat history:", error);
      throw error;
    }
  },

  // Clear chat history
  async clearChatHistory(userId) {
    try {
      const response = await api.delete(`/api/chat/${userId}/history`);
      return response.data;
    } catch (error) {
      console.error("Error clearing chat history:", error);
      throw error;
    }
  },
};

export default settingsService;
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 9: Integrate RAG Response Mode Logic

### Task: Wire response mode into your RAG system

**9.1 Modify your RAG answer function to accept response_mode:**

```python
# In your ml-service app/main.py or API endpoint

def answer_question(question, user_id=None, response_mode='hybrid', context=None):
    """
    Main RAG function with response mode support

    Args:
        question: User's question
        user_id: User ID for personalization
        response_mode: 'document', 'web', or 'hybrid'
        context: Personalization context from service

    Returns:
        { 'answer': str, 'mode': str, 'sources': list }
    """

    if response_mode == 'document':
        return _search_rag_only(question, context)
    elif response_mode == 'web':
        return _search_web_only(question, context)
    elif response_mode == 'hybrid':
        return _search_hybrid(question, context)
    else:
        return _search_hybrid(question, context)  # Default


def _search_rag_only(question, context):
    """Search only RAG/PDF knowledge base"""
    pass


def _search_web_only(question, context):
    """Search only web using Google Custom Search"""
    pass


def _search_hybrid(question, context):
    """Try RAG first, fallback to web if not relevant"""
    pass
```

**9.2 Update backend chat endpoint to call RAG:**

In `backend/functions/routes/chatRoutes.js`, replace the TODO comment:

```javascript
// In POST /api/chat/:userId/message endpoint

// Call your RAG service (Python endpoint)
const ragResponse = await fetch("http://localhost:5000/api/answer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: message.content,
    user_id: userId,
    response_mode: mode,
    context: personalizationContext,
  }),
});

const answer = await ragResponse.json();

// Save assistant message
const assistantMessage = {
  conversationId: userMessage.conversationId,
  sender: "assistant",
  content: answer.answer,
  timestamp: new Date().toISOString(),
  metadata: {
    responseMode: mode,
    sources: answer.sources || [],
  },
};

await chatHistoryService.saveMessage(userId, assistantMessage);

res.status(200).json({
  conversationId: userMessage.conversationId,
  message: answer.answer,
  mode: mode,
  sources: answer.sources || [],
});
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 10: Deployment

### Task: Deploy to Firebase Functions

**10.1 Test locally first:**

```bash
cd backend/functions/

# Install dependencies
npm install

# Start local emulator
firebase emulators:start --only functions

# In another terminal, test endpoints
curl -X GET http://localhost:5001/your-project/us-central1/api/health
```

**10.2 Deploy to Firebase:**

```bash
cd backend/

# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Check deployment status
firebase functions:list
```

**10.3 Update frontend environment:**

In `frontend/.env`:

```env
VITE_API_BASE=https://us-central1-your-project.cloudfunctions.net/api
```

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Phase 11: Frontend Integration

### Task: Wrap app with SettingsProvider and update Chat component

**11.1 Update `frontend/src/main.jsx`:**

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { SettingsProvider } from "./context/SettingsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>,
);
```

**11.2 Update Chat component:**

Use `Chat_Updated.jsx` logic with:

- Settings modal integration
- Response mode indicator
- Export/Delete functionality

**Status**: ☐ Not Started | ⚙️ In Progress | ✅ Complete

---

## Summary

| Phase | Task                  | Status    | Time |
| ----- | --------------------- | --------- | ---- |
| 1     | File Structure        | ✅ Done   | -    |
| 2     | Main API Update       | ⏳ 15 min |      |
| 3     | Dependencies          | ⏳ 5 min  |      |
| 4     | Environment Config    | ⏳ 5 min  |      |
| 5     | Firestore Collections | ⏳ 10 min |      |
| 6     | Security Rules        | ⏳ 5 min  |      |
| 7     | API Testing           | ⏳ 15 min |      |
| 8     | Frontend API Service  | ⏳ 15 min |      |
| 9     | RAG Integration       | ⏳ 30 min |      |
| 10    | Deployment            | ⏳ 20 min |      |
| 11    | Frontend Integration  | ⏳ 10 min |      |

**Total Estimated Time: ~2.5 hours**

---

## Next Steps

1. ☐ Review all files created (verify they exist)
2. ☐ Complete Phase 2 (Update main API)
3. ☐ Complete Phase 5 (Create Firestore collections)
4. ☐ Complete Phase 7 (Test API endpoints)
5. ☐ Complete Phase 8 (Update frontend service)
6. ☐ Complete Phase 9 (Wire RAG integration)
7. ☐ Complete Phase 10 (Deploy)

---

## Support

If you encounter issues:

1. Check logs: `firebase functions:log`
2. Review error messages in browser console
3. Verify Firestore security rules
4. Ensure auth tokens are valid and not expired
