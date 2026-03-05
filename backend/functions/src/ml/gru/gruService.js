// src/ml/gru/gruService.js

const axios = require("axios");

// ML-service base URL (local)
const ML_BASE_URL = "http://127.0.0.1:8000";

/**
 * Call GRU-only endpoint in ML-service
 */
async function callGruOnly(last10Weeks) {
  const payload = {
    last_10_weeks: last10Weeks.map(w => ({
      login_count: w.login_count,
      avg_session_duration_min: w.avg_session_duration_min,
      total_active_time_min: w.total_active_time_min,
      days_since_last_login: w.days_since_last_login,
      page_views: w.page_views,
      assignments_submitted: w.assignments_submitted,
      on_time_submissions: w.on_time_submissions,
      late_submissions: w.late_submissions,
      alerts_responded: w.alerts_responded,
      response_rate: w.response_rate
    }))
  };

  const res = await axios.post(
    `${ML_BASE_URL}/disengagement/gru-only`,
    payload,
    { timeout: 10000 }
  );

  return res.data;
}

module.exports = { callGruOnly };