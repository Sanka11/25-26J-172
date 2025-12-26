// frontend/src/services/api/levelApi.js
// frontend/src/services/api/levelApi.js
import { appConfig } from "../../config/env";

export async function checkLevelUnlock({ user_id, skill_name }) {
  const res = await fetch(appConfig.CHECK_LEVEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id,
      skill_name,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Level API error:", text);
    throw new Error("Level unlock failed");
  }

  return await res.json();
}


/**
 * Get current user level
 */
export async function getUserLevel(user_id) {
  const res = await fetch(
    `${appConfig.GET_USER_LEVEL_URL}?user_id=${user_id}`
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("GetUserLevel API error:", text);
    throw new Error("Failed to fetch user level");
  }

  return await res.json();
}