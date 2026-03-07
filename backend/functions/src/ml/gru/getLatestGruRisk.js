const admin = require("../../../firebase");

/**
 * Get latest and previous GRU risk for a student
 */
async function getLatestGruRisk(studentId) {
  const snapshot = await admin
    .firestore()
    .collection("student_gru_risk_history")
    .where("student_id", "==", studentId)
    .orderBy("run_date", "desc")
    .limit(2)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const records = snapshot.docs.map(doc => doc.data());

  return {
    current: records[0],
    previous: records[1] || null
  };
}

module.exports = { getLatestGruRisk };