// backend/functions/src/http/studentProfileController.js
// Creates profiles in ALL of:
//   1. student_acc/{student_id}  → XAI risk prediction
//   2. students/{auto-id}        → teammates' collection
//   3. Firebase Auth             → enables login
//   4. users/{uid}               → role-based routing in the frontend



// backend/functions/src/http/studentProfileController.js
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("../firebase");
const { FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");
const { ML_XAI_BASE_URL } = require("../config");

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
  const yr = Number(s.current_year);
  if (!yr || yr < 1 || yr > 4)
    errors.push("current_year must be 1, 2, 3, or 4 (academic year)");
  return errors;
}

function hasScores(s) {
  const isNew =
    Number(s.current_year) === 1 && s.current_semester === "Semester 1";
  return !isNew;
}

// ── Build the exact 17-field ML payload (matches updateStudentMarks) ──────
function buildMlPayload(s) {
  const midterm = Number(s.midterm_score ?? s.Midterm_Score ?? 60);
  const finalRaw = Number(s.final_score ?? s.Final_Score ?? 0);
  return {
    Attendance_pct: Number(s.attendance_pct ?? s.Attendance_pct ?? 75),
    Midterm_Score: midterm,
    Final_Score: finalRaw > 0 ? finalRaw : midterm, // use midterm as proxy when final not yet taken
    Assignments_Avg: Number(s.assignments_avg ?? s.Assignments_Avg ?? 60),
    Quizzes_Avg: Number(s.quizzes_avg ?? s.Quizzes_Avg ?? 60),
    Participation_Score: Number(s.participation_score ?? s.Participation_Score ?? 0),
    Projects_Score: Number(s.projects_score ?? s.Projects_Score ?? 60),
    Age: Number(s.age ?? s.Age ?? 21),
    Study_Hours_per_Week: Number(s.study_hours_per_week ?? s.Study_Hours_per_Week ?? 20),
    Stress_Level: Number(s.stress_level ?? s.Stress_Level ?? 5),
    Sleep_Hours_per_Night: Number(s.sleep_hours_per_night ?? s.Sleep_Hours_per_Night ?? 7),
    Gender: String(s.gender ?? "Male"),
    Department: String(s.department ?? "Computer Science"),
    Extracurricular_Activities: String(s.extracurricular_activities ?? "No"),
    Internet_Access_at_Home: String(s.internet_access_at_home ?? "Yes"),
    Parent_Education_Level: String(s.parent_education_level ?? "Bachelor"),
    Family_Income_Level: String(s.family_income_level ?? "Medium"),
  };
}

// ── Call ML → write risk back to student_acc + student_risk_predictions ───
async function runRiskPrediction(studentId, s) {
  try {
    const mlPayload = buildMlPayload(s);

    console.log(`🔮 Running risk prediction for ${studentId}`, mlPayload);

    const mlResponse = await axios.post(
      `${ML_XAI_BASE_URL}/predict-risk/shap/${studentId}`,
      mlPayload,
      { timeout: 30000 },
    );

    const result = mlResponse.data;

    const riskData = {
      ...result,
      student_id: studentId,
      updated_by: "profile_creation",
      cached_at: FieldValue.serverTimestamp(),
      predicted_at: FieldValue.serverTimestamp(),
    };

    // 1. Mirror to student_risk_predictions/{studentId} (same as updateStudentMarks)
    await db
      .collection("student_risk_predictions")
      .doc(studentId)
      .set(riskData, { merge: true });

    // 2. Write summary fields back to student_acc/{studentId}
    await db
      .collection("student_acc")
      .doc(studentId)
      .update({
        risk_score: result.risk_score ?? result.risk_percentage ?? null,
        risk_label: result.risk_label ?? result.risk_level ?? null,
        shap_values: result.shap_values ?? null,
        risk_predicted_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });

    console.log(
      `✅ Risk prediction complete for ${studentId}: ${result.risk_level ?? result.risk_label}`,
    );
    return result;
  } catch (err) {
    console.error(`⚠️ Risk prediction failed for ${studentId}:`, err.message);
    if (err.response) {
      console.error(
        `   ML responded with ${err.response.status}:`,
        JSON.stringify(err.response.data),
      );
    }
    return null;
  }
}

// ── Firebase Auth + users/{uid} ───────────────────────────────────────────
async function createAuthAndUserDoc(s, batch) {
  const studentId = String(s.student_id).trim();

  try {
    await admin.auth().getUserByEmail(s.email.trim().toLowerCase());
    return null; // already exists — skip
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
  }

  const rawPassword = studentId;
  const password =
    rawPassword.length < 6 ? rawPassword.padEnd(6, "@") : rawPassword;

  const userRecord = await admin.auth().createUser({
    email: s.email.trim().toLowerCase(),
    password,
    displayName: `${String(s.first_name).trim()} ${String(s.last_name).trim()}`,
  });

  batch.set(db.collection("users").doc(userRecord.uid), {
    firstName: String(s.first_name).trim(),
    lastName: String(s.last_name).trim(),
    contactNo: s.contactNo || "",
    email: s.email.trim().toLowerCase(),
    role: "student",
    student_id: studentId,
    createdAt: FieldValue.serverTimestamp(),
  });

  return userRecord.uid;
}

