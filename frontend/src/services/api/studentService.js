import { appConfig } from "../../config/env";

/**
 * Fetch student enrollment details
 * - subjects
 * - internship
 */
export async function fetchStudentEnrollment(studentId) {
  const response = await fetch(
    `${appConfig.GET_STUDENT_ENROLLMENT_URL}?studentId=${studentId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch student enrollment");
  }

  return response.json();
}
