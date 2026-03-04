# Chatbot Personalization - Research Documentation

## Overview

This document demonstrates how AcademiGuard chatbot provides **personalized responses** based on student academic profiles.

## What Was Implemented

### 1. Student Profile System

- **File**: `ml-service/app/services/student_profile_service.py`
- Tracks student metrics:
  - Attendance percentage
  - Exam marks and averages
  - Exams missed
  - Automatically calculates student status (EXCELLENT, GOOD, AVERAGE, AT_RISK)

### 2. Profile-Based Response Adaptation

- **File**: `ml-service/app/rag.py` (function: `_build_personalized_system_instructions`)
- Chatbot adapts its responses based on student profile:
  - **Excellent students**: Advanced guidance, mentorship encouragement
  - **At-risk students**: Urgent deadline warnings, support resources, attendance reminders

### 3. Independent Chat Histories

- **File**: `ml-service/app/services/chat_history_service.py`
- Each student has their own conversation history
- Stored in: `ml-service/chat_history/`

## Student Profiles Created for Demo

### Student 1: Excellent Academic Performance

```
User ID: excellent_student
Attendance: 92%
Exam Marks: [85, 90, 88, 92]
Average: 88.8
Missed Exams: 0
Status: EXCELLENT
Risk Factors: None
```

### Student 2: At-Risk Academic Performance

```
User ID: at_risk_student
Attendance: 45%
Exam Marks: [35, 42, 38]
Average: 38.3
Missed Exams: 2
Status: AT_RISK
Risk Factors: Low attendance, Low exam performance, Missed 2 exams, Failed at least one exam
```

## How to Demonstrate to Supervisor

### Option 1: Run the Demo Script

```bash
cd ml-service
python demo_supervisor.py
```

This will:

- Create two student profiles (excellent vs at-risk)
- Show how profiles differ
- Explain how chatbot adapts responses

### Option 2: Use API Endpoints (if backend running)

#### Create Student Profiles

```bash
# Create excellent student profile
POST http://localhost:8000/student/profile?user_id=student1&attendance_percent=92&exam_marks=[85,90,88,92]&exams_missed=0

# Create at-risk student profile
POST http://localhost:8000/student/profile?user_id=student2&attendance_percent=45&exam_marks=[35,42,38]&exams_missed=2
```

#### Get Student Profile

```bash
GET http://localhost:8000/student/profile/student1
```

#### Compare Chatbot Responses

```bash
# Ask the same question to both students
POST http://localhost:8000/analysis/personalization-demo
Body: {
  "question": "What is plagiarism?",
  "student1_id": "excellent_student",
  "student2_id": "at_risk_student"
}
```

This endpoint will:

- Get responses for both students
- Show how responses differ
- Demonstrate personalization

#### Generate Research Report

```bash
POST http://localhost:8000/analysis/generate-research-report
```

Returns comprehensive report showing:

- Student profile comparisons
- Evidence of personalization
- Answers to research questions

## Files to Show Supervisor

1. **Student Profiles** (JSON files):
   - `ml-service/student_profiles/excellent_student_profile.json`
   - `ml-service/student_profiles/at_risk_student_profile.json`

2. **Chat Histories** (JSON files):
   - `ml-service/chat_history/excellent_student.json`
   - `ml-service/chat_history/at_risk_student.json`

3. **Code Implementation**:
   - `ml-service/app/services/student_profile_service.py` - Profile management
   - `ml-service/app/rag.py` - Response personalization logic (line 681+)
   - `ml-service/app/main.py` - API endpoints (line 505+)

## Research Questions - Answered

### Q1: Can the chatbot recognize different types of students?

**Answer**: ✓ YES  
The system uses attendance, exam performance, and missed exams to classify students as:

- EXCELLENT (high achiever)
- GOOD (above average)
- AVERAGE (typical performance)
- AT_RISK (needs support)

### Q2: Does the chatbot provide personalized responses?

**Answer**: ✓ YES  
The chatbot adapts system instructions based on student status:

- Excellent students get advanced topic guidance
- At-risk students get support resources and deadline emphasis

### Q3: Can you show evidence of personalization?

**Answer**: ✓ YES  
Evidence includes:

1. Different student profiles with calculated status
2. Separate chat histories per user
3. Adaptive system prompts in code (see `_build_personalized_system_instructions`)
4. API endpoints that compare responses side-by-side

## Key Features for Final Year Research

1. **Automatic Risk Detection**: System identifies struggling students based on metrics
2. **Adaptive Support**: Responses change based on student needs
3. **Persistent Tracking**: Chat histories saved per user
4. **Scalable**: Works for any number of students
5. **Evidence-Based**: All decisions based on quantifiable metrics (attendance, marks)

## Testing the System

### Quick Test (No backend required):

```bash
cd ml-service
python demo_supervisor.py
```

### Full Test with Chatbot Responses:

```bash
# 1. Start the backend (if not running)
cd ml-service
python -m uvicorn app.main:app --reload --port 8000

# 2. In another terminal, test personalization
cd ml-service
python test_personalization_demo.py
```

## Screenshots/Evidence for Documentation

1. **Demo Output**: Shows two distinct student profiles
2. **Profile JSON Files**: Raw data showing metrics and status
3. **Chat History Files**: Separate conversations for each student
4. **API Response Comparison**: Same question, different guidance

## Summary

Your chatbot **successfully demonstrates personalization** through:

- ✓ Profile-based student classification
- ✓ Adaptive response generation
- ✓ Independent conversation tracking
- ✓ Evidence-based decision making

This provides strong evidence for your final year research that the chatbot recognizes and adapts to different student types.
