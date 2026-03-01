const { getStudentWeeklyActivity } = require("../src/ml/studentWeeklyReader");
const fetch = require("node-fetch");

const ML_BASE_URL = "http://127.0.0.1:8000";

async function callDisengagementML(payload) {
  const res = await fetch(`${ML_BASE_URL}/disengagement/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service error: ${text}`);
  }

  return res.json();
}

async function runTest() {
  try {
    // 1️⃣ Fetch weekly data from Firestore
    const weeks = await getStudentWeeklyActivity("S001", 10);

    console.log("Fetched weeks count:", weeks.length);

    // 2️⃣ Build ML payload
    const mlPayload = {
      last_10_weeks: weeks.map(w => ({
        login_freq: w.login_freq,
        session_duration: w.session_duration,
        inactivity_days: w.inactivity_days,
        assignment_completion: w.assignment_completion,
        quiz_score: w.quiz_score,
        forum_posts: w.forum_posts,
        video_watch_ratio: w.video_watch_ratio,
        late_submissions: w.late_submissions,
        alert_interactions: w.alert_interactions,
        help_requests: w.help_requests,
      })),
      last_action: "DO_NOTHING",
      no_response_streak: 0,
      fatigue_level: 0,
      risk_trend: "STABLE",
    };

    // 3️⃣ Call FastAPI ML service
    const mlResult = await callDisengagementML(mlPayload);

    console.log("ML RESULT:");
    console.log(JSON.stringify(mlResult, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

runTest();