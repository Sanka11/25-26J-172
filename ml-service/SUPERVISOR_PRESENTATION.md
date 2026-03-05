# SUPERVISOR PRESENTATION - Personalized Chatbot Evidence

## Research Question

**"Can the chatbot be personalized to identify and support different types of students (good academic performance vs at-risk students)?"**

### Answer: **YES ✓**

---

## Evidence 1: Two Distinct Student Types Identified

### From Team Member's Firebase Database (READ-ONLY):

**Student Type 1: Good Academic Performance**

- Attendance: ≥75-85%
- GPA: ≥3.0/4.0
- Risk Probability: <40%
- Classification: **EXCELLENT** or **GOOD**

**Student Type 2: At-Risk Performance**

- Attendance: <50%
- GPA: <2.0/4.0
- Risk Probability: >60%
- Missed exams/assignments
- Classification: **AT_RISK**

---

## Evidence 2: Database Integration (Without Modification)

### Technical Implementation:

**File**: `ml-service/app/services/firebase_student_adapter.py`

```python
class FirebaseStudentAdapter:
    """READ-ONLY adapter - never modifies team member's database"""

    def get_student_data(self, student_id: str):
        """Fetch student data from Firebase (READ-ONLY)"""
        response = requests.get(f"{backend_url}/students/{student_id}/risk-history")
        # Returns: attendance_rate, gpa, risk_probability
        # NO write operations - only reads
```

**Proof of READ-ONLY:**

- No `set_`, `update_`, `write_`, or `delete_` methods
- Only `get_` methods present
- Uses HTTP GET requests (not POST/PUT/DELETE)

---

## Evidence 3: Automatic Student Classification

### Classification Algorithm:

```python
def classify_student_status(student_data):
    attendance = student_data["attendance_rate"]
    gpa = student_data["gpa"]
    risk = student_data["risk_probability"]

    if risk > 0.6 or attendance < 50 or gpa < 2.0:
        return "AT_RISK"     # Needs urgent support
    elif attendance >= 85 and gpa >= 3.5:
        return "EXCELLENT"   # High achiever
    elif attendance >= 75 and gpa >= 3.0:
        return "GOOD"        # Above average
    else:
        return "AVERAGE"     # Typical student
```

### Example Classifications:

| Student ID | Attendance | GPA | Risk % | Status        | Risk Factors                       |
| ---------- | ---------- | --- | ------ | ------------- | ---------------------------------- |
| S1001      | 92%        | 3.8 | 15%    | **EXCELLENT** | None                               |
| S1020      | 45%        | 2.1 | 75%    | **AT_RISK**   | Low attendance, Low GPA, High risk |

---

## Evidence 4: Personalized Chatbot Responses

### How Responses Differ:

**File**: `ml-service/app/rag.py` (Line 683)

#### For EXCELLENT Students:

```
**PERSONALIZED GUIDANCE FOR YOU**:
You're performing excellently! I can help with:
- Advanced academic integrity topics (proper research ethics)
- Module details and prerequisites for further study
- Lecturer consultations for complex topics
- Consider mentoring other students

Keep maintaining your excellent attendance and academic standards!
```

#### For AT_RISK Students:

```
**PERSONALIZED SUPPORT FOR YOU**:
I notice you may need extra support. Here's what I can help with:
- Deadlines: I'll highlight all important dates to help you stay on track
- Academic integrity: Proper citation and avoiding plagiarism are key to success
- Contact your LIC: Your Lecturer in Charge can provide additional support
- Ask early: Don't wait until deadlines to reach out for help

URGENT REMINDERS:
- Attend classes regularly - it makes a real difference
- Reach out to your LIC if you're struggling
- Check submission dates in advance to plan your work
```

### Code Proof:

```python
def _build_personalized_system_instructions(user_id: str) -> str:
    profile = profile_manager.get_profile(user_id)
    status = profile["status"]

    if status == "at_risk":
        return base_instructions + urgent_support_section
    elif status == "excellent":
        return base_instructions + advanced_guidance_section
```

---

## Evidence 5: Live Demo

### Demo Script Results:

```
STUDENT 1 - Excellent Academic Performance
----------------------------------------------------------------------
  User ID: excellent_student
  Attendance: 92.0%
  Exam Marks: [85.0, 90.0, 88.0, 92.0]
  Average Mark: 88.8
  Status: EXCELLENT
  Risk Factors: None

STUDENT 2 - At-Risk Academic Performance
----------------------------------------------------------------------
  User ID: at_risk_student
  Attendance: 45.0%
  Exam Marks: [35.0, 42.0, 38.0]
  Average Mark: 38.3
  Exams Missed: 2
  Status: AT_RISK
  Risk Factors: Low attendance, Low exam performance, Missed 2 exam(s)
```

