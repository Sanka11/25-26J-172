import { appConfig } from "../../config/env";

/**
 * Create Quiz
 */
export async function createQuiz(data) {
  try {
    const res = await fetch(appConfig.CREATE_QUIZ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("CreateQuiz API error:", {
        url: appConfig.CREATE_QUIZ_URL,
        status: res.status,
        response: errorText,
        payload: data,
      });

      throw new Error(`Create quiz failed (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("CreateQuiz fetch error:", error);
    throw error;
  }
}

/**
 * Submit Quiz
 */
export async function submitQuiz(data) {
  try {
    const res = await fetch(appConfig.SUBMIT_QUIZ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("SubmitQuiz API error:", {
        url: appConfig.SUBMIT_QUIZ_URL,
        status: res.status,
        response: errorText,
        payload: data,
      });

      throw new Error(`Submit quiz failed (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("SubmitQuiz fetch error:", error);
    throw error;
  }
}

/**
 * Get Quizzes
 */
export async function getQuizzes() {
  try {
    const res = await fetch(appConfig.GET_QUIZZES_URL);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("GetQuizzes API error:", {
        url: appConfig.GET_QUIZZES_URL,
        status: res.status,
        response: errorText,
      });

      throw new Error(`Failed to fetch quizzes (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("GetQuizzes fetch error:", error);
    throw error;
  }
}
/**
 * Get Quiz by ID (for TakeQuiz page)
 */
export async function getQuizById(quizId) {
  try {
    const url = `${appConfig.GET_QUIZ_BY_ID_URL}?id=${quizId}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("GetQuizById API error:", {
        url,
        status: res.status,
        response: errorText,
      });

      throw new Error(`Fetch quiz failed (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error("GetQuizById fetch error:", error);
    throw error;
  }
}