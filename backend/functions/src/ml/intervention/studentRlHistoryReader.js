const admin = require("../../firebase");

const db = admin.firestore();

/**
 * Get RL intervention history
 * If studentId provided → return that student
 * Otherwise → return all
 */
async function getRlHistory(studentId = null) {
  let query = db.collection("student_rl_intervention_history");

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

module.exports = { getRlHistory };