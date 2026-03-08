import { useEffect, useState } from "react";
import { appConfig } from "../config/env";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const RISK_COLORS = { High: "#EF4444", Medium: "#F59E0B", Low: "#22C55E" };
const PIE_COLORS = ["#EF4444", "#F59E0B", "#22C55E"];

export default function XAIAdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const r = await fetch(appConfig.GET_BULK_RISK_URL);
      const data = await r.json();
      setStudents(data.students || []);
    } catch (e) {
      setError("Failed to load student data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = students.length;
  const high = students.filter((s) => s.risk_level === "High").length;
  const medium = students.filter((s) => s.risk_level === "Medium").length;
  const low = students.filter((s) => s.risk_level === "Low").length;
  const avgRisk = total
    ? Math.round(
        students.reduce(
          (acc, s) => acc + (s.risk_percentage || s.risk_score * 100 || 0),
          0,
        ) / total,
      )
    : 0;

  // ── SHAP top factors ───────────────────────────────────────────────────────
  const shapCounts = {};
  students.forEach((s) => {
    const factors = s.explanation?.risk_factors || [];
    factors.forEach((f) => {
      const name = f.display_name || f.feature;
      shapCounts[name] = (shapCounts[name] || 0) + 1;
    });
  });
  const topFactors = Object.entries(shapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // ── Chart data ─────────────────────────────────────────────────────────────
  const pieData = [
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ].filter((d) => d.value > 0);

  // ── Filtered table ─────────────────────────────────────────────────────────
  const filtered = students
    .filter((s) => filter === "All" || s.risk_level === filter)
    .filter((s) => s.student_id?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading risk data...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-red-500">
          <p className="text-xl font-bold">⚠️ {error}</p>
          <button
            onClick={fetchAllStudents}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 px-8 py-10">
        <motion.div {...fadeUp(0)}>
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-1">
            XAI Component · Admin View
          </p>
          <h1 className="text-3xl font-black text-white">
            Student Risk Overview
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Hybrid Ensemble Model (RF + XGBoost + LightGBM) · SHAP
            Explainability · {total} Students
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              label: "Total Students",
              value: total,
              color: "border-slate-200 bg-white",
              text: "text-slate-800",
            },
            {
              label: "High Risk",
              value: high,
              color: "border-red-200 bg-red-50",
              text: "text-red-600",
            },
            {
              label: "Medium Risk",
              value: medium,
              color: "border-amber-200 bg-amber-50",
              text: "text-amber-600",
            },
            {
              label: "Low Risk",
              value: low,
              color: "border-green-200 bg-green-50",
              text: "text-green-600",
            },
            {
              label: "Avg Risk %",
              value: `${avgRisk}%`,
              color: "border-blue-200 bg-blue-50",
              text: "text-blue-600",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              {...fadeUp(i * 0.07)}
              className={`rounded-2xl border p-5 ${s.color}`}
            >
              <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            {...fadeUp(0.2)}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <h2 className="text-base font-bold text-slate-800 mb-4">
              Risk Distribution
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top SHAP Factors */}
          <motion.div
            {...fadeUp(0.3)}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <h2 className="text-base font-bold text-slate-800 mb-4">
              Top Risk Factors (SHAP)
            </h2>
            {topFactors.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topFactors} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm mt-8 text-center">
                No SHAP data available
              </p>
            )}
          </motion.div>
        </div>

        {/* ── Model Info Banner ── */}
        <motion.div
          {...fadeUp(0.3)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-wrap gap-6 items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              Hybrid Ensemble Model
            </p>
            <p className="text-xl font-black mt-1">
              RandomForest + XGBoost + LightGBM
            </p>
          </div>
          {[
            { label: "Accuracy", value: "97.8%" },
            { label: "ROC-AUC", value: "99.64%" },
            { label: "CV AUC", value: "99.49%" },
            { label: "Features", value: "17" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Student Table ── */}
        <motion.div
          {...fadeUp(0.4)}
          className="bg-white rounded-2xl border border-slate-200"
        >
          <div className="p-6 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">All Students</h2>
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <input
                type="text"
                placeholder="Search student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {/* Filter */}
              <div className="flex gap-2">
                {["All", "High", "Medium", "Low"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === f
                        ? f === "High"
                          ? "bg-red-500 text-white"
                          : f === "Medium"
                            ? "bg-amber-500 text-white"
                            : f === "Low"
                              ? "bg-green-500 text-white"
                              : "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* Refresh */}
              <button
                onClick={fetchAllStudents}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Student ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Risk Level
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Risk Score
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Top Risk Factor
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Model
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const topFactor = s.explanation?.risk_factors?.[0];
                  const pct =
                    s.risk_percentage ?? Math.round((s.risk_score || 0) * 100);
                  return (
                    <tr
                      key={s.student_id}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {s.student_id}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            s.risk_level === "High"
                              ? "bg-red-100 text-red-700"
                              : s.risk_level === "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {s.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  RISK_COLORS[s.risk_level] || "#94a3b8",
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {topFactor
                          ? topFactor.display_name || topFactor.feature
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {s.model_version || s.model_info?.model_name || "—"}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {total} students
          </div>
        </motion.div>
      </div>
    </div>
  );
}