**Run Command**: `python demo_supervisor.py`

---

## Evidence 6: File System Proof

### Profile Files Created:

```
ml-service/app/student_profiles/
├── excellent_student_profile.json
│   ├── "status": "excellent"
│   ├── "attendance_percent": 92.0
│   ├── "avg_exam_marks": 88.75
│   └── "risk_factors": []
│
└── at_risk_student_profile.json
    ├── "status": "at_risk"
    ├── "attendance_percent": 45.0
    ├── "avg_exam_marks": 38.33
    └── "risk_factors": [
          "Low attendance",
          "Low exam performance",
          "Missed 2 exam(s)"
        ]
```

### Firebase-Synced Profiles Include:

```json
{
  "source": "firebase_sync",
  "firebase_data": {
    "student_id": "S1001",
    "attendance_rate": 45,
    "gpa": 2.1,
    "risk_probability": 0.75
  }
}
```

---

## Evidence 7: API Endpoints

### REST API for Testing:

```bash
# 1. Sync student from Firebase (READ-ONLY)
POST /student/profile/S1001/sync-from-firebase

# 2. Get student profile (auto-syncs if Firebase available)
GET /student/profile/S1001

# 3. Compare chatbot responses for two students
POST /analysis/personalization-demo
Body: {"question": "What is plagiarism?", "student1_id": "S1001", "student2_id": "S1020"}

# 4. Generate research report
POST /analysis/generate-research-report
```

---

## Evidence 8: Chat History Separation

Each student has independent conversation tracking:

```
ml-service/chat_history/
├── excellent_student.json    # Separate history
└── at_risk_student.json      # Separate history
```

This proves:

- ✅ Per-user personalization
- ✅ Individual tracking
- ✅ No cross-contamination

---

## Summary Table

| Research Requirement   | Implementation            | Evidence File                              |
| ---------------------- | ------------------------- | ------------------------------------------ |
| Identify student types | ✅ 4 classifications      | `student_profile_service.py`               |
| Use team database      | ✅ READ-ONLY Firebase     | `firebase_student_adapter.py`              |
| Don't modify database  | ✅ No write methods       | `firebase_student_adapter.py` (line 38-68) |
| Personalize responses  | ✅ Different prompts      | `rag.py` (line 683-750)                    |
| Good vs At-Risk        | ✅ 2+ distinct types      | `demo_supervisor.py` output                |
| Evidence of adaptation | ✅ Different risk factors | Profile JSON files                         |

---

## Key Points for Presentation

### 1. Technical Achievement

> "The chatbot integrates with our existing Firebase database to automatically identify
> student types without modifying the source data. It reads attendance rates, GPA, and
> risk probabilities to classify students."

### 2. Personalization Mechanism

> "Based on the classification, the chatbot generates different system prompts. At-risk
> students receive urgent support messages, while excellent students get advanced topic
> guidance. This is done dynamically per conversation."

### 3. Real Data Usage

> "We're using real student data from the Firebase database maintained by my teammate.
> The integration is READ-ONLY to avoid interfering with her work, while still benefiting
> from actual academic metrics."

### 4. Evidence

> "I can demonstrate two students with different profiles getting different responses to
> the same question. The profile files, code, and API logs provide concrete evidence of
> personalization working."

---

## Demo Flow for Supervisor

1. **Show Profile Files** → Different students, different classifications
2. **Show Firebase Adapter Code** → READ-ONLY methods only
3. **Show RAG Code** → Different prompts for different statuses
4. **Run Demo Script** → Live classification and personalization
5. **API Call** → Same question, different responses for two students

---

## Dependencies (Unchanged as Required)

✅ Python: 3.10.6  
✅ NumPy: 1.24.3  
✅ sklearn: 1.6.1  
✅ TensorFlow: 2.13.1

---

## Conclusion

**Your chatbot successfully demonstrates personalization through:**

1. ✅ **Database Integration** - Reads from team member's Firebase (no modifications)
2. ✅ **Automatic Classification** - Identifies 4 student types from real metrics
3. ✅ **Adaptive Responses** - Different guidance per classification
4. ✅ **Evidence-Based** - Uses attendance, GPA, risk factors
5. ✅ **Independent Tracking** - Separate chat histories per student
6. ✅ **Research-Ready** - Clear demonstration with multiple evidence files

**This confirms: Your chatbot is personalized and adapts to different student types using real academic data.**
