import { appConfig } from "../../config/env";

export async function enrollInternship(data) {
  const res = await fetch(appConfig.ENROLL_INTERNSHIP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to enroll internship");
  return res.json();
}
