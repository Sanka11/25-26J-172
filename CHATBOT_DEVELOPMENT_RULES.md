# AcademiGuard Chatbot - Core Development Rules & Architecture

## 📐 **Core Architectural Principles**

### **1. User-Centric Design**

- **Rule**: Every feature must improve student experience
- **Implementation**:
  - ✅ Word-by-word typewriter animation for readability
  - ✅ Clear error messages with context
  - ✅ Visual feedback (loading states, success indicators)
  - ✅ Multiple input methods (text, voice, image OCR, PDF)

### **2. Role-Based Access Control (RBAC)**

- **Rule**: Different permissions for students vs admins
- **Implementation**:
  - ✅ Students: Ask questions, view PDFs, upload images
  - ✅ Admins only: Upload/manage PDFs, manage announcements
  - ✅ Super admins: Full system access
- **Validation**: `canUploadPdf = (role === ADMIN || role === SUPER_ADMIN)`

### **3. Data Persistence & Recovery**

- **Rule**: Never lose user data (chat history, preferences)
- **Implementation**:
  - ✅ Firebase Firestore for chat history (auto-save after each message)
  - ✅ localStorage for theme & response mode preferences
  - ✅ Graceful fallbacks if storage unavailable
  - ✅ Individual message flag: `savedToFirebase` to prevent duplicates

### **4. Performance & Responsiveness**

- **Rule**: UI must feel fast even with slow network
- **Implementation**:
  - ✅ Optimistic updates (add message immediately, wait for API)
  - ✅ Typewriter animation (25ms per word - snappy feel)
  - ✅ Auto-scroll to latest message
  - ✅ Lazy loading of chat history (only load once)
  - ✅ Request deduplication

### **5. Multi-Modal Input Processing**

- **Rule**: Accept diverse input types, normalize to question
- **Implementation**:
  - ✅ Text input: Direct question
  - ✅ Voice input: Speech-to-text via Web Speech API
  - ✅ Image input: OCR via Tesseract.js
  - ✅ PDF input: Text extraction (for demo/preview)
  - ✅ Automation commands: Natural language routing to dashboards

### **6. Intelligent Fallback Strategy**

- **Rule**: If one retrieval method fails, try alternatives
- **Implementation**:
  - ✅ PDF RAG first (if PDFs uploaded)
  - ✅ Web search fallback (if PDF search fails)
  - ✅ Cached results optimization
  - ✅ Clear source attribution (tell user what we searched)

### **7. Context Awareness**

- **Rule**: Always know who is asking and what they need
- **Implementation**:
  - ✅ Authenticate against Firebase Auth
  - ✅ Fetch student metrics from Firestore (performance, risk)
  - ✅ Generate personalized intervention reminders
  - ✅ Track active PDF context (`activeRagPdf`)
  - ✅ Build personalized system instructions based on role

### **8. Error Handling & Recovery**

- **Rule**: Fail gracefully, not catastrophically
- **Implementation**:
  - ✅ Try-catch wrapping all async operations
  - ✅ HTTP status validation (2xx vs error codes)
  - ✅ User-friendly error messages (not technical jargon)
  - ✅ Automatic error state clearing on retry
  - ✅ Fallback responses when API unavailable

---

## 🔐 **Security & Validation Rules**

### **Input Validation Layer**

```
User Input → Trim → Length Check → Injection Detection → Sanitize
```

- ✅ Empty/whitespace check
- ✅ Length limits (1-2000 chars for questions)
- ✅ Type checking (string, file object)
- ✅ Prompt injection detection (SQL, XSS, jailbreak attempts)

### **Authentication Rules**

- ✅ Must be logged in (Firebase Auth check)
- ✅ Must have valid userData object
- ✅ Admin operations require explicit role check
- ✅ Student ID resolution with multiple fallback candidates

### **File Upload Validation**

- ✅ PDF files only (`.pdf` extension verified)
- ✅ Size limits: 10KB min, 20MB max
- ✅ Filename safe (no path traversal like `../`)
- ✅ Admin-only restriction enforced client + server side

### **API Integration Rules**

- ✅ Always check HTTP status (throw on 4xx, 5xx)
- ✅ Validate response structure (required fields exist)
- ✅ Handle network timeouts (default to error message)
- ✅ Log important events for debugging

---

## 💡 **State Management Patterns**

### **Critical State Variables**

```javascript
[question][messages][loading][error][activeRagPdf][typingState][theme][ // user input (cleared after send) // conversation history (synced to Firebase) // API in progress // user-displayable error messages // currently selected PDF context // typewriter animation state // user preference (persisted to localStorage)
  responseMode
]; // hybrid/pdf-only/web-only (persisted)
```

### **State Update Patterns**

- ✅ Immutable updates using spread operator
- ✅ Array updates via `.map()` instead of direct mutation
- ✅ Functional setState for dependent calculations
- ✅ useRef for non-rendering state (history loaded flags)

---

## 🔄 **API Integration Rules**

### **Chat Request**

```
User Message → Trim & Validate → FormData Append
→ POST /chat → Parse JSON → Add Message to History → Display
```

**Required Fields**:

- `question` (string): trimmed user question
- `response_mode` (string): "hybrid", "pdf_only", "web_only"
- Optional: `active_pdf` (for RAG context)

### **Document Management**

```
Fetch on Mount → Parse Array → Validate Each Doc
→ Display in Sidebar/Modal → Handle Errors
```

**Expected Response**:

```json
[
  {
    "doc_id": "unique_identifier",
    "pdf_name": "filename.pdf",
    "upload_timestamp": "ISO string"
  }
]
```

