# Firebase Integration Guide - Using Team Member's Database

## Overview

Your chatbot now **reads from your team member's Firebase database** to identify good vs at-risk students and personalize responses automatically.

## Key Points

✅ **READ-ONLY**: Never modifies team member's database  
✅ **Automatic Classification**: Identifies student types from real data  
✅ **Personalization**: Adapts chatbot responses per student  
✅ **No Version Changes**: Python 3.10.6, NumPy 1.24.3, sklearn 1.6.1, TensorFlow 2.13.1 unchanged

---

## How It Works

### 1. Firebase Adapter (READ-ONLY)

**File**: `ml-service/app/services/firebase_student_adapter.py`

```python
# Fetches data from team member's Firebase database
firebase_adapter = get_firebase_adapter()
student_data = firebase_adapter.get_student_data("S1001")  # READ only

# Returns:
{
  "student_id": "S1001",
  "attendance_rate": 45,      # From Firebase
  "gpa": 2.1,                 # From Firebase
  "risk_probability": 0.75,   # From Firebase
  "risk_trend": "Increasing"
}
```

### 2. Automatic Student Classification

**From Firebase Data → Profile Status:**

| Firebase Data                            | Classification | Chatbot Behavior                    |
| ---------------------------------------- | -------------- | ----------------------------------- |
| Attendance ≥85%, GPA ≥3.5                | **EXCELLENT**  | Advanced topics, mentorship         |
| Attendance ≥75%, GPA ≥3.0                | **GOOD**       | Regular guidance                    |
| Attendance 50-75%, GPA 2.5-3.0           | **AVERAGE**    | Standard support                    |
| Attendance <50% OR GPA <2.0 OR Risk >60% | **AT_RISK**    | Urgent reminders, support resources |

### 3. Profile Syncing (Automatic)

**File**: `ml-service/app/services/student_profile_service.py`

```python
profile_manager = get_profile_manager()

# Automatically syncs from Firebase when you call get_profile()
profile = profile_manager.get_profile("S1001")

# Returns synced profile:
{
  "user_id": "S1001",
  "attendance_percent": 45,        # From Firebase
  "avg_exam_marks": 52.5,          # Calculated from GPA
  "status": "at_risk",             # Auto-classified
  "risk_factors": [
    "Low attendance (45%)",
    "Low GPA (2.10/4.0)",
    "High risk probability (75%)"
  ],
  "source": "firebase_sync"        # Indicates real data
}
```

---

## Using It with Team Member's Database

### Option 1: Automatic Sync (Recommended)

When Firebase backend is running, chatbot automatically uses real data:

```python
# In your chatbot endpoint:
from app.rag import answer_question

# Just pass the student_id - it auto-syncs from Firebase
response = answer_question("What is plagiarism?", user_id="S1001")

# Chatbot automatically:
# 1. Fetches S1001 data from Firebase
# 2. Classifies as excellent/good/average/at_risk
# 3. Adapts response based on classification
```

### Option 2: Manual Sync via API

```bash
# Sync specific student from Firebase
POST http://localhost:8000/student/profile/S1001/sync-from-firebase

# Response shows classification:
{
  "status": "success",
  "message": "Synced student S1001 from Firebase database (READ-ONLY)",
  "profile": {
    "user_id": "S1001",
    "attendance_percent": 45,
    "status": "at_risk",
    "risk_factors": ["Low attendance (45%)", "High risk probability (75%)"]
  },
  "source": "firebase_sync"
}
```

### Option 3: Check Profile Status

```bash
# Get student profile (auto-syncs from Firebase if available)
GET http://localhost:8000/student/profile/S1001

# Returns current profile with Firebase data
```

---

## Demo for Your Supervisor

### Step 1: Start Backend (Team Member's Database)

```bash
cd backend/functions
npm install  # First time only
npm run serve
```

This starts Firebase Functions at: `http://localhost:5001`

### Step 2: Run Firebase Integration Demo

```bash
cd ml-service
python demo_firebase_integration.py
```

**What This Shows:**

- ✅ Connects to team member's database (READ-ONLY)
- ✅ Fetches real student data
- ✅ Classifies students automatically
- ✅ Shows how chatbot adapts per student type

