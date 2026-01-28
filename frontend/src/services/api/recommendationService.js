import { appConfig } from "../../config/env";

/**
 * Career-Goal-Aware Recommendation
 * Calls Node backend → ML-service → Neo4j
 */
export async function getCareerRecommendation(studentId) {
  try {
    const response = await fetch(appConfig.CAREER_RECOMMENDATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });

    return await response.json();
  } catch (error) {
    console.error("Career Recommendation API error:", error);
    return { error: true };
  }
}
