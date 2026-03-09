# Chat Component - Validation Implementation Guide

## 🎯 **Quick Start: Adding Validations to Chat.jsx**

### **Step 1: Import Validations**

```javascript
import {
  validateQuestion,
  validatePdfFile,
  validateUserAuth,
  validateAdminAccess,
  validateChatResponse,
  validateDocumentsResponse,
  sanitizeInput,
  checkRateLimit,
  VALIDATION_RULES,
} from "../utils/chatValidations";
```

### **Step 2: Add Rate Limiting State**

```javascript
const [messageTimestamps, setMessageTimestamps] = useState([]);

const messageRateLimit = VALIDATION_RULES.rateLimit.messages;
```

---

## 📋 **Implementation Examples**

### **Example 1: Enhanced Question Validation**

**Current Code:**

```javascript
const handleAsk = async (e) => {
  e.preventDefault();
  setError("");
  const trimmed = question.trim();
  if (!trimmed) {
    setError("Please enter a question.");
    return;
  }
  // ... rest of code
};
```

**Improved Code with Validation:**

```javascript
const handleAsk = async (e) => {
  e.preventDefault();
  setError("");

  // Validate question using new validation module
  const validation = validateQuestion(question);
  if (!validation.valid) {
    setError(validation.error);
    return;
  }

  // Check rate limiting
  const now = Date.now();
  const rateCheckResult = checkRateLimit(
    messageTimestamps,
    messageRateLimit.max,
    messageRateLimit.window,
  );

  if (!rateCheckResult.allowed) {
    setError(rateCheckResult.reason);
    return;
  }

  // Sanitize input (remove injection attempts)
  const sanitized = sanitizeInput(validation.sanitized);

  // Add timestamp for rate limiting
  setMessageTimestamps((prev) => [...prev, now]);

  // ... rest of sending logic using sanitized input
};
```

---

### **Example 2: PDF Upload Validation**

**Current Code:**

```javascript
const uploadPdfDocument = async (file) => {
  if (!file) return;
  if (!canUploadPdf) {
    setError("PDF upload is available only for admins.");
    return;
  }
  // ... upload logic
};
```

**Improved Code with Comprehensive Validation:**

