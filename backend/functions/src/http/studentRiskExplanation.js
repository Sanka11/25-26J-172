// backend/functions/src/http/studentRiskExplanation.js
const functions = require("firebase-functions");
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
// Lecturer updates marks → risk automatically recalculated
exports.updateStudentMarks = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { studentId, ...updatedFields } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    // 1. Save updated marks to Firestore
    await db
      .collection("students")
      .doc(studentId)
      .set(
        {
          ...updatedFields,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    // 2. Get full student data for ML input
    const studentDoc = await db.collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: "Student not found in Firestore" });
    }
    const studentData = studentDoc.data();

    // 3. Recalculate risk via ML service
    const mlResponse = await axios.post(
      `${ML_XAI_BASE_URL}/predict-risk/shap/${studentId}`,
      studentData,
      { timeout: 30000 },
    );

    // 4. Save new prediction to Firestore
    await db
      .collection("student_risk_predictions")
      .doc(studentId)
      .set(
        {
          ...mlResponse.data,
          updated_by: "lecturer",
          cached_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return res.status(200).json({
      message: "Marks updated and risk recalculated successfully.",
      new_risk: mlResponse.data,
    });
  } catch (error) {
    console.error("Update marks error:", error);
    return res.status(500).json({ error: "Failed to update marks" });
  }
});
