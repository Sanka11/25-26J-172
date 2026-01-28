import { appConfig } from "../../config/env";

export async function enrollSubject(data) {
  const res = await fetch(appConfig.ENROLL_SUBJECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Enrollment failed");
  }

  return res.json();
}
