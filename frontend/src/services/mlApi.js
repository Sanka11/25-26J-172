import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export const mlApi = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});