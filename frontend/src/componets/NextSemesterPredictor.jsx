import { useState } from "react";
import { predictNextSemester } from "../services/api/mlApi";

const DEFAULTS = {
  Attendance_pct: 75,
  Midterm_Score: 60,
  Final_Score: 60,
  Assignments_Avg: 60,
  Quizzes_Avg: 60,
  Projects_Score: 60,
  Study_Hours_per_Week: 10,
  Stress_Level: 5,
  Sleep_Hours_per_Night: 7,
  Department: "CS",
  Extracurricular_Activities: "No",
  Family_Income_Level: "Middle",
};

const SLIDERS = [
  { key: "Attendance_pct", label: "Attendance %", min: 0, max: 100 },
  { key: "Midterm_Score", label: "Midterm Score", min: 0, max: 100 },
  { key: "Final_Score", label: "Final Score", min: 0, max: 100 },
  { key: "Assignments_Avg", label: "Assignments Avg", min: 0, max: 100 },
  { key: "Quizzes_Avg", label: "Quizzes Avg", min: 0, max: 100 },
  { key: "Projects_Score", label: "Projects Score", min: 0, max: 100 },
  { key: "Study_Hours_per_Week", label: "Study Hours/Week", min: 0, max: 40 },
  { key: "Stress_Level", label: "Stress Level (1-10)", min: 1, max: 10 },
  { key: "Sleep_Hours_per_Night", label: "Sleep Hours/Night", min: 0, max: 12 },
];

export default function NextSemesterPredictor() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handlePredict() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        ...form,
        Age: 21,
        Participation_Score: 60,
        Gender: "Male",
        Internet_Access_at_Home: "Yes",
        Parent_Education_Level: "Bachelor",
      };
      const data = await predictNextSemester(payload);
      setResult(data);
    } catch {
      setError("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const colorMap = {
    red: "text-red-600",
    amber: "text-amber-600",
    green: "text-green-600",
  };
  const bgMap = {
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {SLIDERS.map(({ key, label, min, max }) => (
          <div key={key}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{label}</span>
              <span className="font-semibold">{form[key]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={form[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: Number(e.target.value) })
              }
              className="w-full accent-blue-600"
            />
          </div>
        ))}
      </div>

      {/* Selects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-600 block mb-1">Department</label>
          <select
            value={form.Department}
            onChange={(e) => setForm({ ...form, Department: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {["CS", "IT", "SE", "DS", "CE"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">
            Extracurricular
          </label>
          <select
            value={form.Extracurricular_Activities}
            onChange={(e) =>
              setForm({ ...form, Extracurricular_Activities: e.target.value })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 block mb-1">
            Family Income
          </label>
          <select
            value={form.Family_Income_Level}
            onChange={(e) =>
              setForm({ ...form, Family_Income_Level: e.target.value })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {["Low", "Middle", "High"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? "Predicting..." : "Predict My Risk"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div
          className={`mt-4 p-4 rounded-xl border ${bgMap[result.risk_color]}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-2xl font-bold ${colorMap[result.risk_color]}`}
            >
              {result.risk_percentage}% Risk
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${colorMap[result.risk_color]} bg-white border`}
            >
              {result.risk_level}
            </span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            {result.explanation?.summary_text?.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span>•</span>
                {line}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3 italic">
            ⚠️ This is a simulation only. Results are not saved. For
            recommendations, refer to the Recommendation Module.
          </p>
        </div>
      )}
    </div>
  );
}
