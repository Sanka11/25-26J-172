const BASE_URL = "https://us-central1-demiguard-3b4e8.cloudfunctions.net/api";

export async function fetchStudentRisk(studentId) {
  const res = await fetch(
    `${BASE_URL}/api/student-risk-explanation?studentId=${studentId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch student risk");
  }

  return res.json();
}
