// backend/functions/src/ml/studentRiskWriter.js

const admin = require("../firebase");

const db = admin.firestore();

/**
 * Save current risk + history for a student
 */
async function saveStudentRiskResult(studentId, riskData) {
  const studentRef = db.collection("student_risk_results").doc(studentId);

  const now = new Date();

  // 1️⃣ Save latest snapshot (fast access for dashboards)
  await studentRef.set(
    {
      current: {
        risk_level: riskData.risk_level,
        reconstruction_error: riskData.reconstruction_error,
        risk_trend: riskData.risk_trend,
        recommended_action: riskData.recommended_action,
        decision_reason: riskData.decision_reason,
        week: riskData.week,
        updated_at: now,
      },
    },
    { merge: true }
  );

  // 2️⃣ Save history (for trends / analysis)
  if (riskData.week) {
    await studentRef
      .collection("history")
      .doc(riskData.week)
      .set({
        risk_level: riskData.risk_level,
        reconstruction_error: riskData.reconstruction_error,
        risk_trend: riskData.risk_trend,
        recommended_action: riskData.recommended_action,
        decision_reason: riskData.decision_reason,
        created_at: now,
      });
  }
}

module.exports = {
  saveStudentRiskResult,
};