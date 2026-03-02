// src/services/api/disengagementApi.js

import axios from "axios";

// same pattern used in other api files
const BASE_URL =
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

/**
 * Run weekly disengagement test for ONE student
 * GET /test-weekly/:studentId
 */
export const runWeeklyTest = async (studentId) => {
  const response = await axios.get(
    `${BASE_URL}/test-weekly/${studentId}`
  );
  return response.data;
};

/**
 * Upload weekly CSV (batch processing)
 * POST /upload-weekly-csv
 */
export const uploadWeeklyCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${BASE_URL}/upload-weekly-csv`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};