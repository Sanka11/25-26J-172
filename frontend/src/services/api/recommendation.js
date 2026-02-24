import axios from "axios";
import { appConfig } from "../../config/env"; // Make sure this path points to your config file!

/**
 * Fetches personalized AI recommendations for a student or batch of students.
 * @param {Object} input - Must contain a 'students' array.
 * Example: { students: [ { student_id: "S123", attendance_pct: 75, ... } ] }
 */
export async function fetchStudentRecommendations(input) {
  try {
    const response = await axios.post(appConfig.GET_RECOMMENDATIONS_URL, input);

    // Returns: { cohort_average_recommendation_index: number, student_recommendations: [...] }
    return response.data;
  } catch (error) {
    console.error("Error fetching student recommendations:", error);
    throw error; // Rethrow so the UI can catch it and show an error message
  }
}
