# 🎓 AcademiGuard - Student Risk Assessment & Prediction System
### An AI-Driven Academic Support & Intervention Framework

---

## 📌 Project Overview

This research presents a **multi-component AI framework** designed to enhance student success, retention, and engagement in higher education.  
The system proactively identifies academic and behavioral risks, explains the underlying causes, and recommends **personalized, timely interventions**.

By combining **machine learning, explainable AI, adaptive intervention strategies, and secure analytics**, the platform moves beyond traditional dashboards to deliver **predictive and actionable academic intelligence**.

---

## 🧠 System Architecture

<p align="center">
  <img src="architecture.png" alt="Student Risk Assessment Architecture" width="900"/>
</p>

> **Figure 1:** Overall architecture of the Student Risk Assessment & Prediction System

### Architecture Summary

The system is structured into five major layers:

1. **Data Collection & Processing**
   - LMS activity logs (logins, engagement, submissions)
   - Academic records (grades, attendance, assignments)
   - Contextual and external factors
   - Data cleaning, validation, and feature engineering

2. **Machine Learning Engine**
   - Risk prediction models (Random Forest, XGBoost, Neural Networks)
   - Sequential behavior modeling (GRU Autoencoder)
   - Ensemble learning and model validation

3. **Risk Assessment & Intervention**
   - Real-time risk scoring with confidence handling
   - Automated alert generation
   - Intervention planning and tracking

4. **User Interface & API Layer**
   - Student dashboards
   - Teacher dashboards
   - Admin dashboards
   - Secure REST APIs for analytics and integration

5. **Security & Governance**
   - Role-based access control
   - Data encryption and audit logging
   - Fairness monitoring and ethical AI compliance

---

## 👥 Project Team

| Name | Registration Number | Responsibility |
|-----|--------------------|---------------|
| **Ravisanka U.V.P** | IT22354792 | Academic Risk Prediction & Explainable Analytics |
| **Disanayaka S.T.** | IT22370228 | Struggling Lesson Recommendation System |
| **Nimanji D.L.K** | IT22365750 | AI-Powered Academic Chatbot & Notification System |
| **Perera I.A.T.D** | IT22902702 | Student Disengagement Detection & Adaptive Intervention |

**Supervisor:** Ms. Sanjeevi Chandrasiri  
**Co-Supervisor:** Ms. Ishara Weerathunga  

---

## 👤 Individual Research Contributions

---

## 🔹 Member 1 – IT22354792  
### Student Academic Risk Prediction & Explainable Analytics

### Component Overview
This component predicts **student academic risk** by analyzing behavioral, academic, and contextual data.  
It provides **real-time risk probabilities, trend analysis, and explainable insights** to support early academic interventions.

### Key Capabilities
- Academic risk probability prediction
- Semester-wise risk trend analysis
- Explainable risk factor identification
- Alert-driven intervention support
- Dashboards for students, teachers, and administrators

### Technologies Used
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Firebase Functions, Express.js
- **Database:** Firebase Firestore
- **ML Services:** FastAPI (Python)
- **ML Models:** Random Forest, XGBoost, Neural Networks

---

## 🔹 Member 2 – IT22370228  
### Struggling Lesson Recommendation System

### Component Overview
This component identifies **lesson-level learning difficulties** using quiz interaction behavior and provides **personalized lesson recommendations**.  
It enables students to revisit weak areas before examinations, supporting **proactive learning improvement**.

### Key Features
- Detects lesson-level weaknesses per student
- Recommends targeted revision lessons
- Enables focused re-practice before exams
- Improves exam readiness and learning outcomes

### Dependencies (Individual Component)

#### Frontend
- React
- React Router
- Material UI (MUI)

#### Backend Interaction
- Firebase Cloud Functions
- Firebase Firestore
- Axios

#### ML Integration
- FastAPI (external ML service)
- Scikit-learn (model inference)

---

## 🔹 Member 3 – IT22365750  
### AI-Powered Academic Chatbot & Notification System

### Component Overview
This component implements an **AI-powered academic chatbot** that assists students by answering academic queries, explaining complex notices, and delivering reminders.

It uses a **Retrieval Augmented Generation (RAG)** approach with a **locally running language model** to ensure **privacy-preserving and context-aware responses**.

### Key Capabilities
- Intent recognition and entity extraction
- Text, voice, and image input support
- OCR for scanned academic documents
- LMS-integrated real-time academic assistance
- Explainable step-by-step responses
- Event-based reminders to reduce missed deadlines

### Technologies Used
- **Frontend:** React.js
- **Backend:** Secure API service
- **Database:** Firebase Firestore (encrypted storage)
- **Authentication:** JWT-based authentication
- **AI Stack:** RAG, Local LLM, OCR

---

## 🔹 Member 4 – IT22902702  
### Student Disengagement Detection & Adaptive Intervention

### Component Overview
This component detects **student disengagement risk** using sequential LMS behavioral data and generates **adaptive intervention actions** using reinforcement learning.

### Models & Technologies
- **GRU Autoencoder:** Disengagement risk prediction
- **Reinforcement Learning (Q-Learning):** Intervention decision-making
- **FastAPI:** ML service layer
- **Firebase Functions:** Backend API integration
- **React + Vite:** Frontend visualization

### Processing Flow
- Behavioral data converted into weekly time-series sequences
- GRU Autoencoder computes reconstruction error
- Risk classified as LOW, NORMAL, or HIGH
- RL agent evaluates current student state
- Optimal intervention action selected

### Outputs

#### Disengagement Risk Prediction
- Risk level (LOW, NORMAL, HIGH)
- Reconstruction error score
- Weekly disengagement trends

#### Adaptive Intervention Actions
- DO_NOTHING
- IN_APP_REMINDER
- EMAIL_REMINDER
- MOTIVATIONAL_MESSAGE
- PEER_CHEER_ESCALATION

---

## 🔐 Security, Ethics & Governance

- Role-based access control (Student, Teacher, Admin)
- Secure API authentication
- Encrypted data storage
- Audit logging and monitoring
- Bias detection and fairness validation
- Transparent and explainable AI outputs

---

## ⚙️ Global Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Material UI

### Backend
- Firebase Functions
- Express.js
- FastAPI

### Database
- Firebase Firestore

### Machine Learning
- Python
- Scikit-learn
- GRU Neural Networks
- Reinforcement Learning (Q-Learning)

### Utilities & Communication
- Axios
- JWT Authentication
- OCR Libraries

---


