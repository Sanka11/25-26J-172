import { appConfig } from "../../config/env";

export async function createSubject(subjectData) {
  const response = await fetch(appConfig.CREATE_SUBJECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subjectData),
  });

  if (!response.ok) {
    throw new Error("Failed to create subject");
  }

  return response.json();
}
// export async function fetchAllSubjects() {
//   const res = await fetch(appConfig.GET_ALL_SUBJECTS_URL);
//   if (!res.ok) throw new Error("Failed to fetch subjects");
//   return res.json();
// }
export async function fetchAllSubjects(studentId) {
  
const res = await fetch(appConfig.GET_ALL_SUBJECTS_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ studentId }),
});
  if (!res.ok) {
    throw new Error("Failed to fetch student enrollment");
  }

  return res.json();
}