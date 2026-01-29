import { appConfig } from "../../config/env";

export async function fetchCognitiveLoad(data) {
  const res = await fetch(appConfig.COGNITIVE_LOAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Cognitive load analysis failed");
  }

  return res.json();
}