### **PDF Upload**

```
File Selected → Validate (type, size) → FormData
→ POST /upload_pdf → Refresh Docs → Show Success → Clear Input
```

---

## 📊 **Performance Optimization Rules**

### **Rendering Optimization**

- ✅ `useCallback` for event handlers (prevent unnecessary re-renders)
- ✅ `useRef` for non-state references (scroll container, input field)
- ✅ Conditional rendering only when needed
- ✅ Memoization for computed values

### **Network Optimization**

- ✅ Request deduplication (don't fetch documents twice)
- ✅ History loaded flag to prevent re-fetching
- ✅ Cache results in browser (theme, response mode)
- ✅ Batch updates where possible

### **Animation Performance**

- ✅ 25ms interval for typewriter (feels responsive, not CPU heavy)
- ✅ Smooth scroll with `behavior: "smooth"`
- ✅ CSS animations preferred over JS animations
- ✅ Clear timeouts on component unmount

---

## 🎯 **Business Logic Rules**

### **Intervention/Reminder Generation**

```
Student Metrics → Performance Check
→ Threshold Comparison (50%) → Classification
→ Personalized Intervention Text
```

**Performance Tiers**:

- **HIGH**: All metrics above 50% → Encouragement message
- **MEDIUM**: 1-2 metrics below 50% → Specific suggestions
- **LOW**: 3+ metrics below 50% → Intense support + specific actions

### **Navigation Automation**

```
User Question → Pattern Matching (regex)
→ Navigation Intent Check → Exact Route Lookup
→ Auto-navigate (no extra click)
```

**Example**: "show me the workload dashboard" → `/WorkloadDashboard`

### **Student ID Resolution** (Fallback Chain)

```
1. userData.student_id
2. userData.studentId
3. userData.email
4. currentUser.uid
5. Firestore field lookups (case-insensitive)
```

This ensures even if one field is missing, we can still identify the student.

---

## 📋 **Testing & Validation Checklist**

### **Before Each Feature Release**

- [ ] Input validation works (empty, too long, special chars)
- [ ] Auth checks pass (logged in, role verified)
- [ ] File uploads tested (correct size, type, permissions)
- [ ] Error messages clear and helpful
- [ ] Firebase sync working (messages persist)
- [ ] localStorage fallback works if Firebase unavailable
- [ ] TypeScript/ESLint passing with no warnings
- [ ] Performance metrics: <2s load, <100ms response animation

### **Security Checklist**

- [ ] No hardcoded secrets in code
- [ ] API URLs use HTTPS (except localhost dev)
- [ ] RBAC enforced on sensitive operations
- [ ] Input sanitization prevents injection attacks
- [ ] Error messages don't leak sensitive info
- [ ] CORS headers configured correctly

---

## 🚀 **Configuration Rules**

### **Environment Variables Required**

```bash
VITE_ML_BASE_URL=http://127.0.0.1:8002
VITE_ML_CHAT_URL=http://127.0.0.1:8002/chat
VITE_ML_UPLOAD_URL=http://127.0.0.1:8002/upload_pdf
VITE_FIREBASE_API_KEY=...
# (Firebase config)
```

### **Feature Flags (localStorage Keys)**

- `chat_theme`: "light" | "dark" | "system"
- `chat_response_mode`: "hybrid" | "pdf_only" | "web_only"
- `dismissed_reminder_ids`: JSON array of IDs

---

## 💬 **Copy & Messaging Rules**

### **Error Messages**

- ❌ Don't say: "Error 500 in chat service"
- ✅ Do say: "Failed to get answer. Make sure ML service is running."

### **User Feedback**

- ✅ Always confirm actions: "✅ PDF uploaded successfully!"
- ✅ Show progress: "Loading...", "Processing...", "Saving..."
- ✅ Be encouraging: "Hi! I'm AcademiGuard, How can I help you today?"

### **Empty States**

- ✅ Not: "No data"
- ✅ Better: "No PDFs uploaded yet. Click 'Add' to get started."

---

## 📝 **Recommended Additions (Future Enhancements)**

1. **Rate Limiting** - Max 30 messages/min per user
2. **Conversation Threading** - Organize by topic
3. **Feedback Loop** - Save which answers were helpful
4. **Export Chat** - Download conversation as PDF
5. **Follow-up Suggestions** - Auto-suggest related questions
6. **Accessibility** - ARIA labels, keyboard navigation
7. **Analytics** - Track question types, success metrics
8. **Streaming Responses** - Real-time answer chunks instead of full response

---

## 🔗 **Integration Points**

### **Backend Dependencies**

- ✅ ML Service (`/chat` endpoint) for chat responses
- ✅ ML Service (`/upload_pdf`) for document management
- ✅ Firebase Auth for user authentication
- ✅ Firestore for message persistence
- ✅ Google Custom Search API (fallback web search)

### **Frontend Dependencies**

- ✅ React 18 (hooks, latest features)
- ✅ React Router (navigation)
- ✅ Firebase SDK (auth, firestore)
- ✅ Tesseract.js (OCR)
- ✅ PDF.js (PDF preview)
- ✅ Web Speech API (voice input)

---

## 📚 **Documentation References**

- API Docs: `/ml-service/FIREBASE_INTEGRATION_GUIDE.md`
- Personalization: `/ml-service/PERSONALIZATION_GUIDE.md`
- RAG Overview: `/ml-service/app/rag.py`
- Component Architecture: See this file for Chat.jsx structure
