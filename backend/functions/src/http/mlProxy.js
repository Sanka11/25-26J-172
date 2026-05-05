// backend/functions/src/http/mlProxy.js
const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");
const { ML_XAI_BASE_URL } = require("../config");

// ── Keep old endpoint — backward compat ──
const predictRisk = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const response = await axios.post(
      `${ML_XAI_BASE_URL}/predict-risk`,
      req.body,
    );
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("ML proxy error:", error.message);
    return res.status(500).json({ error: "ML service error" });
  }
});

// ── NEW: SHAP risk prediction ──
const predictRiskShap = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { studentId, ...academicData } = req.body;

    const endpoint = studentId
      ? `${ML_XAI_BASE_URL}/predict-risk/shap/${studentId}`
      : `${ML_XAI_BASE_URL}/predict-risk/shap`;

    const response = await axios.post(endpoint, academicData, {
      timeout: 30000,
    });

    // Cache in Firestore if studentId provided
    if (studentId) {
      try {
        const admin = require("../firebase");
        const { FieldValue } = require("firebase-admin/firestore");
        const db = admin.firestore();
        await db
          .collection("student_risk_predictions")
          .doc(studentId)
          .set(
            {
              ...response.data,
              cached_at: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (cacheErr) {
        console.warn("Cache write failed (non-fatal):", cacheErr.message);
      }
    }

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("SHAP risk error:", error.message);
    if (error.response) {
      return res
        .status(error.response.status)
        .json({ error: error.response.data });
    }
    return res.status(500).json({ error: "ML service unavailable" });
  }
});

// ── NEW: Next semester what-if prediction ──
const predictNextSemester = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const response = await axios.post(
      `${ML_XAI_BASE_URL}/predict-risk/next-semester`,
      req.body,
      { timeout: 30000 },
    );
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Next semester error:", error.message);
    return res.status(500).json({ error: "ML service unavailable" });
  }
});

// ── NEW: Bulk risk for lecturer/admin ──
// Reads from student_risk_predictions + enriches with student_acc info
const getBulkRisk = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    return res.status(204).send("");
  }
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const admin = require("../firebase");
    const db = admin.firestore();

    // student_acc is the source of truth — includes ALL students (even new ones with no risk yet)
    const accSnapshot = await db.collection("student_acc").get();

    // Risk predictions for enrichment (may not exist for Year 1 Sem 1 students)
    const riskSnapshot = await db.collection("student_risk_predictions").get();
    const riskMap = {};
    riskSnapshot.docs.forEach((doc) => { riskMap[doc.id] = doc.data(); });

    const students = accSnapshot.docs.map((doc) => {
      const accData = doc.data();
      const riskData = riskMap[doc.id] || {};
      return {
        student_id: doc.id,
        first_name: accData.first_name || null,
        last_name: accData.last_name || null,
        department: accData.department || accData.Department || null,
        current_semester: accData.current_semester || null,
        current_year: accData.current_year ?? null,
        // Academic marks (for pre-filling modal)
        Attendance_pct: accData.Attendance_pct ?? null,
        Midterm_Score: accData.Midterm_Score ?? null,
        Final_Score: accData.Final_Score ?? null,
        Assignments_Avg: accData.Assignments_Avg ?? null,
        Quizzes_Avg: accData.Quizzes_Avg ?? null,
        Participation_Score: accData.Participation_Score ?? null,
        Projects_Score: accData.Projects_Score ?? null,
        // Lifestyle
        Study_Hours_per_Week: accData.Study_Hours_per_Week ?? null,
        Stress_Level: accData.Stress_Level ?? null,
        Sleep_Hours_per_Night: accData.Sleep_Hours_per_Night ?? null,
        Gender: accData.Gender || accData.gender || null,
        Department: accData.Department || accData.department || null,
        Age: accData.Age || accData.age || null,
        Extracurricular_Activities: accData.Extracurricular_Activities || null,
        Internet_Access_at_Home: accData.Internet_Access_at_Home || null,
        Parent_Education_Level: accData.Parent_Education_Level || null,
        Family_Income_Level: accData.Family_Income_Level || null,
        // Risk (null if prediction not yet run)
        risk_score: riskData.risk_score ?? null,
        risk_percentage: riskData.risk_percentage ?? null,
        risk_level: riskData.risk_level ?? null,
        risk_color: riskData.risk_color ?? null,
        explanation: riskData.explanation ?? null,
        cached_at: riskData.cached_at?.toDate?.()?.toISOString() || null,
      };
    });

    // Sort: High first, Medium, Low, then no-risk (new students) last
    const levelOrder = { High: 0, Medium: 1, Low: 2 };
    students.sort(
      (a, b) =>
        (levelOrder[a.risk_level] ?? 3) - (levelOrder[b.risk_level] ?? 3),
    );

    return res.status(200).json({ students, total: students.length });
  } catch (error) {
    console.error("Bulk risk error:", error.message);
    return res.status(500).json({ error: "Failed to fetch risk data" });
  }
});

module.exports = {
  predictRisk,
  predictRiskShap,
  predictNextSemester,
  getBulkRisk,
};
