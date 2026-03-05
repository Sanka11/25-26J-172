# FOR YOUR SUPERVISOR - PERSONALIZATION EVIDENCE

## Summary

Your AcademiGuard chatbot **successfully demonstrates personalization** by adapting responses based on student academic profiles.

## Two Student Types Created

### Student Type 1: Excellent Academic Performance

- **Attendance**: 92%
- **Exam Average**: 88.75
- **Exams Missed**: 0
- **Status**: EXCELLENT
- **Risk Factors**: None
- **File**: `ml-service/app/student_profiles/excellent_student_profile.json`

### Student Type 2: At-Risk Academic Performance

- **Attendance**: 45%
- **Exam Average**: 38.3
- **Exams Missed**: 2
- **Status**: AT_RISK
- **Risk Factors**:
  - Low attendance
  - Low exam performance
  - Missed 2 exams
  - Failed at least one exam
- **File**: `ml-service/app/student_profiles/at_risk_student_profile.json`

## How Chatbot Personalizes

### For Excellent Students

The chatbot provides:

```
**PERSONALIZED GUIDANCE FOR YOU**:
You're performing excellently! I can help with:
- Advanced academic integrity topics (proper research ethics)
- Module details and prerequisites for further study
- Lecturer consultations for complex topics
- Consider mentoring other students

Keep maintaining your excellent attendance and academic standards!
```

### For At-Risk Students

The chatbot provides:

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

## Code Implementation

### 1. Student Profile Service

**File**: `ml-service/app/services/student_profile_service.py`

- 200+ lines of code
- Automatically classifies students into 4 categories:
  - EXCELLENT (≥85% attendance, ≥70 avg marks)
  - GOOD (≥75% attendance, ≥60 avg marks)
  - AVERAGE (between good and at-risk)
  - AT_RISK (<50% attendance OR <40 avg marks OR >2 missed exams)
- Detects risk factors automatically

### 2. Response Personalization

**File**: `ml-service/app/rag.py` - Function: `_build_personalized_system_instructions()`

- Lines 683-750
- Adapts chatbot system prompt based on student status
- Different guidance for each student type

### 3. REST API Endpoints

**File**: `ml-service/app/main.py` - Lines 505-720

- `POST /student/profile` - Create student profile
- `GET /student/profile/{user_id}` - Get profile
- `PUT /student/profile/{user_id}/attendance` - Update attendance
- `POST /student/profile/{user_id}/exam-mark` - Add exam mark
- `POST /analysis/personalization-demo` - Compare responses for 2 students
- `POST /analysis/generate-research-report` - Generate research evidence

## Demonstration Steps

### Step 1: Show Profile Files

1. Open: `ml-service/app/student_profiles/excellent_student_profile.json`
2. Open: `ml-service/app/student_profiles/at_risk_student_profile.json`
3. Compare:
   - Excellent: 92% attendance, 88.75 avg → Status: "excellent"
   - At-Risk: 45% attendance, 38.3 avg → Status: "at_risk"

### Step 2: Run Demo Script

```bash
cd ml-service
python demo_supervisor.py
```

This shows:

- ✓ Two different student profiles
- ✓ How system classifies students
- ✓ How chatbot adapts to each type

### Step 3: Show Code

Open `ml-service/app/rag.py` and show function `_build_personalized_system_instructions()`:

- Line 683: Function starts
- Shows how different status values trigger different prompts
- At-risk students get urgent reminders
- Excellent students get advanced guidance

### Step 4: Test Live (if API running)

```bash
# Ask the same question to both students
curl -X POST "http://localhost:8000/analysis/personalization-demo" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is plagiarism?", "student1_id": "excellent_student", "student2_id": "at_risk_student"}'
```

This shows both students get different context in their responses.

## Research Questions - Evidence

### Q: Can your chatbot be personalized?

**A**: YES ✓

**Evidence**:

1. Student profiles stored in JSON files
2. Code in `rag.py` that adapts prompts based on profile
3. Different system instructions for excellent vs at-risk students

### Q: Can it identify different student types?

**A**: YES ✓

**Evidence**:

1. Automatic classification: excellent, good, average, at_risk
2. Based on 3 metrics: attendance %, exam marks, exams missed
3. Profile files show calculated status and risk factors

### Q: Does it provide different support?

**A**: YES ✓

**Evidence**:

1. Excellent students: "Consider mentoring others", "advanced topics"
2. At-risk students: "URGENT REMINDERS", "attend classes", "contact LIC"
3. Different prompts sent to LLM based on student status

## Files for Research Documentation

1. **Profile Files** (Evidence of different students):
   - `app/student_profiles/excellent_student_profile.json`
   - `app/student_profiles/at_risk_student_profile.json`

2. **Code Files** (Implementation):
   - `app/services/student_profile_service.py` (200+ lines)
   - `app/rag.py` (personalization logic)
   - `app/main.py` (API endpoints)

3. **Demo Scripts** (Testing):
   - `demo_supervisor.py` (quick demonstration)
   - `test_personalization_demo.py` (full test with chatbot)

4. **Documentation**:
   - `PERSONALIZATION_GUIDE.md` (complete guide)
   - This file: `SUPERVISOR_EVIDENCE.md`

## Screenshot Recommendations

Take screenshots of:

1. Demo output showing two student profiles side-by-side
2. JSON files showing different status and risk factors
3. Code in `rag.py` showing `_build_personalized_system_instructions()`
4. API response comparing answers for both students

## Key Points to Emphasize

1. **Automatic Classification**: System automatically detects struggling students
2. **Evidence-Based**: Uses real metrics (attendance, marks, missed exams)
3. **Adaptive Responses**: Chatbot changes its guidance based on student status
4. **Scalable**: Works for any number of students
5. **Persistent**: Profiles saved to disk, chat histories tracked separately

## Conclusion

Your chatbot successfully demonstrates:

- ✓ Recognition of 2 distinct student types
- ✓ Automatic risk factor detection (4 factors for at-risk student)
- ✓ Personalized response generation
- ✓ Evidence-based classification system

**This confirms your chatbot is personalized and adapts to different student needs.**
