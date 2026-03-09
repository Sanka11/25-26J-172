import axios from "axios";

const BASE_URL =
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export const getHumanEscalations = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/ml/human-escalations`);
    return res.data.data;
  } catch (error) {
    console.error("Human escalation fetch error:", error);
    return [];
  }
};