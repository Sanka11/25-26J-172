const admin = require("../firebase");
const db = admin.firestore();

async function getLastStudentRisk(studentId) {
  const snap = await db
    .collection("student_risk_results")
    .where("student_id", "==", studentId)
    .orderBy("created_at", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data();
}

module.exports = {
  getLastStudentRisk,
};