// ── student_acc/{student_id} ──────────────────────────────────────────────
function buildStudentAccDoc(s) {
  const isNew =
    Number(s.current_year) === 1 && s.current_semester === "Semester 1";

  // Clamp to valid academic year 1–4
  const academicYear = Math.min(4, Math.max(1, Number(s.current_year) || 1));

  // Demographic values — stored in the PascalCase that updateStudentMarks reads
  const gender     = s.gender     || "Male";
  const department = s.department || "Computer Science";
  const age        = Number(s.age) || 21;
  const extracurricular     = s.extracurricular_activities || "No";
  const internetAccess      = s.internet_access_at_home   || "Yes";
  const parentEducation     = s.parent_education_level    || "Bachelor";
  const familyIncome        = s.family_income_level       || "Medium";

  return {
    student_id:       String(s.student_id).trim(),
    first_name:       String(s.first_name).trim(),
    last_name:        String(s.last_name).trim(),
    email:            String(s.email).trim().toLowerCase(),
    current_year:     academicYear,
    current_semester: s.current_semester || "Semester 1",

    // Demographic — lowercase for profile reads, PascalCase for ML reads
    gender,       Gender:     gender,
    age,          Age:        age,
    department,   Department: department,
    Extracurricular_Activities: extracurricular,
    Internet_Access_at_Home:    internetAccess,
    Parent_Education_Level:     parentEducation,
    Family_Income_Level:        familyIncome,

    // Academic marks
    Attendance_pct:      isNew ? 0 : Number(s.attendance_pct)   || 0,
    Midterm_Score:       isNew ? 0 : Number(s.midterm_score)     || 0,
    Final_Score:         isNew ? 0 : Number(s.final_score)       || 0,
    Assignments_Avg:     isNew ? 0 : Number(s.assignments_avg)   || 0,
    Quizzes_Avg:         isNew ? 0 : Number(s.quizzes_avg)       || 0,
    Participation_Score: isNew ? 0 : Number(s.participation_score) || 0,
    Projects_Score:      isNew ? 0 : Number(s.projects_score)    || 0,

    // Lifestyle — null until student explicitly saves these in their profile
    Study_Hours_per_Week:  s.study_hours_per_week  != null ? Number(s.study_hours_per_week)  : null,
    Stress_Level:          s.stress_level          != null ? Number(s.stress_level)          : null,
    Sleep_Hours_per_Night: s.sleep_hours_per_night != null ? Number(s.sleep_hours_per_night) : null,

    // Risk fields — null until ML runs
    risk_score:       null,
    risk_label:       null,
    risk_percentage:  null,
    risk_color:       null,
    shap_values:      null,
    risk_predicted_at: null,

    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  };
}

// ── students/{auto-id} (teammates' collection) ────────────────────────────
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

    const existing = await db.collection("student_acc").doc(id).get();
    if (existing.exists)
      return res.status(409).json({ error: `Student ID ${id} already exists` });

    const batch = db.batch();
    await createAuthAndUserDoc(student, batch);
    batch.set(
      db.collection("student_acc").doc(id),
      buildStudentAccDoc(student),
    );
    batch.set(db.collection("students").doc(), buildStudentsDoc(student));
    await batch.commit();

    // Run ML after commit — only for non-new students
    let riskResult = null;
    if (hasScores(student)) {
      riskResult = await runRiskPrediction(id, student);
    }

    return res.status(201).json({
      success: true,
      message: `Profile created for ${student.first_name} ${student.last_name}`,
      student_id: id,
      risk_predicted: riskResult !== null,
      risk_level: riskResult?.risk_level ?? null,
      risk_percentage: riskResult?.risk_percentage ?? null,
      note: !hasScores(student)
        ? "New student — risk prediction skipped (no scores yet)"
        : riskResult !== null
          ? "Risk prediction ran automatically"
          : "Risk prediction attempted but ML service was unreachable — start XAI service on port 8001 and re-save marks",
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
    const CHUNK = 200;

    for (let i = 0; i < students.length; i += CHUNK) {
      const chunk = students.slice(i, i + CHUNK);
      const batch = db.batch();
      const toPredict = [];

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

        try {
          await createAuthAndUserDoc(s, batch);
          batch.set(
            db.collection("student_acc").doc(id),
            buildStudentAccDoc(s),
          );
          batch.set(db.collection("students").doc(), buildStudentsDoc(s));
          results.success.push(id);
          if (hasScores(s)) toPredict.push({ id, s });
        } catch (authErr) {
          results.failed.push({ student_id: id, errors: [authErr.message] });
        }
      }

      await batch.commit();

      // Run all ML predictions concurrently after batch commits
      if (toPredict.length > 0) {
        console.log(
          `🔮 Running risk prediction for ${toPredict.length} students...`,
        );
        await Promise.all(
          toPredict.map(({ id, s }) => runRiskPrediction(id, s)),
        );
      }
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

// ── GET /checkStudentIdExists ─────────────────────────────────────────────
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