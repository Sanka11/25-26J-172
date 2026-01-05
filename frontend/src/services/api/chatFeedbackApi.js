import { appConfig } from "../../config/env";

export async function fetchChatFeedbackList() {
  const res = await fetch(appConfig.LIST_CHAT_FEEDBACK_URL);
  if (!res.ok) {
    throw new Error(`Failed to load feedback list: ${res.status}`);
  }
  return res.json();
}

export async function deleteChatFeedback(id) {
  const res = await fetch(appConfig.DELETE_CHAT_FEEDBACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete feedback: ${res.status}`);
  }
  return res.json();
}