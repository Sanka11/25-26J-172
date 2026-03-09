import axios from "axios";

const BASE_URL =
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export const getPeerCheerStudents = async () => {

  try {

    const res = await axios.get(`${BASE_URL}/ml/peer-cheer`);

    return res.data.data;

  } catch (error) {

    console.error("Peer cheer fetch error:", error);

    return [];

  }

};