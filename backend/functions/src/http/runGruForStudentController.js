const admin = require("../firebase");
const fetch = require("node-fetch");

exports.runGruForStudent = async (req, res) => {
  try {
    const db = admin.firestore();
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({
        error: "studentId required"
      });
    }

    // ----------------------------------------
    // Get last 10 weeks of activity
    // ----------------------------------------
    const snapshot = await db
      .collection("student_weekly_records")
      .where("student_id", "==", studentId)
      .orderBy("week", "desc")
      .limit(10)
      .get();

    if (snapshot.size < 10) {
      return res.status(400).json({
        error: "Need at least 10 weeks of data"
      });
    }

    const weeks = [];

    snapshot.forEach(doc => {
      const d = doc.data();

      weeks.push({
        login_count: d.login_count,
        avg_session_duration_min: d.avg_session_duration_min,
        total_active_time_min: d.total_active_time_min,
        days_since_last_login: d.days_since_last_login,
        page_views: d.page_views,
        assignments_submitted: d.assignments_submitted,
        on_time_submissions: d.on_time_submissions,
        late_submissions: d.late_submissions,
        alerts_responded: d.alerts_responded,
        response_rate: d.response_rate
      });
    });

    weeks.reverse();

    // ----------------------------------------
    // Call GRU FastAPI service
    // ----------------------------------------
    const response = await fetch(
      "http://127.0.0.1:8000/disengagement/gru-only",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          last_10_weeks: weeks
        })
      }
    );

    const gruResult = await response.json();

    console.log("GRU RESULT:", gruResult);

    const reconstruction_error = gruResult.reconstruction_error;
    const risk_level = gruResult.risk_level;

    if (reconstruction_error === undefined) {
      return res.status(500).json({
        error: "Invalid GRU response",
        response: gruResult
      });
    }

    // ----------------------------------------
    // Get latest week
    // ----------------------------------------
    const lastWeek = snapshot.docs[0].data().week;
    const weekPart = lastWeek.split("-")[1];
    const docId = `${studentId}-${weekPart}`;

    // ----------------------------------------
    // Get previous GRU run to calculate trend
    // ----------------------------------------
    const prevSnapshot = await db
      .collection("student_gru_risk_history")
      .where("student_id", "==", studentId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let risk_trend = "STABLE";

    if (!prevSnapshot.empty) {

      const prevError = prevSnapshot.docs[0].data().reconstruction_error;

      if (reconstruction_error > prevError) {
        risk_trend = "INCREASING";
      } else if (reconstruction_error < prevError) {
        risk_trend = "DECREASING";
      } else {
        risk_trend = "STABLE";
      }
    }

    // ----------------------------------------
    // Prepare Firestore record
    // ----------------------------------------
    const record = {
      student_id: studentId,
      week: lastWeek,
      reconstruction_error: reconstruction_error,
      risk_level: risk_level,
      risk_trend: risk_trend,
      createdAt: new Date()
    };

    // ----------------------------------------
    // Save GRU result
    // ----------------------------------------
    await db
      .collection("student_gru_risk_history")
      .doc(docId)
      .set(record);

    return res.json({
      status: "GRU prediction saved",
      record
    });

  } catch (error) {

    console.error("GRU run error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};