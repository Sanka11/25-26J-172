# API Integration Guide: Services & Routes

This guide explains how to integrate the newly created services and routes into your Express backend.

## Overview

You now have three core components ready:

- **Services** (3): `FirestoreService`, `ChatHistoryService`, `PersonalizationService`
- **Routes** (2): `settingsRoutes`, `chatRoutes`
- **Utils**: `logger.js` for consistent logging

## Integration Steps

### Step 1: Update Your Main API File

Your main entry point (likely `index.js` or `api_updated.js`) needs to:

1. Import the services
2. Instantiate them
3. Register the routes

**Example: Updated `index.js`**

```javascript
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK (if not already done)
// admin.initializeApp();

// ============================================
// SERVICES & DEPENDENCIES
// ============================================

const { settingsRoutes, chatRoutes } = require("./routes");
const {
  FirestoreService,
  ChatHistoryService,
  PersonalizationService,
} = require("./services");
const logger = require("./utils/logger");

// Initialize services (these handle all business logic)
const firestoreService = new FirestoreService();
const chatHistoryService = new ChatHistoryService();
const personalizationService = new PersonalizationService();

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Verify Firebase ID token and attach user to request
 */
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Contains uid, email, etc.
    next();
  } catch (error) {
    logger.error(`Auth verification failed: ${error.message}`);
    res.status(401).json({ error: "Invalid authentication token" });
  }
};

// ============================================
// APPLY AUTHENTICATION MIDDLEWARE
// ============================================

app.use(verifyAuth);

// ============================================
// REGISTER ROUTES
// ============================================

// Settings API routes
app.use("/", settingsRoutes);

// Chat API routes
app.use("/", chatRoutes);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      firestore: "initialized",
      chatHistory: "initialized",
      personalization: "initialized",
    },
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
```

### Step 2: Update Cloud Functions Export (if using Firebase Functions)

If you're deploying as Cloud Functions, your `index.js` should export the app:

```javascript
const functions = require("firebase-functions");
const app = require("./api"); // Your main app file

// Export as Cloud Function
exports.api = functions.https.onRequest(app);
```

### Step 3: Environment Configuration

Create or update your `.env` file in the `backend/functions/` directory:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_NAME=(default)
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

### Step 4: Install Required Dependencies

Make sure all required packages are in your `backend/functions/package.json`:

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

Run: `npm install` in the `backend/functions/` directory

### Step 5: Create Firestore Collections

Before testing, create these collections in Firebase Console:

#### **user_settings** Collection

Document ID: `{userId}`

```json
{
  "userId": "user123",
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

#### **users** Collection

Document ID: `{userId}`

```json
{
  "userId": "user123",
  "email": "user@sliit.lk",
  "name": "Student Name",
  "studentId": "2024-001",
  "programme": "Information Technology",
  "semester": 4,
  "modules": ["CS101", "SE202", "ML301"],
  "learningPreferences": {
    "style": "visual",
    "pace": "moderate",
    "interactionLevel": "high"
  },
  "academicProfile": {
    "gpa": 3.8,
    "attendanceRate": 95,
    "assignmentCompletionRate": 100
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

#### **chat_history/{userId}/messages** Collection

Document ID: `{messageId}` (auto-generated)

```json
{
  "conversationId": "conv_1234567890",
  "sender": "user",
  "content": "How do I implement a REST API?",
  "timestamp": "2024-01-15T10:05:00Z",
  "metadata": {
    "responseMode": "hybrid",
    "tokens": 12
  }
}
```

### Step 6: Update Firestore Security Rules

In Firebase Console > Firestore > Rules, replace with:

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
    match /chat_history/{userId}/messages/{messageId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Available Endpoints

### Settings Management

| Method | Endpoint                              | Purpose                   |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/api/settings/:userId`               | Get all settings          |
| PUT    | `/api/settings/:userId`               | Update all settings       |
| POST   | `/api/settings/:userId/mode`          | Change response mode      |
| GET    | `/api/settings/:userId/notifications` | Get notification prefs    |
| PUT    | `/api/settings/:userId/notifications` | Update notification prefs |
| GET    | `/api/settings/:userId/appearance`    | Get appearance prefs      |
| PUT    | `/api/settings/:userId/appearance`    | Update appearance prefs   |

### Chat Management

| Method | Endpoint                                         | Purpose                     |
| ------ | ------------------------------------------------ | --------------------------- |
| POST   | `/api/chat/:userId/message`                      | Send message (triggers RAG) |
| GET    | `/api/chat/:userId/history`                      | Get chat history            |
| GET    | `/api/chat/:userId/conversations`                | Get recent conversations    |
| GET    | `/api/chat/:userId/conversation/:conversationId` | Get specific conversation   |
| DELETE | `/api/chat/:userId/history`                      | Delete all history          |
| DELETE | `/api/chat/:userId/message/:messageId`           | Delete single message       |
| POST   | `/api/chat/:userId/search`                       | Search messages             |
| GET    | `/api/chat/:userId/statistics`                   | Get chat stats              |
| POST   | `/api/chat/:userId/export`                       | Export chat history         |
| GET    | `/api/chat/:userId/reminders`                    | Get academic reminders      |
| GET    | `/api/chat/:userId/personalization`              | Get personalization context |

## Testing the Integration

### 1. Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "services": {
    "firestore": "initialized",
    "chatHistory": "initialized",
    "personalization": "initialized"
  }
}
```

### 2. Get Settings (requires auth token)

```bash
curl -X GET http://localhost:3000/api/settings/user123 \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

### 3. Update Settings

```bash
curl -X PUT http://localhost:3000/api/settings/user123 \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responseMode": "hybrid",
    "notifications": {
      "examReminders": true,
      "attendanceWarnings": true
    }
  }'
```

### 4. Send Message

```bash
curl -X POST http://localhost:3000/api/chat/user123/message \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "content": "How do I improve my GPA?"
    },
    "responseMode": "hybrid"
  }'
```

## Integration Checklist

- [ ] Update main `index.js` with services and routes
- [ ] Install all dependencies (`npm install`)
- [ ] Create Firestore collections with templates
- [ ] Update Firestore security rules
- [ ] Test health check endpoint
- [ ] Generate Firebase ID token for testing
- [ ] Test settings endpoints
- [ ] Test chat endpoints
- [ ] Integrate response mode logic into RAG function
- [ ] Wire frontend API calls to these endpoints
- [ ] Deploy to Firebase Functions

## Next Steps

1. **Integrate RAG**: Update the `/api/chat/:userId/message` endpoint to call your RAG system with response mode and personalization context
2. **Frontend Integration**: Update `settingsService.js` to call these new API endpoints instead of localStorage
3. **Deploy**: Run `firebase deploy` from the `backend/` directory

## Troubleshooting

### Endpoints Return 403 Forbidden

- **Issue**: Authentication middleware not recognizing user
- **Fix**: Ensure `Authorization: Bearer {TOKEN}` header is sent with each request
- **Token Source**: Generate from Firebase Console > Authentication > User > Get ID Token

### Firestore Write Errors

- **Issue**: Security rules denying writes
- **Fix**: Verify rules allow authenticated users to write to their own documents

### Service Initialization Errors

- **Issue**: Firebase Admin SDK not initialized
- **Fix**: Ensure `admin.initializeApp()` is called before services are instantiated

### CORS Errors

- **Issue**: Frontend cannot reach API
- **Fix**: Verify CORS middleware is enabled: `app.use(cors())`
