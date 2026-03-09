import axios from "axios";

const BASE_URL =
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export const getGruHistory = async (studentId = null) => {
  try {
    const url = studentId
      ? `${BASE_URL}/ml/gru-risk-history/${studentId}`
      : `${BASE_URL}/ml/gru-risk-history`;

    const res = await axios.get(url);

    return res.data.data;
  } catch (error) {
    console.error("GRU history fetch error:", error);
    return [];
  }
};