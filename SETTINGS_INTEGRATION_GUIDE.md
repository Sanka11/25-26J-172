# Settings Panel & Response Modes - Complete Integration Guide

## Overview

This guide explains how to integrate the new **Chatbot Settings Panel** and **Response Modes** system into your AcademiGuard application. The system allows users to control:

- **Response Modes**: Document (RAG only), Web (search only), or Hybrid (RAG with web fallback)
- **Notifications**: Toggle academic alerts (exams, attendance, assignments, payments)
- **Appearance**: Theme customization (light/dark/system) and response detail level
- **Data Management**: Export and delete chat history

## Architecture Overview

```
Frontend (React)
├── ChatbotSettings.jsx        # Settings UI component (4 tabs)
├── Chat.jsx                   # Updated with settings integration
├── settingsService.js         # API communication
└── SettingsContext.jsx        # Global state management

Backend (FastAPI/Node.js)
├── settings_routes.py         # Settings CRUD endpoints
├── chat_routes.py            # Chat endpoint with mode support
├── updatead_rag_integration.py # RAG logic with response modes
└── Services/
    ├── firestore_service.py   # Database operations
    ├── chat_history_service.py # Chat history management
    └── personalization_service.py # User profile & reminders

External APIs
├── Google Custom Search API   # Web search functionality
├── Firestore                  # User settings & profiles
└── Firebase Cloud Messaging   # Push notifications
```

---

## Step 1: Frontend Setup

### 1.1 Wrap App with SettingsProvider

Update `frontend/src/main.jsx`:

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
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

### 1.2 Update Chat Component

Replace your existing `frontend/src/components/Chat.jsx` with the provided `Chat_Updated.jsx`. Key changes:

- Added ⚙️ settings icon in header
- Integrated `ChatbotSettings` modal opening
- Pass `responseMode` to chat API
- Handle theme changes from settings
- Export/clear chat functionality

### 1.3 Files Already Created

✅ `frontend/src/components/ChatbotSettings.jsx` - Ready to use
✅ `frontend/src/services/settingsService.js` - Ready to use
✅ `frontend/src/context/SettingsContext.jsx` - Ready to use

---

## Step 2: Environment Configuration

### 2.1 Update `.env` file

Add these settings variables:

```env
# Settings API
VITE_API_BASE_URL=http://localhost:5000
VITE_SETTINGS_API_ENDPOINT=/api/settings
VITE_CHAT_API_ENDPOINT=/api/chat

# Response Mode Defaults
VITE_DEFAULT_RESPONSE_MODE=hybrid
VITE_DEFAULT_THEME=system
VITE_DEFAULT_RESPONSE_LENGTH=balanced

# Feature Flags
VITE_ENABLE_WEB_SEARCH=true
VITE_ENABLE_EXPORT_HISTORY=true
VITE_ENABLE_NOTIFICATIONS=true
```

### 2.2 Update `.env.example`

Add the same variables documented for reference.

---

## Step 3: Backend Service Implementation

### 3.1 Create Firestore Service

Create `backend/functions/app/services/firestore_service.py`:

```python
import firebase_admin
from firebase_admin import firestore
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FirestoreService:
    def __init__(self):
        self.db = firestore.client()
        self.settings_collection = 'user_settings'
        self.users_collection = 'users'

    def get_user_settings(self, user_id: str) -> dict:
        """Retrieve user settings from Firestore"""
        try:
            doc = self.db.collection(self.settings_collection).document(user_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting settings: {e}")
            raise

    def update_user_settings(self, user_id: str, settings: dict) -> bool:
        """Update user settings in Firestore"""
        try:
            self.db.collection(self.settings_collection).document(user_id).set(
                settings,
                merge=True
            )
            logger.info(f"Settings updated for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            raise

    def get_user_profile(self, user_id: str) -> dict:
        """Get user profile for personalization"""
        try:
            doc = self.db.collection(self.users_collection).document(user_id).get()
            if doc.exists:
                return doc.to_dict()
            return {
                'id': user_id,
                'academicLevel': 'undergraduate',
                'modules': [],
                'preferences': {}
            }
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            raise

    def create_user_settings(self, user_id: str, defaults: dict) -> bool:
        """Create default settings for new user"""
        try:
            settings = {
                'userId': user_id,
                'responseMode': defaults.get('responseMode', 'hybrid'),
                'notifications': {
                    'examReminders': True,
                    'attendanceWarnings': True,
                    'assignmentDeadlines': True,
                    'paymentNotifications': True
                },
                'appearance': {
                    'theme': defaults.get('theme', 'system'),
                    'responseLength': 'balanced'
                },
                'dataPrivacy': True,
                'createdAt': datetime.now().isoformat(),
                'lastUpdated': datetime.now().isoformat()
            }

            self.db.collection(self.settings_collection).document(user_id).set(settings)
            logger.info(f"Default settings created for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error creating default settings: {e}")
            raise
```

