# Backend Integration Troubleshooting Guide

Quick reference for common issues and solutions.

## Common Issues & Solutions

### 1. Authentication Errors (403 Forbidden)

**Problem**: Getting 403 when calling API endpoints

```
{
  "error": "Cannot access other user's settings"
}
```

**Causes & Solutions**:

a) **Invalid or expired token**

- Generate new token from Firebase Console
- Ensure token hasn't expired (usually 1 hour)
- Check browser: `firebase.auth().currentUser.getIdToken()`

b) **User ID mismatch**

- Ensure request URL contains your actual user ID
- Check that authenticated user ID matches URL parameter
- In headers, send: `Authorization: Bearer {YOUR_TOKEN}`

c) **Auth middleware not working**

- Verify `withAuthMiddleware` is applied: `app.use(withAuthMiddleware)`
- Check Firebase Admin SDK initialization: `admin.initializeApp()`
- Ensure Firebase credentials are valid

**Quick Test**:

```bash
# Get current user's ID
firebase auth:list  # Shows all users

# Generate test token
firebase login
firebase functions:shell
> auth.createCustomToken('user-id-here')
```

---

### 2. Firestore Errors (500 Internal Server Error)

**Problem**: Getting 500 on Firestore operations

```
{
  "error": "Error updating settings"
}
```

**Causes & Solutions**:

a) **Security rules denying access**

- Check Firestore rules in Firebase Console
- Verify rules match the format below:

```firestore
match /user_settings/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

b) **Collection doesn't exist**

- Go to Firebase Console > Firestore
- Create collection: `user_settings` with document ID = user ID
- Verify nested collections path: `chat_history/{userId}/messages`

c) **Firebase Admin SDK not initialized**

- Check main file has: `admin.initializeApp()`
- Verify credentials file is set
- Check logs: `firebase functions:log`

**Quick Test**:

```javascript
// In Node.js console or test file
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const doc = await db.collection("user_settings").doc("test-user").get();
console.log(doc.data());
```

---

### 3. Missing Services Error

**Problem**: Getting error about services not defined

```
TypeError: Cannot read property 'getUserSettings' of undefined
```

**Solution**:

a) **Services not imported**

- Check imports in main API file:

```javascript
const {
  FirestoreService,
  ChatHistoryService,
  PersonalizationService,
} = require("./services");
```

b) **Services not instantiated**

- Add initialization:

```javascript
const firestoreService = new FirestoreService();
const chatHistoryService = new ChatHistoryService();
const personalizationService = new PersonalizationService();
```

c) **Wrong file path**

- Verify file structure:
  - `services/firestoreService.js` ✓
  - `services/chatHistoryService.js` ✓
  - `services/personalizationService.js` ✓
  - `services/index.js` ✓

---

### 4. CORS Errors (Browser)

**Problem**: Browser shows CORS error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:

a) **CORS middleware not enabled**

- Add to main file:

```javascript
const cors = require("cors");
app.use(cors());
```

b) **Wrong API base URL** (frontend)

- Update `.env` file:

```env
VITE_API_BASE=http://localhost:3000  # For local dev
VITE_API_BASE=https://<firebase-function-url>  # For production
```

c) **Preflight request failing**

- Ensure middleware is applied before routes:

```javascript
app.use(cors()); // CORS first
app.use(express.json()); // Parsing second
app.use(routes); // Routes last
```

---

### 5. Dependencies Not Found

**Problem**: Module not found error

```
Error: Cannot find module 'express'
```

**Solution**:

a) **Dependencies not installed**

- Run: `npm install` in `backend/functions/`
- Check `package.json` has required packages

b) **Wrong directory**

- Ensure you're in `backend/functions/` directory
- NOT in `backend/` or root directory

c) **Node modules corrupted**

- Delete and reinstall:

```bash
cd backend/functions/
rm -rf node_modules
npm install
```

---

### 6. Port Already in Use

**Problem**: Getting "Port 3000 already in use"

```
Error: listen EADDRINUSE :::3000
```

**Solution**:

a) **Kill existing process**

```bash
# Windows
netstat -anno | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

b) **Use different port**

