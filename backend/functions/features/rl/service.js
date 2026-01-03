const axios = require("axios");

// RL FastAPI base URL
const RL_BASE_URL = "http://127.0.0.1:8000";

exports.getRLDecision = async (studentId) => {
  const response = await axios.get(
    `${RL_BASE_URL}/rl/decide/${studentId}`
  );
  return response.data;
};
