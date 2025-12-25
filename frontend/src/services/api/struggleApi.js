import { appConfig } from "../../config/env";

export async function predictStruggle(data) {
  try {
    const response = await fetch(appConfig.PREDICT_STRUGGLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("struggle error :", error);
    return { error: true };
  }
}
