const admin = require("../firebase");

exports.clearStudentWeeks = async (req, res) => {
  try {
    const db = admin.firestore();
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: "studentId required" });
    }

    const snapshot = await db
      .collection("student_weekly_records")
      .where("student_id", "==", studentId)
      .get();

    if (snapshot.empty) {
      return res.json({ status: "no_records", deleted: 0 });
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return res.json({
      status: "cleared",
      deleted: snapshot.size,
      student_id: studentId
    });

  } catch (error) {
    console.error("Clear weeks error:", error);
    res.status(500).json({ error: error.message });
  }
};
