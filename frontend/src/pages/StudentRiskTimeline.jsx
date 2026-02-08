import { useEffect, useMemo, useState } from "react";
import { getStudentRiskHistory } from "../services/api/riskHistoryApi";
import { updateStudentMetrics } from "../services/api/realtimeRiskApi";
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
   Risk helpers
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
   Explanation engine (XAI)
----------------------------- */
const explainRisk = (metrics) => {
  const reasons = [];

  if (metrics.gpa !== undefined) {
    if (metrics.gpa < 2.5)
      reasons.push("Low GPA is contributing to higher academic risk.");
    if (metrics.gpa >= 3.0)
      reasons.push("Strong GPA helps reduce academic risk.");
  }

  if (metrics.attendance_rate !== undefined) {
    if (metrics.attendance_rate < 75)
      reasons.push("Low attendance indicates disengagement.");
  }

  if (metrics.assignments_completed !== undefined) {
    if (metrics.assignments_completed < 6)
      reasons.push("Incomplete assignments increase risk probability.");
  }

  if (!reasons.length) {
    reasons.push("Risk level is stable based on current academic indicators.");
  }

  return reasons;
};

/* -----------------------------
   Component
----------------------------- */

export default function StudentRiskTimeline({ studentId = "S1000" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -----------------------------
     Real-time form (NO autofill)
  ----------------------------- */
  const [form, setForm] = useState({
    gpa: "",
    attendance_rate: "",
    assignments_completed: "",
    semester: "",
  });

  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  /* -----------------------------
     Fetch timeline
  ----------------------------- */
  const fetchTimeline = () => {
    setLoading(true);
    setError("");

    getStudentRiskHistory(studentId)
      .then((res) => setData(res?.history || []))
      .catch(() => setError("Failed to load risk history"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTimeline();
  }, [studentId]);

  /* -----------------------------
     Derived data
  ----------------------------- */
  const latestSemester = useMemo(() => {
    if (!data.length) return null;
    return Math.max(...data.map((d) => d.semester));
  }, [data]);

  const explanations = explainRisk(form);

  /* -----------------------------
     Handlers
  ----------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value === "" ? "" : Number(value) }));
  };

  const handleRealtimeUpdate = async () => {
    setUpdating(true);
    setMessage("");

    try {
      await updateStudentMetrics({
        student_id: studentId,
        ...form,
      });

      setMessage("✅ Real-time ML update successful");
      fetchTimeline();
    } catch {
      setMessage("❌ Failed to send real-time update");
    } finally {
      setUpdating(false);
    }
  };

  /* -----------------------------
     States
  ----------------------------- */
  if (loading) return <div className="p-6">Loading risk timeline…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data.length)
    return <div className="p-6">No risk history available.</div>;

  /* -----------------------------
     UI
  ----------------------------- */
  return (
    <div className="space-y-6">
      {/* =============================
         REAL-TIME SIMULATION
      ============================== */}
      <div className="bg-white p-5 rounded-xl border shadow">
        <h3 className="text-lg font-semibold mb-3">
          Simulate Real-Time Academic Update
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="font-medium">GPA</label>
            <input
              name="gpa"
              type="number"
              step="0.1"
              value={form.gpa}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="font-medium">Attendance (%)</label>
            <input
              name="attendance_rate"
              type="number"
              value={form.attendance_rate}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="font-medium">Assignments Completed</label>
            <input
              name="assignments_completed"
              type="number"
              value={form.assignments_completed}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="font-medium">Semester</label>
            <input
              name="semester"
              type="number"
              value={form.semester}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>

        <button
          onClick={handleRealtimeUpdate}
          disabled={updating}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-semibold"
        >
          {updating ? "Updating…" : "Send Real-Time Update"}
        </button>

        {message && <p className="mt-2 text-xs">{message}</p>}
      </div>

      {/* =============================
         EXPLANATION PANEL (XAI)
      ============================== */}
      <div className="bg-slate-50 border rounded-xl p-4">
        <h4 className="font-semibold mb-2">Why did the risk change?</h4>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          {explanations.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>

      {/* =============================
         RISK TIMELINE
      ============================== */}
      <div className="bg-white p-6 rounded-xl border shadow">
        <h2 className="text-2xl font-semibold mb-4">Academic Risk Timeline</h2>

        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semester" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Line
                dataKey="risk_probability"
                stroke="#ef4444"
                strokeWidth={3}
                dot={({ cx, cy, payload }) =>
                  payload.semester === latestSemester ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={7}
                      fill="#ef4444"
                      stroke="#991b1b"
                      strokeWidth={3}
                    />
                  ) : (
                    <circle cx={cx} cy={cy} r={4} fill="#ef4444" />
                  )
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Semester cards */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {data.map((item) => {
            const risk = getRiskLevel(item.risk_probability);
            const isLatest = item.semester === latestSemester;

            return (
              <div
                key={item.semester}
                className={`border rounded-lg p-4 ${
                  isLatest ? "border-red-500 bg-red-50 shadow" : "bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm">Semester {item.semester}</p>
                  {isLatest && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                      Latest
                    </span>
                  )}
                </div>

                <p className={`text-lg font-semibold ${risk.color}`}>
                  {risk.label}
                </p>

                <p className="text-sm">
                  Probability: {item.risk_probability.toFixed(2)}
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
    </div>
  );
}
