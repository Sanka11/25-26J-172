const admin = require("../../firebase");

const db = admin.firestore();

/**
 * Get GRU risk history
 * If studentId provided → return only that student
 * Otherwise → return all records
 */
async function getGruHistory(studentId = null) {
  let query = db.collection("student_gru_risk_history");

  if (studentId) {
    query = query.where("student_id", "==", studentId);
  }

  const snapshot = await query.get();

  const results = [];

  snapshot.forEach((doc) => {
    results.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return results;
}

module.exports = { getGruHistory };