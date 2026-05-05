const admin = require("../firebase");
const { FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");
const { ML_XAI_BASE_URL } = require("../config");

const db = admin.firestore();

// Called when a student saves their lifestyle data from their profile page.
// Saves the values then immediately re-runs risk prediction so the score reflects the change.
exports.updateStudentLifestyle = async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { studentId } = req.params;
    if (!studentId)
      return res.status(400).json({ error: "studentId is required" });

    const accDoc = await db.collection("student_acc").doc(studentId).get();
    if (!accDoc.exists)
      return res.status(404).json({ error: "Student not found", student_id: studentId });

    const existing = accDoc.data();
    const { Study_Hours_per_Week, Stress_Level, Sleep_Hours_per_Night } = req.body;

    const updates = {};
    if (Study_Hours_per_Week != null) {
      const v = Number(Study_Hours_per_Week);
      if (isNaN(v) || v < 0 || v > 40)
        return res.status(400).json({ error: "Study_Hours_per_Week must be 0–40" });
      updates.Study_Hours_per_Week = v;
    }
    if (Stress_Level != null) {
      const v = Number(Stress_Level);
      if (isNaN(v) || v < 1 || v > 10)
        return res.status(400).json({ error: "Stress_Level must be 1–10" });
      updates.Stress_Level = v;
    }
    if (Sleep_Hours_per_Night != null) {
      const v = Number(Sleep_Hours_per_Night);
      if (isNaN(v) || v < 0 || v > 12)
        return res.status(400).json({ error: "Sleep_Hours_per_Night must be 0–12" });
      updates.Sleep_Hours_per_Night = v;
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: "No valid lifestyle fields provided" });

    // save first so the data isn't lost if the ML call fails
    await db.collection("student_acc").doc(studentId).update({
      ...updates,
      updated_at: FieldValue.serverTimestamp(),
    });

    // merge new lifestyle values over existing doc so the full 17-field payload is complete
    const merged = { ...existing, ...updates };

    // risk recalculation is best-effort — lifestyle is already saved so a ML failure isn't fatal
    let riskResult = null;
    try {
      const _midterm   = Number(merged.Midterm_Score ?? 60);
      const _finalRaw  = Number(merged.Final_Score  ?? 0);
      const mlPayload = {
        Attendance_pct:             Number(merged.Attendance_pct             ?? 75),
        Midterm_Score:              _midterm,
        Final_Score:                _finalRaw > 0 ? _finalRaw : _midterm,
        Assignments_Avg:            Number(merged.Assignments_Avg            ?? 60),
        Quizzes_Avg:                Number(merged.Quizzes_Avg                ?? 60),
        Participation_Score:        Number(merged.Participation_Score        ?? 0),
        Projects_Score:             Number(merged.Projects_Score             ?? 60),
        Age:                        Number(merged.Age        ?? merged.age   ?? 21),
        Study_Hours_per_Week:       Number(merged.Study_Hours_per_Week       ?? 20),
        Stress_Level:               Number(merged.Stress_Level               ?? 5),
        Sleep_Hours_per_Night:      Number(merged.Sleep_Hours_per_Night      ?? 7),
        Gender:                     String(merged.Gender     ?? merged.gender ?? "Male"),
        Department:                 String(merged.Department ?? merged.department ?? "Computer Science"),
        Extracurricular_Activities: String(merged.Extracurricular_Activities ?? "No"),
        Internet_Access_at_Home:    String(merged.Internet_Access_at_Home    ?? "Yes"),
        Parent_Education_Level:     String(merged.Parent_Education_Level     ?? "Bachelor"),
        Family_Income_Level:        String(merged.Family_Income_Level        ?? "Medium"),
      };

      const mlResponse = await axios.post(
        `${ML_XAI_BASE_URL}/predict-risk/shap/${studentId}`,
        mlPayload,
        { timeout: 30000 },
      );
      riskResult = mlResponse.data;
      const now = FieldValue.serverTimestamp();

      await db.collection("student_acc").doc(studentId).update({
        risk_score:       riskResult.risk_score,
        risk_label:       riskResult.risk_level,
        risk_percentage:  riskResult.risk_percentage,
        risk_color:       riskResult.risk_color,
        shap_values:      riskResult.explanation ?? null,
        risk_predicted_at: now,
        updated_at:       now,
      });

      await db.collection("student_risk_predictions").doc(studentId).set(
        {
          ...riskResult,
          student_id:   studentId,
          updated_by:   "lifestyle_update",
          cached_at:    now,
          predicted_at: now,
        },
        { merge: true },
      );

      console.log(`✅ Lifestyle + risk updated for ${studentId}: ${riskResult.risk_level}`);
    } catch (mlErr) {
      console.error(`⚠️ Lifestyle saved but risk recalc failed for ${studentId}:`, mlErr.message);
    }

    return res.status(200).json({
      success:          true,
      student_id:       studentId,
      updated:          updates,
      risk_recalculated: riskResult !== null,
      risk_level:       riskResult?.risk_level       ?? null,
      risk_percentage:  riskResult?.risk_percentage  ?? null,
    });
  } catch (err) {
    console.error("updateStudentLifestyle error:", err);
    return res.status(500).json({ error: "Failed to update lifestyle", details: err.message });
  }
};
