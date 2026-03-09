import axios from "axios";
import { appConfig } from "../../config/env";

// ── Keep old function — backward compat ──
export async function predictRiskScore(input) {
  const response = await axios.post(appConfig.PREDICT_RISK_URL, input);
  return response.data;
}

// ── NEW: SHAP risk prediction for a student ──
export async function predictRiskShap(studentId, academicData) {
  const response = await axios.post(appConfig.PREDICT_RISK_SHAP_URL, {
    studentId,
    ...academicData,
  });
  return response.data;
}

// ── NEW: Get cached risk explanation from Firestore ──
export async function getStudentRiskExplanation(studentId) {
  const response = await axios.get(appConfig.GET_STUDENT_RISK_URL, {
    params: { studentId },
  });
  return response.data;
}

// ── NEW: What-if next semester prediction (never saved) ──
export async function predictNextSemester(formData) {
  const response = await axios.post(
    appConfig.PREDICT_NEXT_SEMESTER_URL,
    formData,
  );
  return response.data;
}

// ── NEW: Get all students risk for lecturer ──
export async function getBulkRisk() {
  const response = await axios.get(appConfig.GET_BULK_RISK_URL);
  return response.data;
}

// ── NEW: Lecturer updates marks → risk recalculated ──
export async function updateStudentMarks(studentId, updatedData) {
  const response = await axios.post(appConfig.UPDATE_STUDENT_MARKS_URL, {
    studentId,
    ...updatedData,
  });
  return response.data;
}

// ── NEW: Get student risk history (all semesters grouped by year) ──
export async function getStudentRiskHistory(studentId) {
  const response = await axios.get(appConfig.GET_STUDENT_RISK_HISTORY_URL, {
    params: { studentId },
  });
  return response.data;
}

// ── NEW: Create single student profile (it22354792) ──
export async function createStudentProfile(studentData) {
  const response = await axios.post(
    appConfig.CREATE_STUDENT_PROFILE_URL,
    studentData,
  );
  return response.data;
}

// ── NEW: Bulk create student profiles from CSV (it22354792) ──
export async function bulkCreateStudentProfiles(students) {
  const response = await axios.post(
    appConfig.BULK_CREATE_STUDENT_PROFILES_URL,
    { students },
  );
  return response.data;
}

// ── NEW: Check if student ID already exists (it22354792) ──
export async function checkStudentIdExists(studentId) {
  const response = await axios.get(appConfig.CHECK_STUDENT_ID_EXISTS_URL, {
    params: { student_id: studentId },
  });
  return response.data.exists;
}
