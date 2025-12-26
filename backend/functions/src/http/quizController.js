const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();
const { FieldValue } = admin.firestore;

/**
 * Create Quiz
 */
const createQuiz = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const quiz = req.body;
    console.log("CreateQuiz payload:", quiz);

    if (!quiz || !quiz.title || !quiz.skill_name) {
      return res.status(400).json({ error: "Invalid quiz data" });
    }

    await db.collection("quizzes").add({
      title: quiz.title,
      skill_name: quiz.skill_name,
      questions: quiz.questions || [],
      created_at: new Date(), // ✅ SAFE FIX
    });

    return res.status(200).json({ message: "Quiz created" });
  } catch (error) {
    console.error("Create quiz error:", error);
    return res.status(500).json({ error: "Failed to create quiz" });
  }
});

/**
 * Submit Quiz
 */
// /**
//  * Submit Quiz
//  */
// const submitQuiz = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "POST") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { quiz_id, user_id, answers, score, total } = req.body;
//     console.log("SubmitQuiz payload:", req.body);

//     // ✅ Strict validation
//     if (
//       !quiz_id ||
//       !user_id ||
//       !Array.isArray(answers) ||
//       typeof score !== "number" ||
//       typeof total !== "number"
//     ) {
//       return res.status(400).json({ error: "Invalid attempt data" });
//     }

//     await db.collection("quiz_attempts").add({
//       quiz_id,
//       user_id,
//       answers,
//       score,
//       total,
//       created_at: new Date(), // safe
//     });

//     return res.status(200).json({ message: "Quiz submitted" });
//   } catch (error) {
//     // 🔥 THIS LOG WILL SHOW THE REAL ERROR
//     console.error("Submit quiz error:", error.message, error.stack);
//     return res.status(500).json({ error: "Failed to submit quiz" });
//   }
// });
/**
 * Submit Quiz Attempt
 */
const submitQuiz = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {
      user_id,
      quiz_id,
      skill_name,
      score,
      total,
      answers,
      hint_count,
      ms_first_response,
      overlap_time,
    } = req.body;

    // 🔍 Validation
    if (!user_id || !quiz_id || !skill_name || total === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Save quiz attempt (DO NOT overwrite)
    await db.collection("quiz_attempts").add({
      user_id,
      quiz_id,
      skill_name,
      score,
      total,
      answers: answers || [],
      hint_count: hint_count || 0,
      ms_first_response: ms_first_response || 0,
      overlap_time: overlap_time || 0,
      created_at: new Date(),
    });

    return res.status(200).json({
      message: "Quiz attempt saved successfully",
    });
  } catch (error) {
    console.error("SubmitQuiz error:", error);
    return res.status(500).json({ error: "Failed to submit quiz" });
  }
});


/**
 * Get Quizzes
 */
const getQuizzes = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const snapshot = await db.collection("quizzes").get();
    const quizzes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("Get quizzes error:", error);
    return res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});
/**
 * Get Quiz by ID
 */
const getQuizById = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const quizId = req.query.id;

    if (!quizId) {
      return res.status(400).json({ error: "Quiz ID is required" });
    }

    const doc = await db.collection("quizzes").doc(quizId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error("Get quiz by ID error:", error);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
});


module.exports = {
  createQuiz,
  submitQuiz,
  getQuizzes,
  getQuizById,
};