### Step 3: Show Personalization in Action

**Example 1: Good Student**

```bash
# Assuming S1001 has high attendance and GPA in Firebase
curl -X POST "http://localhost:8000/chat?user_id=S1001" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is plagiarism?"}'

# Response includes encouragement for advanced topics
```

**Example 2: At-Risk Student**

```bash
# Assuming S1020 has low attendance and GPA in Firebase
curl -X POST "http://localhost:8000/chat?user_id=S1020" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is plagiarism?"}'

# Response includes urgent reminders and support resources
```

---

## Evidence for Research

### 1. Database Integration Proof

**Files to Show:**

- `ml-service/app/services/firebase_student_adapter.py` - READ-ONLY adapter
- Shows `get_student_data()` method that fetches from Firebase
- No `set_`, `update_`, or `write_` methods (proves no modification)

### 2. Profile Classification Logic

**File**: `ml-service/app/services/student_profile_service.py`

- Line ~160: `sync_from_firebase()` method
- Converts Firebase data (attendance_rate, GPA) to profile format
- Auto-classifies as excellent/good/average/at_risk

### 3. Chatbot Adaptation Code

**File**: `ml-service/app/rag.py`

- Line ~683: `_build_personalized_system_instructions()` function
- Different prompts for `at_risk` vs `excellent` students
- At-risk students get URGENT REMINDERS section
- Excellent students get advanced topics section

### 4. Profile Files (Generated from Firebase)

**Location**: `ml-service/app/student_profiles/`

- Files created from Firebase data have `"source": "firebase_sync"`
- Contains `"firebase_data"` field with original database values
- Proves real data integration

---

## For Supervisor Presentation

### Talking Points:

**1. Database Integration (Without Modification)**

> "My teammate created a Firebase database with student attendance, GPA, and risk scores.
> I integrated the chatbot to READ this data without modifying it. This ensures we don't
> interfere with her work while using real student metrics."

**2. Automatic Classification**

> "The system automatically classifies students into 4 categories based on their Firebase data:
>
> - Excellent: ≥85% attendance + ≥3.5 GPA
> - Good: ≥75% attendance + ≥3.0 GPA
> - Average: Mid-range performance
> - At-Risk: <50% attendance OR <2.0 GPA OR >60% risk probability"

**3. Personalized Responses**

> "The chatbot adapts its responses per student

type. At-risk students receive urgent

> deadline warnings, attendance reminders, and support resources. Excellent students get
> encouragement for advanced topics and mentorship opportunities."

**4. Evidence**

> "I can demonstrate this by:
>
> 1. Showing two different student IDs from the Firebase database
> 2. Their profiles auto-sync with different classifications
> 3. The chatbot provides different guidance for each student type
> 4. All without modifying the original database"

---

## Technical Requirements (Unchanged)

✅ **Python**: 3.10.6 (no change)  
✅ **NumPy**: 1.24.3 (no change)  
✅ **scikit-learn**: 1.6.1 (no change)  
✅ **TensorFlow**: 2.13.1 (no change)

**New Dependencies** (automatically installed):

- `requests` - For HTTP calls to Firebase backend

---

## Testing Checklist

- [x] Firebase adapter reads from database (no writes)
- [x] Student profiles auto-sync from Firebase
- [x] Classification works (excellent/good/average/at_risk)
- [x] Risk factors auto-detected
- [x] Chatbot adapts responses per student type
- [x] No modifications to team member's database
- [x] All original dependencies unchanged

---

## Common Student IDs in Firebase

If your team member's database uses these patterns:

- `S1001`, `S1002`, `S1003`, ... (Common format)
- Try these in the demo or API calls

---

## Summary

**Your Chatbot is Now:**

1. ✅ **Personalized** - Adapts to student types
2. ✅ **Data-Driven** - Uses real Firebase database
3. ✅ **Non-Invasive** - READ-ONLY, never modifies source data
4. ✅ **Evidence-Based** - Classifies by attendance, GPA, risk factors
5. ✅ **Supervisor-Ready** - Clear demonstration of personalization

**This proves your research objective: A personalized chatbot that identifies and supports different student types using real academic data.**
