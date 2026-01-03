const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Get RL decision for a student
 */
export async function getRLDecision(studentId) {
  const response = await fetch(
    `${API_BASE}/api/rl/decide/${studentId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch RL decision");
  }

  return response.json();
}
