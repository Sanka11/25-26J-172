// backend/functions/src/http/studentRiskExplanation.js
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("../firebase");
const axios = require("axios");
const { ML_XAI_BASE_URL } = require("../config");

const db = admin.firestore();

// ── GET /getStudentRiskExplanation?studentId=XXXX ──
exports.getStudentRiskExplanation = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const docSnap = await db
      .collection("student_risk_predictions")
      .doc(studentId)
      .get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "No risk prediction found for this student.",
        hint: "Call /predictRiskShap with academic data to generate a prediction first.",
      });
    }

    const data = docSnap.data();
    return res.status(200).json({
      ...data,
      cached_at: data.cached_at?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching risk explanation:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /updateStudentMarks ──
// Lecturer updates marks → saved to student_acc → risk auto recalculated
exports.updateStudentMarks = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { studentId, year, semester, ...updatedFields } = req.body;

    // ── Validation ──────────────────────────────────────────────
    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }
    if (!year || !semester) {
      return res.status(400).json({ error: "year and semester are required" });
    }
    if (!["Semester 1", "Semester 2"].includes(semester)) {
      return res.status(400).json({
        error: "semester must be 'Semester 1' or 'Semester 2'",
      });
    }

    // e.g. "2025_Semester1"
    const semesterKey = `${year}_${semester.replace(" ", "")}`;

    // ── Step 1: Save marks to student_acc semester sub-collection
    const semesterRef = db
      .collection("student_acc")
      .doc(studentId)
      .collection("semesters")
      .doc(semesterKey);

    await semesterRef.set(
      {
        ...updatedFields,
        year: Number(year),
        semester,
        semester_key: semesterKey,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // ── Step 2: Update student_acc top-level doc with latest marks
    await db
      .collection("student_acc")
      .doc(studentId)
      .set(
        {
          ...updatedFields,
          current_year: Number(year),
          current_semester: semester,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    // ── Step 3: Get full student profile from student_acc ───────
    const studentDoc = await db.collection("student_acc").doc(studentId).get();

    if (!studentDoc.exists) {
      return res
        .status(404)
        .json({ error: "Student not found in student_acc" });
    }
    const profile = studentDoc.data();

    // ── Build clean ML payload — exactly the 17 fields model needs
    // Marks from updatedFields (just saved), profile fields from student_acc
    const mlPayload = {
      Attendance_pct: Number(
        updatedFields.Attendance_pct ?? profile.Attendance_pct ?? 75,
      ),
      Midterm_Score: Number(
        updatedFields.Midterm_Score ?? profile.Midterm_Score ?? 60,
      ),
      Final_Score: Number(
        updatedFields.Final_Score ?? profile.Final_Score ?? 60,
      ),
      Assignments_Avg: Number(
        updatedFields.Assignments_Avg ?? profile.Assignments_Avg ?? 60,
      ),
      Quizzes_Avg: Number(
        updatedFields.Quizzes_Avg ?? profile.Quizzes_Avg ?? 60,
      ),
      Participation_Score: Number(
        updatedFields.Participation_Score ?? profile.Participation_Score ?? 60,
      ),
      Projects_Score: Number(
        updatedFields.Projects_Score ?? profile.Projects_Score ?? 60,
      ),
      Age: Number(profile.age ?? profile.Age ?? 21),
      Study_Hours_per_Week: Number(
        updatedFields.Study_Hours_per_Week ??
          profile.Study_Hours_per_Week ??
          10,
      ),
      Stress_Level: Number(
        updatedFields.Stress_Level ?? profile.Stress_Level ?? 5,
      ),
      Sleep_Hours_per_Night: Number(
        updatedFields.Sleep_Hours_per_Night ??
          profile.Sleep_Hours_per_Night ??
          7,
      ),
      Gender: String(profile.gender ?? profile.Gender ?? "Male"),
      Department: String(profile.department ?? profile.Department ?? "CS"),
      Extracurricular_Activities: String(
        profile.extracurricular_activities ??
          profile.Extracurricular_Activities ??
          "No",
      ),
      Internet_Access_at_Home: String(
        profile.internet_access_at_home ??
          profile.Internet_Access_at_Home ??
          "Yes",
      ),
      Parent_Education_Level: String(
        profile.parent_education_level ??
          profile.Parent_Education_Level ??
          "Bachelor",
      ),
      Family_Income_Level: String(
        profile.family_income_level ?? profile.Family_Income_Level ?? "Middle",
      ),
    };

    // ── Step 4: Auto-trigger risk prediction ─────────────────────
    let riskResult = null;
    try {
      const mlResponse = await axios.post(
        `${ML_XAI_BASE_URL}/predict-risk/shap/${studentId}`,
        mlPayload,
        { timeout: 30000 },
      );
      riskResult = mlResponse.data;

      const riskData = {
        ...riskResult,
        student_id: studentId,
        year: Number(year),
        semester,
        semester_key: semesterKey,
        updated_by: "lecturer",
        cached_at: admin.firestore.FieldValue.serverTimestamp(),
        predicted_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Save risk to semester doc
      await semesterRef.set(riskData, { merge: true });

      // Mirror latest to student_risk_predictions
      await db
        .collection("student_risk_predictions")
        .doc(studentId)
        .set(riskData, { merge: true });
    } catch (predError) {
      console.error("Auto risk prediction failed:", predError.message);
    }

    return res.status(200).json({
      message: `Marks saved for ${semester} ${year} and risk recalculated.`,
      semester_key: semesterKey,
      risk_updated: riskResult !== null,
      risk_level: riskResult?.risk_level ?? null,
      risk_percentage: riskResult?.risk_percentage ?? null,
      new_risk: riskResult,
    });
  } catch (error) {
    console.error("Update marks error:", error);
    return res.status(500).json({ error: "Failed to update marks" });
  }
});

// ── GET /getStudentRiskHistory?studentId=XXXX ──
// Returns all semesters from student_acc grouped by year
exports.getStudentRiskHistory = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const semestersSnap = await db
      .collection("student_acc")
      .doc(studentId)
      .collection("semesters")
      .orderBy("year", "asc")
      .get();

    if (semestersSnap.empty) {
      return res.status(200).json({
        success: true,
        history: [],
        grouped: {},
        current_year: null,
        past_years: [],
      });
    }

    const history = [];
    const grouped = {};

    semestersSnap.forEach((doc) => {
      const d = doc.data();
      const entry = {
        semester_key: doc.id,
        year: d.year,
        semester: d.semester,
        risk_score: d.risk_score ?? null,
        risk_percentage: d.risk_percentage ?? null,
        risk_level: d.risk_level ?? null,
        risk_color: d.risk_color ?? null,
        explanation: d.explanation ?? null,
        updated_at: d.updated_at?.toDate?.()?.toISOString() || null,
        predicted_at: d.predicted_at?.toDate?.()?.toISOString() || null,
      };

      history.push(entry);

      if (!grouped[d.year]) grouped[d.year] = [];
      grouped[d.year].push(entry);
    });

    // Latest year = current, rest = past
    const allYears = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a);
    const currentYear = allYears[0];
    const pastYears = allYears.slice(1);

    return res.status(200).json({
      success: true,
      history,
      grouped,
      current_year: currentYear,
      past_years: pastYears,
    });
  } catch (error) {
    console.error("getStudentRiskHistory error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
