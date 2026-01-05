import { useEffect, useState } from "react";
import { getStudentRiskHistory } from "../services/api/riskHistoryApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* -----------------------------
   Helpers
----------------------------- */

const getRiskLevel = (p) => {
  if (p < 0.4) return { label: "Low Risk", color: "text-green-600" };
  if (p < 0.7) return { label: "Medium Risk", color: "text-yellow-600" };
  return { label: "High Risk", color: "text-red-600" };
};

const trendBadge = (trend) => {
  if (trend === "Increasing Risk") return "bg-red-100 text-red-700";
  if (trend === "Decreasing Risk") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
};

/* -----------------------------
   Component
----------------------------- */

export default function StudentRiskTimeline({ studentId = "S1000" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    getStudentRiskHistory(studentId)
      .then((res) => {
        setData(res?.history || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load risk history.");
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  /* -----------------------------
     States
  ----------------------------- */

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-600">
        Loading academic risk timeline…
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!data.length) {
    return (
      <div className="p-6 text-sm text-slate-600">
        No risk history available for this student.
      </div>
    );
  }

  /* -----------------------------
     UI
  ----------------------------- */

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">
        Academic Risk Timeline
      </h2>

      <p className="text-sm text-slate-600 mb-6 max-w-2xl">
        This timeline visualizes how the student’s academic risk changes across
        semesters. Risk predictions are generated using performance, attendance,
        and behavioral indicators to support early academic intervention.
      </p>

      {/* ---------------- Chart ---------------- */}
      <div className="w-full h-72">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="semester"
              label={{
                value: "Semester",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              domain={[0, 1]}
              label={{
                value: "Risk Probability",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="risk_probability"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ---------------- Semester Cards ---------------- */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((item) => {
          const risk = getRiskLevel(item.risk_probability);

          return (
            <div
              key={`${item.student_id}-${item.semester}`}
              className="border rounded-lg p-4 bg-slate-50"
            >
              <p className="text-sm text-slate-600">Semester {item.semester}</p>

              <p className={`text-lg font-semibold ${risk.color}`}>
                {risk.label}
              </p>

              <p className="text-sm mt-1">
                Probability:{" "}
                <span className="font-medium">
                  {item.risk_probability.toFixed(2)}
                </span>
              </p>

              <span
                className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${trendBadge(
                  item.risk_trend
                )}`}
              >
                {item.risk_trend}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
