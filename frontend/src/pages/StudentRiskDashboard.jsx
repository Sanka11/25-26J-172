import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getStudentRiskExplanation,
  predictRiskShap,
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

export default function StudentRiskDashboard() {
  const { currentUser, userData } = useAuth();
  const studentId = userData?.student_id || userData?.studentId || "S1000";

  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPredictor, setShowPredictor] = useState(false);

  useEffect(() => {
    async function fetchRisk() {
      try {
        setLoading(true);
        const data = await getStudentRiskExplanation(studentId);
        setRiskData(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("no_data");
        } else {
          setError("failed");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRisk();
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
          💡 For personalised recommendations based on your risk profile, refer
          to the <strong>Recommendation Module</strong>.
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
      </div>
    </div>
  );
}
