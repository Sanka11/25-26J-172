import { appConfig } from "../../config/env";

export async function fetchCareerReadiness(data) {
  const res = await fetch(appConfig.CAREER_READINESS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Career readiness analysis failed");
  }

  return res.json();
}
