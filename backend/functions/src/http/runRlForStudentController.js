const admin = require("../firebase");
const fetch = require("node-fetch");

exports.runRlForStudent = async (req, res) => {

  try {

    const db = admin.firestore();
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({
        error: "studentId required"
      });
    }

    // --------------------------------------------------
    // 1️⃣ Get last 10 weeks activity
    // --------------------------------------------------
    const weeklySnapshot = await db
      .collection("student_weekly_records")
      .where("student_id", "==", studentId)
      .orderBy("week", "desc")
      .limit(10)
      .get();

    if (weeklySnapshot.size < 10) {
      return res.status(400).json({
        error: "Need 10 weeks of data"
      });
    }

    const weeks = [];

    weeklySnapshot.forEach(doc => {

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

    // --------------------------------------------------
    // 2️⃣ Get latest GRU result
    // --------------------------------------------------
    const gruSnapshot = await db
      .collection("student_gru_risk_history")
      .where("student_id", "==", studentId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (gruSnapshot.empty) {
      return res.status(400).json({
        error: "No GRU result found"
      });
    }

    const gruData = gruSnapshot.docs[0].data();

    const risk_trend = gruData.risk_trend;
    const risk_level = gruData.risk_level;
    const week = gruData.week;

    // --------------------------------------------------
    // 3️⃣ Get previous RL record
    // --------------------------------------------------
    const rlSnapshot = await db
      .collection("student_rl_intervention_history")
      .where("student_id", "==", studentId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let last_action = "SOFT_NUDGE";
    let no_response_streak = 0;
    let fatigue_level = 0;

    if (!rlSnapshot.empty) {

      const prev = rlSnapshot.docs[0].data();

      last_action = prev.action || "SOFT_NUDGE";
      no_response_streak = prev.no_response_streak || 0;
      fatigue_level = prev.fatigue_level || 0;

      if (risk_trend === "INCREASING") {
        no_response_streak += 1;
      }

      if (risk_trend === "DECREASING") {
        no_response_streak = 0;
      }

      if (last_action === "REMINDER" || last_action === "PEER_CHEER") {
        fatigue_level += 1;
      }

      if (last_action === "HUMAN_ESCALATION") {
        fatigue_level = 0;
      }

    }

    // --------------------------------------------------
    // 4️⃣ Build RL input
    // --------------------------------------------------
    const rlInput = {
      last_10_weeks: weeks,
      risk_trend: risk_trend,
      last_action: last_action,
      no_response_streak: no_response_streak,
      fatigue_level: fatigue_level
    };

    console.log("RL INPUT:", rlInput);

    // --------------------------------------------------
    // 5️⃣ Call ML API
    // --------------------------------------------------
    const response = await fetch(
      "http://127.0.0.1:8000/disengagement/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rlInput)
      }
    );

    const result = await response.json();

    console.log("ML OUTPUT:", result);

    // --------------------------------------------------
    // 6️⃣ Save RL result
    // --------------------------------------------------
    const weekPart = week.split("-")[1];
    const docId = `${studentId}-${weekPart}`;

    const record = {

      student_id: studentId,
      week: week,

      risk_level: result.risk_level,
      risk_trend: result.risk_trend,

      action: result.recommended_action,
      decision_reason: result.decision_reason,

      last_action: last_action,
      no_response_streak: no_response_streak,
      fatigue_level: fatigue_level,

      createdAt: new Date()

    };

    await db
      .collection("student_rl_intervention_history")
      .doc(docId)
      .set(record);

    return res.json({
      status: "RL decision saved",
      record
    });

  } catch (error) {

    console.error("RL ERROR:", error);

    res.status(500).json({
      error: error.message
    });

  }

};