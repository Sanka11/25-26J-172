import axios from "axios";

const BASE = import.meta.env.VITE_RISK_API_BASE;

/* -----------------------------------
   SINGLE STUDENT (UNCHANGED)
----------------------------------- */
export const getRiskById = async (studentId) => {
  const res = await axios.get(
    `${BASE}/api/risk/${studentId}`
  );
  return res.data;
};

/* -----------------------------------
   ALL STUDENTS – SYNC (OLD, TESTING)
   ⚠️ Can timeout – keep for debug only
----------------------------------- */
export const getAllRisks = async () => {
  const res = await axios.get(
    `${BASE}/api/risk/all-sync`
  );
  return res.data;
};

/* -----------------------------------
   ALL STUDENTS – ASYNC (NEW, SAFE)
----------------------------------- */

// Start async job
export const startAllRisksJob = async () => {
  const res = await axios.get(
    `${BASE}/api/risk/all`
  );
  return res.data; // { job_id, status }
};

// Fetch async job result
export const getAllRisksJobResult = async (jobId) => {
  const res = await axios.get(
    `${BASE}/api/risk/all/result/${jobId}`
  );
  return res.data;
};
