const axios = require("axios");

// FastAPI ML server (local)
const ML_API_BASE = "http://localhost:8000";

/* -------------------------------------------------
   SINGLE STUDENT (SYNC – SAFE)
------------------------------------------------- */
exports.predictSingleStudent = async (studentId) => {
  const response = await axios.get(
    `${ML_API_BASE}/predict/${studentId}`,
    { timeout: 60000 } // 1 min is fine for single student
  );
  return response.data;
};

/* -------------------------------------------------
   ALL STUDENTS (SYNC – TESTING ONLY)
   ⚠️ DO NOT use from frontend / Firebase in prod
------------------------------------------------- */
exports.predictAllStudentsSync = async () => {
  const response = await axios.get(
    `${ML_API_BASE}/predict-all`,
    { timeout: 300000 } // 5 min (testing only)
  );
  return response.data;
};

/* -------------------------------------------------
   ALL STUDENTS (ASYNC – RECOMMENDED)
------------------------------------------------- */
exports.startPredictAllJob = async () => {
  const response = await axios.post(
    `${ML_API_BASE}/predict-all-start`
  );
  return response.data; // { job_id, status }
};

exports.getPredictAllJobResult = async (jobId) => {
  const response = await axios.get(
    `${ML_API_BASE}/predict-all-result/${jobId}`
  );
  return response.data;
};
