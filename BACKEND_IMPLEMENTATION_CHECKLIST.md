# Complete Backend Implementation Guide

## Overview

You now have all three service classes implemented:

- ✅ `firestore_service.py` - Database operations
- ✅ `chat_history_service.py` - Chat history management
- ✅ `personalization_service.py` - User personalization

This guide shows you how to integrate these into your existing backend.

---

## Step 1: Verify Service Files Are In Place

All three service files should be in: `backend/functions/app/services/`

```
backend/functions/app/services/
├── __init__.py                      ✅ Created
├── firestore_service.py             ✅ Created
├── chat_history_service.py          ✅ Created
└── personalization_service.py       ✅ Created
```

---

## Step 2: Update Your Existing index.js or Main API File

Your backend needs to integrate these three route files:

- `settings_routes.py` (already provided)
- `chat_routes.py` (already provided)
- `updated_rag_integration.py` (reference for RAG updates)

### Example: FastAPI Integration (`backend/functions/main.py` or equivalent)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import routes
from settings_routes import router as settings_router
from chat_routes import router as chat_router

# Import services
from app.services import (
    FirestoreService,
    ChatHistoryService,
    PersonalizationService
)

# Initialize services for dependency injection
firestore_service = FirestoreService()
chat_history_service = ChatHistoryService()
personalization_service = PersonalizationService()

# Create FastAPI app
app = FastAPI(title="AcademiGuard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Include routers
app.include_router(settings_router)
app.include_router(chat_router)

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "services": ["chat", "settings", "rag", "web_search"]}

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting AcademiGuard API...")
    logger.info("Services initialized: FirestoreService, ChatHistoryService, PersonalizationService")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Step 3: Update Your RAG Function

In `backend/functions/app/rag.py`, update the `answer_question()` function to accept response mode:

### Key Changes:

```python
# Add imports at top
from app.config import RAG_SIMILARITY_THRESHOLD, RESPONSE_MODES
from app.services import PersonalizationService
from app.services.web_search_service import WebSearchService

# Update function signature
def answer_question(
    question: str,
    user_id: str,
    response_mode: str = "hybrid",
    personalization_context: str = None,
    response_length: str = "balanced"
) -> dict:
    """
    Main question answering function with response mode support
    """

    # Validate response mode
    valid_modes = ["document", "web", "hybrid"]
    if response_mode not in valid_modes:
        response_mode = "hybrid"

    # DOCUMENT MODE: RAG only
    if response_mode == "document":
        return _search_rag_only(question, user_id, personalization_context, response_length)

    # WEB MODE: Web search only
    elif response_mode == "web":
        return _search_web_only(question, user_id, response_length)

    # HYBRID MODE: RAG first, web fallback
    else:
        return _search_hybrid(question, user_id, personalization_context, response_length)
```

---

## Step 4: Add to Configuration

Update `backend/functions/app/config.py`:

```python
# Response Mode Configuration
RAG_SIMILARITY_THRESHOLD = 1.2  # L2 distance

RESPONSE_MODES = {
    "document": {
        "description": "Search university documents and PDFs only",
        "fallback_enabled": False
    },
    "web": {
        "description": "Search web only, use internet sources",
        "fallback_enabled": False
    },
    "hybrid": {
        "description": "Try documents first, fall back to web search",
        "fallback_enabled": True
    }
}

RESPONSE_LENGTH_SETTINGS = {
    "brief": {"max_tokens": 300},
    "balanced": {"max_tokens": 800},
    "detailed": {"max_tokens": 1500}
}
```

---

## Step 5: Database Setup - Create Firestore Collections

In your Firebase Console, create these collections:

### Collection 1: `user_settings`

- Document ID: `{userId}`
- Fields:
  ```json
  {
    "userId": "string",
    "responseMode": "hybrid|document|web",
    "notifications": {
      "examReminders": boolean,
      "attendanceWarnings": boolean,
      "assignmentDeadlines": boolean,
      "paymentNotifications": boolean
    },
    "appearance": {
      "theme": "light|dark|system",
      "responseLength": "brief|balanced|detailed"
    },
    "dataPrivacy": boolean,
    "createdAt": "timestamp",
    "lastUpdated": "timestamp"
  }
  ```

### Collection 2: `chat_history`

- Sub-collection: `{userId}/messages`
- Document ID: auto-generated
- Fields:
  ```json
  {
    "userId": "string",
    "question": "string",
    "answer": "string",
    "answer_source": "document|web_search|hybrid",
    "responseMode": "hybrid|document|web",
    "sources": [{"title": "string", "url": "string"}],
    "web_sources": [{"title": "string", "url": "string", "snippet": "string"}],
    "confidence": number,
    "responseTime": number,
    "timestamp": "timestamp",
    "conversationId": "string",
    "ttl": "timestamp"
  }
  ```

### Collection 3: `users`

- Document ID: `{userId}`
- Fields:
  ```json
  {
    "id": "string",
    "displayName": "string",
    "email": "string",
    "academicLevel": "undergraduate|postgraduate",
    "department": "string",
    "modules": ["string"],
    "interests": ["string"],
    "joinedDate": "timestamp",
    "lastUpdated": "timestamp"
  }
  ```