### 3.2 Create Chat History Service

Create `backend/functions/app/services/chat_history_service.py`:

```python
import firebase_admin
from firebase_admin import firestore
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ChatHistoryService:
    def __init__(self):
        self.db = firestore.client()
        self.history_collection = 'chat_history'

    async def save_message(self, message: dict) -> str:
        """Save a chat message to history"""
        try:
            # Add metadata
            message['timestamp'] = datetime.now().isoformat()
            message['ttl'] = (datetime.now() + timedelta(days=90)).isoformat()

            # Save to Firestore
            user_id = message['userId']
            doc_ref = self.db.collection(self.history_collection).document(user_id).collection('messages').add(message)

            logger.info(f"Message saved for user {user_id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise

    def get_user_chat_history(self, user_id: str, limit: int = None) -> List[Dict]:
        """Get all chat history for user"""
        try:
            query = self.db.collection(self.history_collection).document(user_id).collection('messages')

            if limit:
                query = query.limit(limit)

            docs = query.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()

            messages = []
            for doc in docs:
                messages.append(doc.to_dict())

            return messages
        except Exception as e:
            logger.error(f"Error retrieving chat history: {e}")
            raise

    def get_recent_conversations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get recent conversations for user"""
        try:
            messages = self.get_user_chat_history(user_id, limit=limit)
            return messages
        except Exception as e:
            logger.error(f"Error getting recent conversations: {e}")
            raise

    def delete_user_chat_history(self, user_id: str) -> int:
        """Delete all chat history for user"""
        try:
            docs = self.db.collection(self.history_collection).document(user_id).collection('messages').stream()

            count = 0
            for doc in docs:
                doc.reference.delete()
                count += 1

            logger.info(f"Deleted {count} messages for user {user_id}")
            return count
        except Exception as e:
            logger.error(f"Error deleting chat history: {e}")
            raise

    def search_conversations(self, user_id: str, query_text: str) -> List[Dict]:
        """Search through user's chat history"""
        try:
            docs = self.db.collection(self.history_collection).document(user_id).collection('messages').stream()

            results = []
            for doc in docs:
                message = doc.to_dict()
                # Simple text search (consider Firestore full-text search for scale)
                if query_text.lower() in message.get('question', '').lower() or \
                   query_text.lower() in message.get('answer', '').lower():
                    results.append(message)

            return results
        except Exception as e:
            logger.error(f"Error searching conversations: {e}")
            raise

    def get_chat_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get chat statistics for user"""
        try:
            messages = self.get_user_chat_history(user_id, limit=1000)

            stats = {
                'total_messages': len(messages),
                'total_conversations': len(set(m.get('conversationId') for m in messages)),
                'avg_response_time': sum(m.get('responseTime', 0) for m in messages) / len(messages) if messages else 0,
                'last_activity': messages[0].get('timestamp') if messages else None,
                'joined_date': messages[-1].get('timestamp') if messages else None,
                'top_topics': self._extract_top_topics(messages)
            }

            return stats
        except Exception as e:
            logger.error(f"Error calculating statistics: {e}")
            raise

    def _extract_top_topics(self, messages: List[Dict], limit: int = 5) -> List[str]:
        """Extract most common topics from messages"""
        from collections import Counter

        # Simple keyword extraction
        keywords = []
        stop_words = {'what', 'when', 'where', 'how', 'is', 'the', 'a', 'an', 'and', 'or'}

        for msg in messages:
            question = msg.get('question', '').lower().split()
            keywords.extend([w for w in question if w not in stop_words and len(w) > 3])

        common = Counter(keywords).most_common(limit)
        return [word for word, count in common]
```

