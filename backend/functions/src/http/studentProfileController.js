// backend/functions/src/http/studentProfileController.js
// Creates profiles in BOTH:
//   1. student_acc/{student_id}  → XAI risk prediction (our collection)
//   2. students/{auto-id}        → teammates' collection (scores + student_id)

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("../firebase");

const db = admin.firestore();

function setCors(res, method = "POST") {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", method);
}

function validateStudent(s) {
  const errors = [];
  if (!s.student_id) errors.push("student_id is required");
  if (!s.first_name) errors.push("first_name is required");
  if (!s.last_name) errors.push("last_name is required");
  if (!s.email || !s.email.includes("@"))
    errors.push("valid email is required");
  if (!s.age || isNaN(s.age) || Number(s.age) < 16 || Number(s.age) > 60)
    errors.push("age must be 16-60");
  return errors;
}

// ── Document for student_acc/{student_id} ─────────────────────────────────
function buildStudentAccDoc(s) {
  const isNew =
    Number(s.current_year) === 1 && s.current_semester === "Semester 1";
  return {
    student_id: String(s.student_id).trim(),
    first_name: String(s.first_name).trim(),
    last_name: String(s.last_name).trim(),
    email: String(s.email).trim().toLowerCase(),
    gender: s.gender || "Male",
    age: Number(s.age) || 21,
    department: s.department || "Computer Science",
    current_year: Number(s.current_year) || 1,
    current_semester: s.current_semester || "Semester 1",
    extracurricular_activities: s.extracurricular_activities || "No",
    internet_access_at_home: s.internet_access_at_home || "Yes",
    parent_education_level: s.parent_education_level || "Bachelor",
    family_income_level: s.family_income_level || "Medium",
    // Use provided scores for existing students, default 0 for new ones
    Assignments_Avg: isNew ? 0 : Number(s.assignments_avg) || 0,
    Attendance_pct: isNew ? 0 : Number(s.attendance_pct) || 0,
    Midterm_Score: isNew ? 0 : Number(s.midterm_score) || 0,
    Projects_Score: isNew ? 0 : Number(s.projects_score) || 0,
    Quizzes_Avg: isNew ? 0 : Number(s.quizzes_avg) || 0,
    // These are always defaulted — lecturer enters later
    Final_Score: 0,
    Participation_Score: 0,
    Study_Hours_per_Week: 0,
    Stress_Level: 5,
    Sleep_Hours_per_Night: 7,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// ── Document for students/{auto-id} (teammates' collection) ──────────────
// Only the 5 fields they use + student_id for linking
function buildStudentsDoc(s) {
  const isNew =
    Number(s.current_year) === 1 && s.current_semester === "Semester 1";
  return {
    student_id: String(s.student_id).trim(),
    midterm_score: isNew ? 0 : Number(s.midterm_score) || 0,
    assignments_avg: isNew ? 0 : Number(s.assignments_avg) || 0,
    attendance_pct: isNew ? 0 : Number(s.attendance_pct) || 0,
    projects_score: isNew ? 0 : Number(s.projects_score) || 0,
    quizzes_avg: isNew ? 0 : Number(s.quizzes_avg) || 0,
  };
}

// ── POST /createStudentProfile ────────────────────────────────────────────
const createStudentProfile = onRequest(async (req, res) => {
  setCors(res, "POST");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const student = req.body;
    const errors = validateStudent(student);
    if (errors.length)
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });

    const id = String(student.student_id).trim();

    // Check duplicate in student_acc
    const existing = await db.collection("student_acc").doc(id).get();
    if (existing.exists)
      return res.status(409).json({ error: `Student ID ${id} already exists` });

    // Write both collections atomically
    const batch = db.batch();

    // 1. student_acc/{student_id}
    batch.set(
      db.collection("student_acc").doc(id),
      buildStudentAccDoc(student),
    );

    // 2. students/{auto-id}  — teammates' collection
    const studentsRef = db.collection("students").doc(); // auto-generated ID
    batch.set(studentsRef, buildStudentsDoc(student));

    await batch.commit();

    return res.status(201).json({
      success: true,
      message: `Profile created for ${student.first_name} ${student.last_name}`,
      student_id: id,
    });
  } catch (err) {
    console.error("createStudentProfile error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ── POST /bulkCreateStudentProfiles ──────────────────────────────────────
const bulkCreateStudentProfiles = onRequest(async (req, res) => {
  setCors(res, "POST");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0)
      return res.status(400).json({ error: "students array is required" });
    if (students.length > 500)
      return res
        .status(400)
        .json({ error: "Maximum 500 students per bulk upload" });

    const results = { success: [], failed: [], skipped: [] };
    const CHUNK = 200; // Each student = 2 writes, so keep well under 500 limit

    for (let i = 0; i < students.length; i += CHUNK) {
      const chunk = students.slice(i, i + CHUNK);
      const batch = db.batch();

      for (const s of chunk) {
        const errs = validateStudent(s);
        if (errs.length) {
          results.failed.push({
            student_id: s.student_id || `row_${i}`,
            errors: errs,
          });
          continue;
        }

        const id = String(s.student_id).trim();
        const exists = await db.collection("student_acc").doc(id).get();
        if (exists.exists) {
          results.skipped.push({ student_id: id, reason: "Already exists" });
          continue;
        }

        // 1. student_acc/{student_id}
        batch.set(db.collection("student_acc").doc(id), buildStudentAccDoc(s));

        // 2. students/{auto-id} — teammates' collection
        batch.set(db.collection("students").doc(), buildStudentsDoc(s));

        results.success.push(id);
      }

      await batch.commit();
    }

    return res.status(200).json({
      success: true,
      message: "Bulk upload complete",
      summary: {
        total: students.length,
        created: results.success.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
      },
      created: results.success,
      skipped: results.skipped,
      failed: results.failed,
    });
  } catch (err) {
    console.error("bulkCreateStudentProfiles error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// ── GET /checkStudentIdExists?student_id=XXXX ────────────────────────────
const checkStudentIdExists = onRequest(async (req, res) => {
  setCors(res, "GET");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { student_id } = req.query;
  if (!student_id)
    return res.status(400).json({ error: "student_id is required" });

  const doc = await db.collection("student_acc").doc(student_id).get();
  return res.status(200).json({ exists: doc.exists });
});

module.exports = {
  createStudentProfile,
  bulkCreateStudentProfiles,
  checkStudentIdExists,
};
