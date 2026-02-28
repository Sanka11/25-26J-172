const admin = require("../firebase");

exports.testWeeklyReader = async (req, res) => {
  try {
    const studentId = req.params.studentId || "S001";

    const db = admin.firestore();

    const snapshot = await db
      .collection("student_activity_weekly")
      .where("student_id", "==", studentId)
      .orderBy("week", "desc")
      .limit(10)
      .get();

    const weeks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({
      student_id: studentId,
      weeks_count: weeks.length,
      weeks,
    });
  } catch (err) {
    console.error("Error reading weekly data:", err);
    return res.status(500).json({ error: err.message });
  }
};