```javascript
const uploadPdfDocument = async (file) => {
  setError("");

  // Validate user authentication
  const authCheck = validateUserAuth(currentUser, userData);
  if (!authCheck.valid) {
    setError(authCheck.error);
    return;
  }

  // Validate admin access
  const adminCheck = validateAdminAccess(userData.role);
  if (!adminCheck.valid) {
    setError(adminCheck.error);
    return;
  }

  // Validate file itself
  const fileValidation = validatePdfFile(file);
  if (!fileValidation.valid) {
    setError(fileValidation.error);
    return;
  }

  setPdfProcessing(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(appConfig.ML_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Upload failed (${res.status}): ${text || "Unknown error"}`,
      );
    }

    const result = await res.json();
    console.log("[PDF UPLOAD] Success:", result);
    setError("");
    setShowPdfUploadModal(false);

    await fetchDocuments();

    setMessages((prev) => [
      ...prev,
      {
        id: `pdf-upload-${Date.now()}`,
        sender: "assistant",
        text: `✅ PDF "${file.name}" uploaded successfully!`,
        createdAt: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error("[PDF UPLOAD] Error:", err);
    setError(err.message || "Failed to upload PDF");
  } finally {
    setPdfProcessing(false);
  }
};
```

---

### **Example 3: API Response Validation**

**Current Code:**

```javascript
const res = await fetch(appConfig.ML_CHAT_URL, {
  method: "POST",
  body: formData,
});

if (!res.ok) {
  throw new Error(`Chat request failed with status ${res.status}`);
}

const data = await res.json();
const answerText = data.answer || "Download PDF";
```

**Improved Code with Validation:**

```javascript
const res = await fetch(appConfig.ML_CHAT_URL, {
  method: "POST",
  body: formData,
  timeout: 30000, // 30 second timeout
});

// Validate response status
const responseValidation = validateChatResponse(
  res.status === 200 ? true : false,
  res.status,
);

if (!responseValidation.valid) {
  throw new Error(responseValidation.error);
}

const data = await res.json();

// Re-validate the actual response data structure
const dataValidation = validateChatResponse(data, res.status);
if (!dataValidation.valid) {
  throw new Error(dataValidation.error);
}

// Safe to use data.answer now
const answerText = data.answer;
```

---

### **Example 4: Document Fetch Validation**

**Current Code:**

```javascript
const fetchDocuments = async () => {
  setDocsLoading(true);
  try {
    const res = await fetch(appConfig.ML_LIST_PDFS_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch documents: ${res.status}`);
    }
    const docs = await res.json();
    setDocuments(docs);
  } catch (err) {
    console.error("[DOCS] Failed to fetch documents:", err);
  } finally {
    setDocsLoading(false);
  }
};
```

**Improved Code with Validation:**

```javascript
const fetchDocuments = async () => {
  setDocsLoading(true);
  setError(""); // Clear previous errors

  try {
    const res = await fetch(appConfig.ML_LIST_PDFS_URL);

    if (!res.ok) {
      throw new Error(`Failed to fetch documents: ${res.status}`);
    }

    const docs = await res.json();

    // Validate document structure
    const docsValidation = validateDocumentsResponse(docs);
    if (!docsValidation.valid) {
      console.error("[DOCS] Validation error:", docsValidation.error);
      setError("Documents format is invalid. Contact admin.");
      return;
    }

    // All valid, update state
    setDocuments(docs);
    console.log(`[DOCS] Fetched and validated ${docs.length} documents`);
  } catch (err) {
    console.error("[DOCS] Failed to fetch documents:", err);
    setError("Could not load documents. Please try again.");
  } finally {
    setDocsLoading(false);
  }
};
```

---

### **Example 5: Message Validation Before Storage**

**New Helper Function:**

```javascript
const addMessageToHistory = (message) => {
  // Validate message structure
  const messageValidation = validateChatMessage(message);
  if (!messageValidation.valid) {
    console.error("[MESSAGE] Invalid message:", messageValidation.error);
    return false;
  }

  // Add to local state
  setMessages((prev) => [...prev, message]);

  // Save to Firebase
  if (historyLoaded) {
    message.savedToFirebase = true;
    chatHistoryService.saveMessage(message).catch((err) => {
      console.error("[HISTORY] Failed to save message:", err);
      message.savedToFirebase = false;
    });
  }

  return true;
};
```

**Usage in handleAsk:**

```javascript
const userMessage = {
  id: `user-${Date.now()}`,
  sender: "user",
  text: sanitized,
  createdAt: new Date().toISOString(),
};

const added = addMessageToHistory(userMessage);
if (!added) {
  setError("Failed to add message to history");
  return;
}
```

---

## 🔍 **Validation Coverage Matrix**

| Operation           | Current Checks             | Recommended Additions               |
| ------------------- | -------------------------- | ----------------------------------- |
| **Question Input**  | ✅ Empty check             | ✅ Length, injection, sanitization  |
| **PDF Upload**      | ✅ File exists, admin role | ✅ File size, type, name validation |
| **API Response**    | ✅ Status code             | ✅ Data structure, field presence   |
| **Documents List**  | ❌ None                    | ✅ Array check, doc structure       |
| **Message Storage** | ❌ None                    | ✅ Message shape, timestamp         |
| **Authentication**  | ✅ Role check              | ✅ Complete auth state, fallbacks   |
| **Rate Limiting**   | ❌ None                    | ✅ Messages/minute tracking         |
| **Error Display**   | ✅ Basic                   | ✅ Contextual, actionable messages  |

---

## 🛡️ **Security Best Practices**

### **1. Input Sanitization**

```javascript
// ALWAYS sanitize user input
const sanitized = sanitizeInput(userQuestion);
// NOT: const sanitized = userQuestion.trim(); ❌
```

### **2. Type Checking**

```javascript
// Check types before operations
if (typeof message.text !== "string") {
  return; // Fail safely
}
```

### **3. Array Validation**

```javascript
// Validate array structure, not just existence
if (!Array.isArray(docs) || docs.length === 0) {
  return []; // Safe default
}
```

### **4. Error Message Sanitization**

```javascript
// Never expose internal errors to user
catch (err) {
  // ❌ setError(err.message); // Could expose sensitive info
  // ✅ setError("Unable to process. Please try again.");
}
```

---

## ⚡ **Performance Considerations**

### **Avoid Over-Validation**

```javascript
// ❌ Don't validate every keystroke
onChange={(e) => {
  validateQuestion(e.target.value); // Too frequent!
  setQuestion(e.target.value);
}}

// ✅ Validate only on submit
onSubmit={() => {
  const validation = validateQuestion(question);
  if (!validation.valid) return;
}}
```

### **Memoize Validation Logic**

```javascript
const validateQuestionMemo = useCallback(
  (input) => validateQuestion(input),
  [],
);
```

---

## 📊 **Testing Validation Rules**

### **Test Cases to Add**

```javascript
// Test 1: Empty question
test("validates empty question", () => {
  const result = validateQuestion("");
  expect(result.valid).toBe(false);
  expect(result.error).toContain("empty");
});

// Test 2: Valid question
test("validates normal question", () => {
  const result = validateQuestion("What is plagiarism?");
  expect(result.valid).toBe(true);
  expect(result.sanitized).toBe("What is plagiarism?");
});

// Test 3: Question too long
test("rejects question over 2000 chars", () => {
  const longQ = "a".repeat(2001);
  const result = validateQuestion(longQ);
  expect(result.valid).toBe(false);
  expect(result.error).toContain("too long");
});

// Test 4: Injection attempt
test("detects SQL injection", () => {
  const result = validateQuestion("'; DROP TABLE users; --");
  expect(result.valid).toBe(false);
});

// Test 5: PDF size validation
test("rejects PDF over 20MB", () => {
  const largeFile = new File(["x".repeat(21 * 1024 * 1024)], "large.pdf");
  const result = validatePdfFile(largeFile);
  expect(result.valid).toBe(false);
  expect(result.error).toContain("too large");
});
```

---

## 🚀 **Rollout Checklist**

- [ ] Import validation module in Chat.jsx
- [ ] Add rate limiting state
- [ ] Update handleAsk with full validation
- [ ] Update uploadPdfDocument with validation
- [ ] Update API response handling
- [ ] Update document fetching
- [ ] Add message validation before storage
- [ ] Update error handling for better UX
- [ ] Add unit tests for validation rules
- [ ] Test all error paths manually
- [ ] Update error message copy
- [ ] Deploy and monitor error rates
