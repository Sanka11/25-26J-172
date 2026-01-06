import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const updateStudentMetrics = async (payload) => {
  const res = await axios.post(
    `${API_URL}/api/student/update-metrics`,
    payload
  );
  return res.data;
};
