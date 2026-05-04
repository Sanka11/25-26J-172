const admin = require("../firebase");
const { FieldValue } = require("firebase-admin/firestore");

const db = admin.firestore();

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

    await db.collection("student_acc").doc(studentId).update({
      ...updates,
      updated_at: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, student_id: studentId, updated: updates });
  } catch (err) {
    console.error("updateStudentLifestyle error:", err);
    return res.status(500).json({ error: "Failed to update lifestyle", details: err.message });
  }
};
