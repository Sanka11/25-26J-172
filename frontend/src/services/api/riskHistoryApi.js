import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const getStudentRiskHistory = async (studentId) => {
  const res = await axios.get(`${API}/api/students/${studentId}/risk-history`);
  return res.data;
};
