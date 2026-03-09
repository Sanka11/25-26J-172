import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getStudentRiskExplanation,
  getStudentRiskHistory,
} from "../services/api/mlApi";
import NextSemesterPredictor from "../componets/NextSemesterPredictor";

// ── Risk Gauge (SVG circle) ──
function RiskGauge({ percentage, color }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const colorMap = { red: "#ef4444", amber: "#f59e0b", green: "#22c55e" };
  const stroke = colorMap[color] || "#6b7280";
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="16"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="-mt-32 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: stroke }}>
          {percentage}%
        </span>
        <span className="text-sm text-gray-500 mt-1">Risk Score</span>
      </div>
      <div className="mt-28" />
    </div>
  );
}

// ── SHAP Bar Chart ──
function SHAPChart({ factors, title, colorClass }) {
  if (!factors || factors.length === 0) return null;
  const max = Math.max(...factors.map((f) => Math.abs(f.impact)));
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-600 mb-2">{title}</h4>
      {factors.map((f, i) => (
        <div key={i} className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{f.display_name}</span>
            <span>{(Math.abs(f.impact) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${colorClass}`}
              style={{
                width: `${(Math.abs(f.impact) / max) * 100}%`,
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Risk Line Chart (pure SVG, no library needed) ──
function RiskLineChart({ history }) {
  if (!history || history.length === 0) return null;

  const W = 600,
    H = 200;
  const PAD = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = history.filter((h) => h.risk_percentage !== null);
  if (points.length === 0) return null;

  const xStep = chartW / Math.max(points.length - 1, 1);
  const yScale = (val) => chartH - (val / 100) * chartH;

  const pathD = points
    .map((p, i) => {
      const x = PAD.left + i * xStep;
      const y = PAD.top + yScale(p.risk_percentage);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Area fill
  const areaD =
    pathD +
    ` L ${PAD.left + (points.length - 1) * xStep} ${PAD.top + chartH}` +
    ` L ${PAD.left} ${PAD.top + chartH} Z`;

  const getRiskColor = (pct) =>
    pct >= 70 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#22c55e";

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 300 }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + yScale(v)}
              y2={PAD.top + yScale(v)}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 8}
              y={PAD.top + yScale(v) + 4}
              fontSize="10"
              fill="#94a3b8"
              textAnchor="end"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Risk zone backgrounds */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={chartW}
          height={yScale(40) - yScale(100)}
          fill="#fef2f2"
          opacity="0.4"
        />
        <rect
          x={PAD.left}
          y={PAD.top + yScale(70)}
          width={chartW}
          height={yScale(40) - yScale(70)}
          fill="#fffbeb"
          opacity="0.4"
        />
        <rect
          x={PAD.left}
          y={PAD.top + yScale(40)}
          width={chartW}
          height={yScale(0) - yScale(40)}
          fill="#f0fdf4"
          opacity="0.4"
        />

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => {
          const x = PAD.left + i * xStep;
          const y = PAD.top + yScale(p.risk_percentage);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={getRiskColor(p.risk_percentage)}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={x}
                y={y - 10}
                fontSize="10"
                fill="#475569"
                textAnchor="middle"
                fontWeight="600"
              >
                {p.risk_percentage}%
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={PAD.left + i * xStep}
            y={H - 8}
            fontSize="10"
            fill="#64748b"
            textAnchor="middle"
          >
            {p.year} {p.semester === "Semester 1" ? "S1" : "S2"}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Semester Card ──
function SemesterCard({ entry, isCurrent }) {
  const colorMap = {
    High: {
      bg: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-700",
      bar: "bg-red-400",
    },
    Medium: {
      bg: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
    },
    Low: {
      bg: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-700",
      bar: "bg-green-400",
    },
  };
  const c = colorMap[entry.risk_level] || colorMap["Low"];
  const pct = entry.risk_percentage ?? 0;

  return (
    <div
      className={`rounded-xl border p-4 ${c.bg} ${isCurrent ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {entry.semester}
          </span>
          {isCurrent && (
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              Current
            </span>
          )}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${c.badge}`}
        >
          {entry.risk_level} Risk
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${c.bar}`}
            style={{ width: `${pct}%`, transition: "width 1s ease" }}
          />
        </div>
        <span className="text-lg font-bold text-gray-700">{pct}%</span>
      </div>
      {entry.explanation?.summary_text?.[0] && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {entry.explanation.summary_text[0]}
        </p>
      )}
    </div>
  );
}

// ── Past Year Accordion ──
function PastYearAccordion({ year, semesters }) {
  const [open, setOpen] = useState(false);
  const avgRisk =
    semesters.reduce((s, e) => s + (e.risk_percentage ?? 0), 0) /
    semesters.length;
  const trend =
    semesters.length >= 2
      ? semesters[1].risk_percentage - semesters[0].risk_percentage
      : 0;

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-700">{year}</span>
          <span className="text-xs text-gray-400">
            Avg Risk: {avgRisk.toFixed(0)}%
          </span>
          {trend !== 0 && (
            <span
              className={`text-xs font-semibold ${trend > 0 ? "text-red-500" : "text-green-500"}`}
            >
              {trend > 0 ? `↑ +${trend.toFixed(0)}%` : `↓ ${trend.toFixed(0)}%`}{" "}
              S1→S2
            </span>
          )}
        </div>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {semesters.map((s) => (
            <SemesterCard key={s.semester_key} entry={s} isCurrent={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──
export default function StudentRiskDashboard() {
  const { currentUser, userData } = useAuth();
  const studentId = userData?.student_id || userData?.studentId || "S1000";

  const [riskData, setRiskData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPredictor, setShowPredictor] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // "current" | "history"

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [risk, history] = await Promise.allSettled([
          getStudentRiskExplanation(studentId),
          getStudentRiskHistory(studentId),
        ]);

        if (risk.status === "fulfilled") setRiskData(risk.value);
        else if (risk.reason?.response?.status === 404) setError("no_data");
        else setError("failed");

        if (history.status === "fulfilled") setHistoryData(history.value);
      } catch (err) {
        setError("failed");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your risk profile...</p>
        </div>
      </div>
    );
  }

  if (error === "no_data") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10 max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            No Risk Data Yet
          </h2>
          <p className="text-gray-500 text-sm">
            Your risk prediction hasn't been generated yet. Please contact your
            lecturer.
          </p>
        </div>
      </div>
    );
  }

  if (error === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-sm">
            Unable to load risk data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const { risk_percentage, risk_level, risk_color, explanation } = riskData;

  const colorBg = {
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
  };
  const colorText = {
    red: "text-red-700",
    amber: "text-amber-700",
    green: "text-green-700",
  };
  const colorBadge = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
  };

  // History data
  const currentYear = historyData?.current_year;
  const pastYears = historyData?.past_years || [];
  const grouped = historyData?.grouped || {};
  const currentYearSemesters = currentYear ? grouped[currentYear] || [] : [];
  const allHistory = historyData?.history || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Risk Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Based on your academic performance and engagement data.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl shadow p-1 w-fit">
          {[
            { key: "current", label: "📊 Current" },
            { key: "history", label: "📈 History" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CURRENT TAB ── */}
        {activeTab === "current" && (
          <>
            {/* Main Risk Card */}
            <div
              className={`bg-white rounded-2xl shadow border p-6 mb-6 ${colorBg[risk_color]}`}
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <RiskGauge percentage={risk_percentage} color={risk_color} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${colorBadge[risk_color]}`}
                    >
                      {risk_level} Risk
                    </span>
                    {riskData.semester && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {riskData.year} · {riskData.semester}
                      </span>
                    )}
                  </div>
                  <h2
                    className={`text-2xl font-bold mb-3 ${colorText[risk_color]}`}
                  >
                    {risk_level === "High" && "Immediate attention needed"}
                    {risk_level === "Medium" && "Monitor your progress"}
                    {risk_level === "Low" && "You are on track!"}
                  </h2>
                  <ul className="space-y-1">
                    {explanation?.summary_text?.map((line, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="mt-1">•</span> {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Year Semesters */}
            {currentYearSemesters.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  📅 {currentYear} — Academic Year Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentYearSemesters.map((s) => (
                    <SemesterCard
                      key={s.semester_key}
                      entry={s}
                      isCurrent={
                        s.semester === riskData.semester &&
                        s.year === riskData.year
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* SHAP Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  ⚠️ Risk Factors
                </h3>
                <SHAPChart
                  factors={explanation?.risk_factors}
                  title="These are increasing your risk"
                  colorClass="bg-red-400"
                />
              </div>
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  🛡️ Protective Factors
                </h3>
                <SHAPChart
                  factors={explanation?.protective_factors}
                  title="These are reducing your risk"
                  colorClass="bg-green-400"
                />
              </div>
            </div>

            {/* Recommendation note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
              💡 For personalised recommendations based on your risk profile,
              refer to the <strong>Recommendation Module</strong>.
            </div>

            {/* What If Predictor */}
            <div className="bg-white rounded-2xl shadow p-6">
              <button
                onClick={() => setShowPredictor(!showPredictor)}
                className="w-full flex justify-between items-center text-left"
              >
                <div>
                  <h3 className="font-semibold text-gray-700">
                    🔮 What If Next Semester?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Simulate how changes to your habits could affect your risk
                    score.
                  </p>
                </div>
                <span className="text-gray-400 text-xl">
                  {showPredictor ? "▲" : "▼"}
                </span>
              </button>
              {showPredictor && (
                <div className="mt-4 border-t pt-4">
                  <NextSemesterPredictor />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <>
            {allHistory.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p>No historical data available yet.</p>
                <p className="text-sm mt-1">
                  Data will appear here after your first semester marks are
                  recorded.
                </p>
              </div>
            ) : (
              <>
                {/* Risk Trend Line Chart */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-1">
                    📈 Risk Trend Over Time
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Your academic risk journey across all semesters
                  </p>

                  {/* Legend */}
                  <div className="flex gap-4 mb-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />{" "}
                      High Risk (≥70%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />{" "}
                      Medium (40–69%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />{" "}
                      Low (&lt;40%)
                    </span>
                  </div>

                  <RiskLineChart history={allHistory} />
                </div>

                {/* Current Year */}
                {currentYear && currentYearSemesters.length > 0 && (
                  <div className="bg-white rounded-2xl shadow p-6 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="font-semibold text-gray-700">
                        📅 {currentYear} — Current Year
                      </h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentYearSemesters.map((s) => (
                        <SemesterCard
                          key={s.semester_key}
                          entry={s}
                          isCurrent={
                            s.semester === riskData.semester &&
                            s.year === riskData.year
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Years */}
                {pastYears.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-600 mb-3 text-sm uppercase tracking-wide">
                      Past Years
                    </h3>
                    <div className="space-y-3">
                      {pastYears.map((year) => (
                        <PastYearAccordion
                          key={year}
                          year={year}
                          semesters={grouped[year] || []}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