### 3.3 Create Personalization Service

Create `backend/functions/app/services/personalization_service.py`:

```python
from datetime import datetime
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class PersonalizationService:
    def __init__(self):
        pass

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile data"""
        # This should fetch from Firestore
        return {
            'id': user_id,
            'academicLevel': 'undergraduate',
            'modules': [],
            'interests': [],
            'previousQuestions': []
        }

    def build_personalization_context(self, user_profile: Dict, context: str = None) -> str:
        """Build context for LLM with user info"""

        context_str = f"User is an {user_profile.get('academicLevel', 'student')}"

        if user_profile.get('modules'):
            context_str += f" studying {', '.join(user_profile['modules'][:3])}"

        if context:
            context_str += f". {context}"

        return context_str

    def get_academic_reminders(self, user_id: str, topic: str) -> List[Dict[str, str]]:
        """Get relevant academic reminders based on topic"""

        reminders = []

        # Example reminder logic
        if any(word in topic.lower() for word in ['exam', 'test', 'assessment']):
            reminders.append({
                'type': 'exam',
                'message': 'Remember to check your exam schedule and start preparing early!'
            })

        if any(word in topic.lower() for word in ['assignment', 'submission', 'deadline']):
            reminders.append({
                'type': 'assignment',
                'message': 'Check the assignment portal for upcoming deadlines.'
            })

        if any(word in topic.lower() for word in ['attendance', 'class', 'lecture']):
            reminders.append({
                'type': 'attendance',
                'message': 'Remember, attendance is important for your academic success!'
            })

        return reminders

    def update_learning_preferences(self, user_id: str, preferences: Dict) -> bool:
        """Update user learning preferences"""
        try:
            # Save to Firestore
            logger.info(f"Updated learning preferences for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating preferences: {e}")
            raise
```

---

## Step 4: Update RAG Integration

### 4.1 Update `backend/functions/app/config.py`

Add these configuration variables:

```python
# Response Mode Configuration
RAG_SIMILARITY_THRESHOLD = 1.2  # L2 distance threshold

# Threshold tuning guide:
# - 0.8: Very strict, only high-quality matches
# - 1.2: Balanced (default), good mix of precision and recall
# - 1.5: More lenient, includes more candidates
# - 2.0: Very lenient, very inclusive results

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
    "brief": {
        "max_tokens": 300,
        "description": "Short, concise answers"
    },
    "balanced": {
        "max_tokens": 800,
        "description": "Comprehensive with key details"
    },
    "detailed": {
        "max_tokens": 1500,
        "description": "Thorough with all information"
    }
}
```

### 4.2 Update `backend/functions/app/rag.py`

Replace the `answer_question()` function with the implementation from `updated_rag_integration.py`. Key changes:

1. Add `response_mode` parameter
2. Add response mode validation
3. Implement three search strategies:
   - `_search_rag_only()` - Document mode
   - `_search_web_only()` - Web mode
   - `_search_hybrid()` - Hybrid mode with web fallback
4. Add `_check_rag_relevance()` function for threshold checking
5. Add personalization context handling

---

## Step 5: Backend API Routes

### 5.1 Register Routes in `backend/functions/index.js`

Add the new route handlers to your main Firebase function:

```python
# In FastAPI main.py or functions/index.py
from fastapi import FastAPI
from settings_routes import router as settings_router
from chat_routes import router as chat_router

app = FastAPI()

# Register routers
app.include_router(settings_router)
app.include_router(chat_router)
```

### 5.2 Files Already Created

✅ `backend/functions/settings_routes.py` - Settings CRUD endpoints
✅ `backend/functions/chat_routes.py` - Chat endpoint with response mode support
✅ `backend/functions/updated_rag_integration.py` - Response mode logic

---

## Step 6: API Endpoints Reference

### Settings Endpoints