```javascript
const PORT = process.env.PORT || 5001; // Changed from 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### 7. Message Not Saving to Firestore

**Problem**: Messages sent but not appearing in history

```javascript
// This works but chat_history is empty
await chatHistoryService.saveMessage(userId, message);
```

**Causes & Solutions**:

a) **Collection structure wrong**

- Correct: `chat_history/{userId}/messages/{messageId}`
- Wrong: `chat_history/messages` (flat)

b) **User subcollection missing**

- Manually create subcollection "messages" under user document in Firestore

c) **Security rules blocking writes**

- Verify rule allows writes:

```firestore
match /chat_history/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
```

**Debugging**:

```javascript
// Add logging to see what's happening
const message = { content: "test", timestamp: new Date().toISOString() };
console.log("Saving message:", message);
await chatHistoryService.saveMessage(userId, message);
console.log("Message saved");

// Verify in Firestore Console
```

---

### 8. Settings Not Persisting

**Problem**: Settings update shows success but revert on refresh

```javascript
// Settings update returns 200 OK
// But gets default values on next GET
```

**Solution**:

a) **Document not created**

- Go to Firestore Console > Create initial document
- Or handle missing document in service:

```javascript
if (!settings) {
  await firestoreService.createUserSettings(userId, defaults);
}
```

b) **lastUpdated field causing issues**

- Ensure timestamp format is correct:

```javascript
lastUpdated: new Date().toISOString(); // ✓ Correct
lastUpdated: Date.now(); // ✗ Wrong (number)
```

---

### 9. Token Expires Too Quickly

**Problem**: Getting "Token has expired" after a few minutes

```
{
  "error": "Token has expired. Please sign in again."
}
```

**Solution**:

a) **Firebase tokens expire after 1 hour**

- Frontend must refresh token periodically:

```javascript
const token = await firebase.auth().currentUser.getIdToken(true); // Force refresh
```

b) **Implement token refresh in axios interceptor**:

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const token = await getAuthToken(); // Get fresh token
      error.config.headers.Authorization = `Bearer ${token}`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  },
);
```

---

### 10. Settings Not Loading on App Start

**Problem**: SettingsContext shows null/undefined

```javascript
const { settings } = useSettings();
console.log(settings); // null
```

**Solution**:

a) **SettingsProvider not wrapping app**

- Check `main.jsx`:

```javascript
ReactDOM.createRoot(document.getElementById("root")).render(
  <SettingsProvider>
    <App />
  </SettingsProvider>,
);
```

b) **Settings loading asynchronously**

- Add loading state:

```javascript
if (!settings) return <div>Loading...</div>;
```

c) **useSettings hook not from context**

- Verify import: `import { useSettings } from './context/SettingsContext'`

---

## Debugging Checklist

When something doesn't work, go through this in order:

1. **Check browser console** - Look for JavaScript errors
2. **Check Firebase logs** - `firebase functions:log`
3. **Check network tab** - Verify API request/response
4. **Check Firestore** - Verify data exists and rules allow access
5. **Check auth token** - Verify token is valid and not expired
6. **Check services** - Add console logs to trace execution
7. **Check middleware** - Verify auth middleware is running
8. **Check routes** - Verify routes are registered

---

## Useful Commands

```bash
# View Firebase Functions logs
firebase functions:log --lines 50

# List all deployed functions
firebase functions:list

# Test locally with emulator
firebase emulators:start --only functions

# Clear Firestore (careful!)
firebase firestore:delete --recursive-delete --all-collections

# Get export from Firestore
firebase firestore:export backup-folder/

# Test auth token generation
firebase login
firebase functions:shell
> auth.createCustomToken('user-123')
```

---

## Performance Tips

1. **Index frequent queries** - Firestore will warn you
2. **Use batch operations** - For deleting many messages
3. **Cache settings** - Store in React Context + localStorage
4. **Pagination** - Load 50 messages, not all history
5. **Rate limiting** - Implement in routes to prevent abuse

---

## Security Reminders

1. ✅ Always verify `request.auth.uid` matches resource owner
2. ✅ Use strong Firestore security rules (never use `allow read, write: if true`)
3. ✅ Store sensitive data server-side only
4. ✅ Validate all user inputs
5. ✅ Use HTTPS in production
6. ✅ Monitor for suspicious activity in logs

---

## Need More Help?

Check these documentations:

- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
