const functions = require("firebase-functions");
const admin = require("../firebase");
const axios = require("axios");
const { ML_STRUGGLE_URL } = require("../config");

const db = admin.firestore();

// 🔧 CONFIG
const QUIZ_PASS_THRESHOLD = 0.5; // for level unlock
const STRUGGLE_THRESHOLD = 0.6; // for struggling lessons

/* =====================================================
   1️⃣ CREATE QUIZ (LECTURER)
===================================================== */
const createQuiz = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { level, questions, created_by } = req.body;

    if (!level || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const finalQuestions = questions.map((q, idx) => ({
      question_id: `q_${idx + 1}`,
      question: q.question,
      lesson: q.lesson,
      options: q.options,
      correct_index: q.correct_index,
      hint: q.hint,
    }));

    const docRef = await db.collection("quizzes").add({
      level,
      questions: finalQuestions,
      created_by,
      created_at: new Date(),
    });

    return res.status(201).json({
      message: "Quiz created successfully",
      quiz_id: docRef.id,
    });
  } catch (error) {
    console.error("Create quiz error:", error);
    return res.status(500).json({ error: "Failed to create quiz" });
  }
});

/* =====================================================
   2️⃣ GET QUIZ BY LEVEL (STUDENT)
===================================================== */
const getQuizByLevel = functions.https.onRequest(async (req, res) => {
  try {
    const level = Number(req.query.level);

    if (!level) {
      return res.status(400).json({ error: "Level required" });
    }

    const snap = await db
      .collection("quizzes")
      .where("level", "==", level)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const quizDoc = snap.docs[0];

    return res.status(200).json({
      quiz_id: quizDoc.id,
      ...quizDoc.data(),
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

/* =====================================================
   3️⃣ SUBMIT QUIZ + GAME + STRUGGLE LOGIC
===================================================== */
const submitQuiz = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { user_id, quiz_id, quiz_level, answers } = req.body;

    if (!user_id || !quiz_id || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 1️⃣ Save student attempts
    const batch = db.batch();

    answers.forEach((ans) => {
      const ref = db.collection("student_attempts").doc();
      batch.set(ref, {
        user_id,
        quiz_id,
        quiz_level,
        question_id: ans.question_id,
        lesson: ans.lesson,
        selected_index: ans.selected_index,
        correct: ans.correct,
        used_hint: ans.used_hint,
        ms_first_response: ans.ms_first_response,
        overlap_time: ans.overlap_time,
        attempted_at: new Date(),
      });
    });

    await batch.commit();

    // 2️⃣ Evaluate quiz using ML
    const progress = await evaluateQuizProgress(user_id, quiz_id, quiz_level);

    return res.status(200).json({
      message: "Quiz submitted",
      ...progress,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return res.status(500).json({ error: "Failed to submit quiz" });
  }
});
/* =====================================================
   5️⃣ GET ALL QUIZZES (STUDENT LIST)
===================================================== */
const getAllQuizzes = functions.https.onRequest(async (req, res) => {
  try {
    const snap = await db.collection("quizzes").orderBy("level", "asc").get();

    const quizzes = snap.docs.map((doc) => ({
      quiz_id: doc.id,
      level: doc.data().level,
      question_count: doc.data().questions.length,
    }));

    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("Get quizzes error:", error);
    return res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

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

/* =====================================================
   4️⃣ ML EVALUATION + THRESHOLD DECISIONS
===================================================== */
async function evaluateQuizProgress(user_id, quiz_id, quiz_level) {
  const snap = await db
    .collection("student_attempts")
    .where("user_id", "==", user_id)
    .where("quiz_id", "==", quiz_id)
    .get();

  if (snap.empty) {
    throw new Error("No attempts found for this quiz");
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
  getQuizByLevel,
  submitQuiz,
  getAllQuizzes,
  fetchQuizByUser,
};
