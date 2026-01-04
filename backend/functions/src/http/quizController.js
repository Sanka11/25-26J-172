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
/* =====================================================
   5️⃣ GET ALL QUIZZES (STUDENT LIST)
===================================================== */
const getAllQuizzes = functions.https.onRequest(async (req, res) => {
  try {
    const snap = await db.collection("quizzes").orderBy("level", "asc").get();


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

/* =====================================================
   FETCH QUIZ BY USER ID (STUDENT)
===================================================== */
const fetchQuizByUser = functions.https.onRequest(async (req, res) => {
  try {
    const user_id = req.query.user_id;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // 1️⃣ Get student progress
    const progressDoc = await db
      .collection("student_progress")
      .doc(user_id)
      .get();

    const currentLevel = progressDoc.exists
      ? progressDoc.data().current_level
      : 1; // default beginner

    // 2️⃣ Fetch quiz for that level
    const snap = await db
      .collection("quizzes")
      .where("level", "==", currentLevel)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Quiz not found for level" });
    }

    const quizDoc = snap.docs[0];

    return res.status(200).json({
      user_id,
      current_level: currentLevel,
      quiz_id: quizDoc.id,
      quiz: quizDoc.data(),
    });
  } catch (error) {
    console.error("Fetch quiz by user error:", error);
    return res.status(500).json({ error: "Failed to fetch quiz by user" });
  }
});

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

  const attempts = [];
  snap.forEach((d) => attempts.push(d.data()));

  const mlPayload = {
    user_id,
    attempts: attempts.map((a) => ({
      question_id: a.question_id,
      skill: a.lesson,
      correct: a.correct,
      hint_count: a.used_hint ? 1 : 0,
      ms_first_response: a.ms_first_response,
      overlap_time: a.overlap_time,
    })),
  };

  const mlRes = await axios.post(ML_STRUGGLE_URL, mlPayload, {
    timeout: 10000,
  });

  if (!mlRes.data || !mlRes.data.lesson_struggles) {
    throw new Error("Invalid ML response");
  }

  const quizAvg = mlRes.data.quiz_average_struggle_score ?? 0;

  const lessonResults = mlRes.data.lesson_struggles.map((l) => ({
    lesson: l.lesson,
    average_struggle_score: l.average_struggle_score,
    is_struggling: l.average_struggle_score >= STRUGGLE_THRESHOLD,
  }));

  const strugglingLessons = lessonResults.filter((l) => l.is_struggling);

  // const passed = quizAvg < QUIZ_PASS_THRESHOLD;
  const passed =
    quizAvg < QUIZ_PASS_THRESHOLD && strugglingLessons.length === 0;

  const nextLevel = passed ? quiz_level + 1 : quiz_level;
  const levelDocId = `${user_id}_level_${quiz_level}`;

  await db.collection("student_level_struggles").doc(levelDocId).set(
    {
      user_id,
      quiz_level,
      quiz_id,
      quiz_avg_score: quizAvg,
      passed,
      struggling_lessons: strugglingLessons,
      updated_at: new Date(),
    },
    { merge: true }
  );

  await db.collection("student_progress").doc(user_id).set(
    {
      current_level: nextLevel,
      last_quiz_avg_score: quizAvg,
      updated_at: new Date(),
    },
    { merge: true }
  );

  return {
    quiz_avg_score: Number(quizAvg.toFixed(3)),
    passed,
    next_level: nextLevel,
    struggling_lessons: strugglingLessons,
  };
}

module.exports = {
  createQuiz,
  submitQuiz,
  getAllQuizzes,
  fetchQuizByUser,
};
