const admin = require("../firebase");

const db = admin.firestore();

/**
 * Fetch last N weeks of activity for a student
 * This is ML-support logic (not an API)
 */
async function getStudentWeeklyActivity(studentId, limit = 10) {
  const snapshot = await db
    .collection("student_activity_weekly")
    .where("student_id", "==", studentId)
    .orderBy("week", "desc")
    .limit(limit)
    .get();

  const weeks = [];

  snapshot.forEach((doc) => {
    weeks.push(doc.data());
  });

  return weeks;
}

module.exports = {
  getStudentWeeklyActivity,
};