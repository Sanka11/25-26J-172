import { appConfig } from "../../config/env";

// Generate workload (POST)
export async function generateWorkload(data) {
  const response = await fetch(appConfig.GENERATE_WORKLOAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to generate workload");
  }

  return response.json();
}

// Fetch daily workload (GET)
export async function fetchDailyWorkload(studentId) {
  const response = await fetch(
    `${appConfig.GET_DAILY_WORKLOAD_URL}?studentId=${studentId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch daily workload");
  }

  return response.json();
}
