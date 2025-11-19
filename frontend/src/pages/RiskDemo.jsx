import { useState } from "react";
import { predictRiskScore } from "../services/api/mlApi";

export default function RiskDemo() {
  const [form, setForm] = useState({
    student_id: "S001",
    gpa: 2.5,
    attendance_rate: 70,
    assignments_completed: 5,
  });

  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "gpa" ||
        name === "attendance_rate" ||
        name === "assignments_completed"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setScore(null);

    try {
      const result = await predictRiskScore(form);
      setScore(result.risk_score);
    } catch (err) {
      console.error(err);
      setError("Failed to get risk score. Check backend & ML services.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">
          AcademiGuard – Risk Demo
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Student ID</label>
            <input
              type="text"
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">GPA</label>
              <input
                type="number"
                step="0.01"
                name="gpa"
                value={form.gpa}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Attendance (%)
              </label>
              <input
                type="number"
                name="attendance_rate"
                value={form.attendance_rate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Assignments Completed
            </label>
            <input
              type="number"
              name="assignments_completed"
              value={form.assignments_completed}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 mt-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Calculating..." : "Predict Risk Score"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
        )}

        {score !== null && !error && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-sm text-slate-700">
              Predicted Risk Score:{" "}
              <span className="font-bold text-blue-700">{score}</span> / 100
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
