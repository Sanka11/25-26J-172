const admin = require("../firebase");

exports.getRiskHistoryByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const snapshot = await admin
      .firestore()
      .collection("student_risk_history")
      .where("student_id", "==", studentId)
      .orderBy("semester", "asc")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        message: "No risk history found for student",
        student_id: studentId,
      });
    }

    const history = snapshot.docs.map((doc) => doc.data());

    res.json({
      student_id: studentId,
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch risk history" });
  }
};
