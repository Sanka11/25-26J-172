const admin = require("../firebase");

exports.addStudentWeeklyRecord = async (req, res) => {
  try {
    const db = admin.firestore();

    const {
      student_id,
      login_count,
      avg_session_duration_min,
      total_active_time_min,
      days_since_last_login,
      page_views,
      assignments_submitted,
      on_time_submissions,
      late_submissions,
      alerts_responded,
      response_rate
    } = req.body;

    if (!student_id) {
      return res.status(400).json({
        error: "student_id required"
      });
    }

    // get latest week for this student
    const snapshot = await db
      .collection("student_weekly_records")
      .where("student_id", "==", student_id)
      .orderBy("week", "desc")
      .limit(1)
      .get();

    let nextWeek = 1;

    if (!snapshot.empty) {
      const latestWeek = snapshot.docs[0].data().week; // 2026-W10
      const weekNumber = parseInt(latestWeek.split("W")[1]);
      nextWeek = weekNumber + 1;
    }

    const week = `2026-W${String(nextWeek).padStart(2, "0")}`;
    const docId = `${student_id}-26-W${String(nextWeek).padStart(2, "0")}`;

    const record = {
      student_id,
      week,
      login_count,
      avg_session_duration_min,
      total_active_time_min,
      days_since_last_login,
      page_views,
      assignments_submitted,
      on_time_submissions,
      late_submissions,
      alerts_responded,
      response_rate,
      updatedAt: new Date()
    };

    await db.collection("student_weekly_records").doc(docId).set(record);

    res.json({
      status: "success",
      week,
      docId
    });

  } catch (error) {
    console.error("Add weekly record error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};