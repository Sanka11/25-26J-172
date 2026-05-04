// backend/functions/src/http/studentAccController.js
const admin = require("../firebase");

const db = admin.firestore();

exports.getStudentProfile = async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { studentId } = req.params;
    if (!studentId)
      return res.status(400).json({ error: "studentId is required" });

    const accDoc = await db.collection("student_acc").doc(studentId).get();
    if (!accDoc.exists) {
      return res
        .status(404)
        .json({ error: "Student profile not found", student_id: studentId });
    }

    const acc = accDoc.data();

    // Latest risk prediction (cached)
    const riskDoc = await db
      .collection("student_risk_predictions")
      .doc(studentId)
      .get();
    const risk = riskDoc.exists ? riskDoc.data() : null;

    return res.status(200).json({
      student_id: studentId,
      // Personal info
      first_name: acc.first_name ?? null,
      last_name: acc.last_name ?? null,
      email: acc.email ?? null,
      age: acc.Age ?? acc.age ?? null,
      gender: acc.Gender ?? acc.gender ?? null,
      department: acc.Department ?? acc.department ?? null,
      current_year: acc.current_year ?? null,
      current_semester: acc.current_semester ?? null,
      // Lifestyle
      Study_Hours_per_Week: acc.Study_Hours_per_Week ?? null,
      Stress_Level: acc.Stress_Level ?? null,
      Sleep_Hours_per_Night: acc.Sleep_Hours_per_Night ?? null,
      Extracurricular_Activities: acc.Extracurricular_Activities ?? acc.extracurricular_activities ?? null,
      Internet_Access_at_Home: acc.Internet_Access_at_Home ?? acc.internet_access_at_home ?? null,
      Parent_Education_Level: acc.Parent_Education_Level ?? acc.parent_education_level ?? null,
      Family_Income_Level: acc.Family_Income_Level ?? acc.family_income_level ?? null,
      // Academic marks
      Attendance_pct: acc.Attendance_pct ?? null,
      Midterm_Score: acc.Midterm_Score ?? null,
      Final_Score: acc.Final_Score ?? null,
      Assignments_Avg: acc.Assignments_Avg ?? null,
      Quizzes_Avg: acc.Quizzes_Avg ?? null,
      Participation_Score: acc.Participation_Score ?? null,
      Projects_Score: acc.Projects_Score ?? null,
      // Risk (prefer student_acc fields, fall back to prediction doc)
      risk_score: acc.risk_score ?? risk?.risk_score ?? null,
      risk_label: acc.risk_label ?? risk?.risk_level ?? null,
      risk_percentage: acc.risk_percentage ?? risk?.risk_percentage ?? null,
      risk_color: acc.risk_color ?? risk?.risk_color ?? null,
      shap_explanation: risk?.explanation ?? null,
      risk_predicted_at: acc.risk_predicted_at ?? null,
      // Timestamps
      created_at: acc.created_at ?? null,
      updated_at: acc.updated_at ?? null,
    });
  } catch (err) {
    console.error("getStudentProfile error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch student profile", details: err.message });
  }
};
