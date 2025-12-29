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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Student Risk Prediction
        </h2>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Simulate how AcademiGuard estimates academic risk using attainment,
          attendance, and engagement data. This is a simple demo model – not
          production analytics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)] items-start">
        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GPA
              </label>
              <input
                type="number"
                step="0.01"
                name="gpa"
                value={form.gpa}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance (%)
              </label>
              <input
                type="number"
                name="attendance_rate"
                value={form.attendance_rate}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignments Completed
              </label>
              <input
                type="number"
                name="assignments_completed"
                value={form.assignments_completed}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSubmit}
          >
            {loading ? "Calculating…" : "Predict risk score"}
          </button>
        </div>

        {/* Result / explanation card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3 text-sm text-slate-700">
          <p className="text-xs font-semibold text-slate-800">
            Prediction output
          </p>
          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {score !== null && !error && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-sm text-slate-800">
                Predicted risk score:{" "}
                <span className="font-semibold text-blue-700">{score}</span> /
                100
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                Higher scores indicate a higher likelihood of academic risk
                based on this simple model.
              </p>
            </div>
          )}
          {score === null && !error && (
            <p className="text-[11px] text-slate-500">
              Run a prediction to see how the demo model responds for different
              student profiles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
