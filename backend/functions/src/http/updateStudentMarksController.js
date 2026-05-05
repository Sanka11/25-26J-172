// Called by the lecturer dashboard when marks are saved.
// Reads existing student data, calls XAI for risk, then writes to
// student_acc, student_risk_predictions, and student_risk_history.
const admin = require("../firebase");
const { FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");
const { ML_XAI_BASE_URL } = require("../config");

const db = admin.firestore();

exports.updateStudentMarks = async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { studentId } = req.params;
    const body = req.body;

    if (!studentId)
      return res.status(400).json({ error: "studentId is required" });

    // need the existing doc to pull demographic fields (gender, department etc.)
    // that aren't sent in the marks payload
    const accDoc = await db.collection("student_acc").doc(studentId).get();
    if (!accDoc.exists) {
      return res
        .status(404)
        .json({ error: "Student not found in student_acc", student_id: studentId });
    }
    const existing = accDoc.data();

    // new marks override stored values; demographics come from existing doc
    const mlPayload = {
      Attendance_pct:             Number(body.Attendance_pct        ?? existing.Attendance_pct        ?? 75),
      Midterm_Score:              Number(body.Midterm_Score         ?? existing.Midterm_Score         ?? 60),
      Final_Score:                Number(body.Final_Score           ?? existing.Final_Score           ?? 60),
      Assignments_Avg:            Number(body.Assignments_Avg       ?? existing.Assignments_Avg       ?? 60),
      Quizzes_Avg:                Number(body.Quizzes_Avg           ?? existing.Quizzes_Avg           ?? 60),
      Participation_Score:        Number(body.Participation_Score   ?? existing.Participation_Score   ?? 0),
      Projects_Score:             Number(body.Projects_Score        ?? existing.Projects_Score        ?? 60),
      Age:                        Number(existing.Age               ?? existing.age                   ?? 21),
      Study_Hours_per_Week:       Number(body.Study_Hours_per_Week  ?? existing.Study_Hours_per_Week  ?? 10),
      Stress_Level:               Number(body.Stress_Level          ?? existing.Stress_Level          ?? 5),
      Sleep_Hours_per_Night:      Number(body.Sleep_Hours_per_Night ?? existing.Sleep_Hours_per_Night ?? 7),
      Gender:                     String(existing.Gender            ?? existing.gender                ?? "Male"),
      Department:                 String(existing.Department        ?? existing.department            ?? "Computer Science"),
      Extracurricular_Activities: String(existing.Extracurricular_Activities ?? "No"),
      Internet_Access_at_Home:    String(existing.Internet_Access_at_Home    ?? "Yes"),
      Parent_Education_Level:     String(existing.Parent_Education_Level     ?? "Bachelor"),
      Family_Income_Level:        String(existing.Family_Income_Level        ?? "Medium"),
    };

    // marks are NOT saved if the XAI call fails — the error is returned to the frontend
    let riskResult;
    try {
      const resp = await axios.post(
        `${ML_XAI_BASE_URL}/predict-risk/shap/${studentId}`,
        mlPayload,
        { timeout: 30000 },
      );
      riskResult = resp.data;
    } catch (mlErr) {
      console.error("ML service error:", mlErr.message);
      return res
        .status(502)
        .json({ error: "ML service unavailable — marks not saved. Start the XAI service and retry." });
    }

    const now = FieldValue.serverTimestamp();
    const semesterLabel =
      body.semester_label ??
      `Year ${existing.current_year ?? "?"} – ${existing.current_semester ?? "?"}`;

    const riskTrend =
      riskResult.risk_score >= 0.7
        ? "Increasing"
        : riskResult.risk_score < 0.4
          ? "Decreasing"
          : "Stable";

    // Derive the new current_year / current_semester from the saved semester label
    // e.g. "Year 2 – Semester 1" → year=2, semester="Semester 1"
    const labelMatch = semesterLabel.match(/Year\s+(\d+)\s*[–\-]\s*Semester\s+(\d+)/i);
    const newYear = labelMatch ? parseInt(labelMatch[1]) : null;
    const newSem  = labelMatch ? `Semester ${labelMatch[2]}` : null;

    // update marks and risk together in one write
    const accUpdate = {
      Attendance_pct:        mlPayload.Attendance_pct,
      Midterm_Score:         mlPayload.Midterm_Score,
      Final_Score:           mlPayload.Final_Score,
      Assignments_Avg:       mlPayload.Assignments_Avg,
      Quizzes_Avg:           mlPayload.Quizzes_Avg,
      Participation_Score:   mlPayload.Participation_Score,
      Projects_Score:        mlPayload.Projects_Score,
      Study_Hours_per_Week:  mlPayload.Study_Hours_per_Week,
      Stress_Level:          mlPayload.Stress_Level,
      Sleep_Hours_per_Night: mlPayload.Sleep_Hours_per_Night,
      risk_score:            riskResult.risk_score,
      risk_label:            riskResult.risk_level,
      risk_percentage:       riskResult.risk_percentage,
      risk_color:            riskResult.risk_color,
      shap_values:           riskResult.explanation ?? null,
      risk_predicted_at:     now,
      updated_at:            now,
    };
    // Only advance semester position when label was parseable and within Year 1-4
    if (newYear && newYear >= 1 && newYear <= 4) {
      accUpdate.current_year     = newYear;
      accUpdate.current_semester = newSem;
    }

    await db.collection("student_acc").doc(studentId).update(accUpdate);

    // student_risk_predictions holds the latest cached prediction for quick reads
    await db
      .collection("student_risk_predictions")
      .doc(studentId)
      .set(
        {
          ...riskResult,
          student_id:   studentId,
          updated_by:   "marks_update",
          cached_at:    now,
          predicted_at: now,
        },
        { merge: true },
      );

    // each semester's marks and risk are appended so the trend chart has data over time
    await db.collection("student_risk_history").add({
      student_id:       studentId,
      semester_label:   semesterLabel,
      risk_probability: riskResult.risk_score,
      risk_percentage:  riskResult.risk_percentage,
      risk_level:       riskResult.risk_level,
      risk_color:       riskResult.risk_color,
      risk_trend:       riskTrend,
      marks_snapshot:   mlPayload,
      recorded_at:      now,
    });

    return res.status(200).json({
      success:          true,
      student_id:       studentId,
      semester_label:   semesterLabel,
      current_year:     newYear     ?? existing.current_year,
      current_semester: newSem      ?? existing.current_semester,
      risk_score:       riskResult.risk_score,
      risk_percentage:  riskResult.risk_percentage,
      risk_level:       riskResult.risk_level,
      risk_color:       riskResult.risk_color,
      explanation:      riskResult.explanation,
    });
  } catch (err) {
    console.error("updateStudentMarks error:", err);
    return res
      .status(500)
      .json({ error: "Failed to update marks", details: err.message });
  }
};
