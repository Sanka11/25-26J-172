import { appConfig } from "../../config/env";

export async function predictRecommendation(data) {
  try {
    const response = await fetch(appConfig.PREDICT_RECOMMENDATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("Recommendation API error:", error);
    return { error: true };
  }
}