```
GET  /api/settings/{userId}
     → Get all user settings

PUT  /api/settings/{userId}
     → Update all settings

POST /api/settings/{userId}/mode
     → Change response mode

GET  /api/settings/{userId}/notifications
     → Get notification preferences

PUT  /api/settings/{userId}/notifications
     → Update notification preferences

GET  /api/settings/{userId}/appearance
     → Get appearance preferences

PUT  /api/settings/{userId}/appearance
     → Update appearance preferences
```

### Chat Endpoints

```
POST /api/chat
     → Send a chat message
     Request: { question, responseMode, userId, userPreferences }
     Response: { answer, answer_source, sources, web_sources, reminders }

GET  /api/chat/conversation/{conversationId}
     → Retrieve specific conversation

GET  /api/chat/recent
     → Get recent conversations

GET  /api/chat/search?query=...
     → Search chat history
```

### Data Endpoints

```
GET  /api/settings/{userId}/chat-history/export
     → Export chat history as JSON

DELETE /api/settings/{userId}/chat-history
     → Delete all chat history

GET  /api/settings/{userId}/chat-history/stats
     → Get chat statistics
```

---

## Step 7: Testing the Integration

### 7.1 Test Response Modes

```bash
# Test Document Mode (RAG only)
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the plagiarism policy?",
    "responseMode": "document",
    "userId": "user123"
  }'

# Test Web Mode
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is Python?",
    "responseMode": "web",
    "userId": "user123"
  }'

# Test Hybrid Mode (Default)
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "When is the next exam?",
    "responseMode": "hybrid",
    "userId": "user123"
  }'
```

### 7.2 Test Settings Endpoints

```bash
# Get settings
curl -X GET http://localhost:5000/api/settings/user123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update response mode
curl -X POST http://localhost:5000/api/settings/user123/mode \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "web"}'

# Export chat history
curl -X GET http://localhost:5000/api/settings/user123/chat-history/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output chat-history.json
```

---

## Step 8: Deployment Considerations

### 8.1 Environment Variables

Ensure these are set in your deployment environment:

```
GOOGLE_CSE_API_KEY=your_api_key
GOOGLE_CSE_CX=your_search_engine_id
FIREBASE_PROJECT_ID=your_project_id
VITE_API_BASE_URL=your_backend_url
```

### 8.2 Firestore Collections

Create these collections in your Firestore database:

- `user_settings` - User settings documents
- `chat_history/{userId}/messages` - Chat messages
- `users` - User profiles
- `reminders` - Academic reminders

### 8.3 Security Rules

Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User settings - only accessible by own user
    match /user_settings/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Chat history - only accessible by own user
    match /chat_history/{userId}/messages/{messageId} {
      allow read, write: if request.auth.uid == userId;
    }

    // User profiles - read by own user
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && /* validate fields */;
    }
  }
}
```

---

## Step 9: Troubleshooting

| Issue                        | Solution                                          |
| ---------------------------- | ------------------------------------------------- |
| Settings not saving          | Check Firestore rules, verify user ID matches     |
| Response mode not changing   | Ensure RAG function accepts mode parameter        |
| Web search not working       | Verify Google API key and Custom Search Engine ID |
| Settings modal not appearing | Check SettingsProvider wrapping in main.jsx       |
| Theme not changing           | Verify dark mode classes in Tailwind config       |

---

## Summary Checklist

- [ ] Install dependencies in frontend and backend
- [ ] Create Firestore service with all required methods
- [ ] Create Chat History service with all required methods
- [ ] Create Personalization service with reminder logic
- [ ] Update RAG integration with response mode support
- [ ] Register settings and chat routes in main API
- [ ] Wrap App with SettingsProvider in main.jsx
- [ ] Update Chat.jsx with settings integration
- [ ] Configure environment variables
- [ ] Create Firestore security rules
- [ ] Test all response modes
- [ ] Test settings persistence
- [ ] Test export/delete functionality
- [ ] Deploy to production

---

## Next Steps

1. Implement the three service classes (Firestore, Chat History, Personalization)
2. Update RAG with response mode handling
3. Test locally before deployment
4. Monitor system for performance issues
5. Gather user feedback on settings usability

---

**Created**: 2024
**Version**: 1.0.0
**Status**: Ready for Implementation
