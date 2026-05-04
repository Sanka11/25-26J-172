import axios from "axios";

const BASE =
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export const getStudentProfile = (studentId) =>
  axios.get(`${BASE}/students/${studentId}/profile`).then((r) => r.data);

export const getStudentRiskHistory = (studentId) =>
  axios
    .get(`${BASE}/students/${studentId}/risk-history`)
    .then((r) => r.data)
    .catch((err) => {
      if (err?.response?.status === 404) return { history: [] };
      throw err;
    });

export const updateStudentMarks = (studentId, payload) =>
  axios
    .post(`${BASE}/students/${studentId}/update-marks`, payload)
    .then((r) => r.data);

export const updateStudentLifestyle = (studentId, payload) =>
  axios
    .patch(`${BASE}/students/${studentId}/lifestyle`, payload)
    .then((r) => r.data);
