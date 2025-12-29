// import { appConfig } from "../../config/env";

// /**
//  * Create Quiz
//  */
// export async function createQuiz(data) {
//   try {
//     const res = await fetch(appConfig.CREATE_QUIZ_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error("CreateQuiz API error:", {
//         url: appConfig.CREATE_QUIZ_URL,
//         status: res.status,
//         response: errorText,
//         payload: data,
//       });

//       throw new Error(`Create quiz failed (${res.status})`);
//     }

//     return await res.json();
//   } catch (error) {
//     console.error("CreateQuiz fetch error:", error);
//     throw error;
//   }
// }


// export async function submitQuiz(data) {
//   try {
//     const res = await fetch(appConfig.SUBMIT_QUIZ_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });

//     const responseText = await res.text();

//     if (!res.ok) {
//       console.error("SubmitQuiz API error:", {
//         url: appConfig.SUBMIT_QUIZ_URL,
//         status: res.status,
//         response: responseText,
//         payload: data,
//       });
//       throw new Error(`Submit quiz failed (${res.status})`);
//     }

//     return JSON.parse(responseText);
//   } catch (error) {
//     console.error("SubmitQuiz fetch error:", error);
//     throw error;
//   }
// }
// /**
//  * Get Quizzes
//  */
// export async function getQuizzes() {
//   try {
//     const res = await fetch(appConfig.GET_QUIZZES_URL);

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error("GetQuizzes API error:", {
//         url: appConfig.GET_QUIZZES_URL,
//         status: res.status,
//         response: errorText,
//       });

//       throw new Error(`Failed to fetch quizzes (${res.status})`);
//     }

//     return await res.json();
//   } catch (error) {
//     console.error("GetQuizzes fetch error:", error);
//     throw error;
//   }
// }
// /**
//  * Get Quiz by ID (for TakeQuiz page)
//  */
// export async function getQuizById(quizId) {
//   try {
//     const url = `${appConfig.GET_QUIZ_BY_ID_URL}?id=${quizId}`;
//     const res = await fetch(url);

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error("GetQuizById API error:", {
//         url,
//         status: res.status,
//         response: errorText,
//       });

//       throw new Error(`Fetch quiz failed (${res.status})`);
//     }

//     return await res.json();
//   } catch (error) {
//     console.error("GetQuizById fetch error:", error);
//     throw error;
//   }
// }
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

    return await res.json();
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
