import React, { useState } from "react";
import { predictRecommendation } from "../services/api/recommendationApi";

export default function RecommendationDemo() {
  const [form, setForm] = useState({
    student_id: "",
    gpa: "",
    attendance_rate: "",
    stress_level: "",
    assignments_pending: "",
  });

  const [recommendations, setRecommendations] = useState([]);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRecommendation() {
    const data = {
      student_id: form.student_id,
      gpa: Number(form.gpa),
      attendance_rate: Number(form.attendance_rate),
      stress_level: Number(form.stress_level),
      assignments_pending: Number(form.assignments_pending),
    };

    const result = await predictRecommendation(data);
    setRecommendations(result.recommendations || []);
  }

  return (
    <div className="max-w-xl mx-auto p-5">
      <h1 className="text-3xl font-bold mb-4">Recommendation Engine</h1>

      <div className="flex flex-col gap-3">
        <input
          name="student_id"
          placeholder="Student ID"
          className="input"
          onChange={update}
        />

        <input
          name="gpa"
          placeholder="GPA"
          className="input"
          onChange={update}
        />

        <input
          name="attendance_rate"
          placeholder="Attendance (%)"
          className="input"
          onChange={update}
        />

        <input
          name="stress_level"
          placeholder="Stress Level (1-10)"
          className="input"
          onChange={update}
        />

        <input
          name="assignments_pending"
          placeholder="Assignments Pending"
          className="input"
          onChange={update}
        />
      </div>

      <button
        onClick={handleRecommendation}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
      >
        Get Recommendations
      </button>

      {recommendations.length > 0 && (
        <div className="mt-5 bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold">Recommendations:</h2>

          <ul className="list-disc ml-5 mt-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-gray-700">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
