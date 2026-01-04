import { appConfig } from "../../config/env";

/* =========================
   CREATE QUIZ (LECTURER)
========================= */
export async function createQuiz(payload) {
  try {
    const res = await fetch(appConfig.CREATE_QUIZ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create quiz");
    }

    return await res.json();
  } catch (error) {
    console.error("Create quiz API error:", error);
    return { error: true, message: error.message };
  }
}

/* =========================
   FETCH QUIZ BY LEVEL
========================= */
export async function fetchQuiz(level) {
  try {
    const res = await fetch(
      `${appConfig.GET_QUIZ_BY_LEVEL_URL}?level=${level}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch quiz");
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch quiz API error:", error);
    return { error: true, message: error.message };
  }
}
/* =========================
   FETCH QUIZ BY USER ID
========================= */
export async function fetchQuizByUser(user_id) {
  try {
    const res = await fetch(
      `${appConfig.GET_QUIZ_BY_ID_URL}?user_id=${user_id}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch quiz by user");
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch quiz by user API error:", error);
    return { error: true, message: error.message };
  }
}

/* =========================
   SUBMIT QUIZ (STUDENT)
========================= */
export async function submitQuiz(payload) {
  try {
    const res = await fetch(appConfig.SUBMIT_QUIZ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to submit quiz");
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Submit quiz API error:", error);
    return { error: true, message: error.message };
  }
}

export async function getQuizzes() {
  try {
    const res = await fetch(appConfig.GET_QUIZZES_URL);

    if (!res.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    return await res.json();
  } catch (error) {
    console.error("Get quizzes API error:", error);
    return [];
  }
}