---

## Step 6: Update Firestore Security Rules

Replace your Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User settings - private, user-only access
    match /user_settings/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth.token.admin == true;
    }

    // Chat history - private, user-only access
    match /chat_history/{userId}/messages/{messageId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth.token.admin == true;
    }

    // User profiles - read by self, admin can modify
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
      allow read, write: if request.auth.token.admin == true;
    }

    // Reminders collection (optional)
    match /reminders/{reminderId} {
      allow read: if request.auth != null;
    }
  }
}
```

---

## Step 7: Environment Variables

Update your `.env` file:

```env
# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# APIs
GOOGLE_CSE_API_KEY=your_google_search_api_key
GOOGLE_CSE_CX=your_custom_search_engine_id

# Backend URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Settings
RAG_SIMILARITY_THRESHOLD=1.2
DEFAULT_RESPONSE_MODE=hybrid
MESSAGE_RETENTION_DAYS=90
```

---

## Step 8: Testing the Integration

### Test 1: Health Check

```bash
curl http://localhost:8000/health
```

Expected Response:

```json
{
  "status": "healthy",
  "services": ["chat", "settings", "rag", "web_search"]
}
```

### Test 2: Get User Settings

```bash
curl -X GET http://localhost:8000/api/settings/user123 \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 3: Create Chat Message

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the plagiarism policy?",
    "responseMode": "hybrid",
    "userId": "user123",
    "userPreferences": {
      "responseLength": "balanced",
      "theme": "system"
    }
  }'
```

### Test 4: Change Response Mode

```bash
curl -X POST http://localhost:8000/api/settings/user123/mode \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "web"}'
```

---

## Step 9: Deployment Checklist

Before deploying to production:

- [ ] All three service files created and tested locally
- [ ] Firestore collections created with proper structure
- [ ] Firestore security rules updated
- [ ] Environment variables configured
- [ ] API routes properly registered in main app
- [ ] Authentication middleware working
- [ ] RAG function updated with response_mode parameter
- [ ] Front-end Settings Panel integrated
- [ ] Settings Provider wrapping the App
- [ ] API endpoints tested with curl
- [ ] Error handling tested
- [ ] Logs reviewed for errors
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## Step 10: Troubleshooting

### Issue: "FirestoreService initialization failed"

**Solution:** Ensure Firebase Admin SDK is initialized:

```python
import firebase_admin
from firebase_admin import credentials

if not firebase_admin._apps:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
```

### Issue: "Settings not saving"

**Solution:** Check Firestore rules allow write access and verify user ID matches token

### Issue: "Chat endpoint returns 401"

**Solution:** Verify Authorization header format: `Bearer YOUR_TOKEN_HERE`

### Issue: "Response mode not affecting results"

**Solution:** Ensure RAG function receives `response_mode` parameter and validates it

### Issue: "Personalization not working"

**Solution:** Verify user profile exists in `users` collection and modules are populated

---

## Production Performance Tips

1. **Add Caching**: Cache user settings for 24 hours
2. **Database Indexing**: Create composite indexes for common queries
3. **Batch Operations**: Use Firestore batch writes for bulk operations
4. **Rate Limiting**: Implement rate limiting per user (e.g., 100 requests/minute)
5. **Message Cleanup**: Set up scheduled task to clean expired messages
6. **Monitoring**: Add error tracking and performance monitoring
7. **Logging**: Use structured logging for debugging

---

## File Summary

**Created Files:**

- ✅ `firestore_service.py` - 22 methods for Firestore operations
- ✅ `chat_history_service.py` - 15 methods for chat management
- ✅ `personalization_service.py` - 11 methods for user personalization
- ✅ `services/__init__.py` - Package initializer

**Reference Files (provided earlier):**

- ✅ `settings_routes.py` - 8 API endpoints for settings
- ✅ `chat_routes.py` - 5 API endpoints for chat
- ✅ `Chat_Updated.jsx` - Frontend component with settings integration
- ✅ `ChatbotSettings.jsx` - Settings UI component
- ✅ `SettingsContext.jsx` - Global state management

**Configuration Files:**

- ✅ `SETTINGS_INTEGRATION_GUIDE.md` - Complete setup guide

---

## Next Steps

1. **Create the three services** ✅ DONE
2. **Set up Firestore collections** - See Step 5
3. **Update your main FastAPI/Express app** - See Step 2
4. **Integrate routes and services** - See Step 3
5. **Update RAG with response modes** - See Step 4
6. **Test all endpoints locally** - See Step 8
7. **Deploy to Firebase/Cloud** - See Step 9

---

## Support Resources

- Firebase Admin SDK Docs: https://firebase.google.com/docs/firestore
- FastAPI Docs: https://fastapi.tiangolo.com/
- React Docs: https://react.dev/
- AcademiGuard Presentation: `PRESENTATION_SPEECH.md`
- Architecture Diagrams: `ARCHITECTURE_DIAGRAMS.md`

---

**Version**: 1.0.0  
**Last Updated**: March 9, 2026  
**Status**: Ready for Implementation
