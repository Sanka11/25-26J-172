import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const BASE_URL = "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export default function StudentBehaviourDemo() {
  const [studentId, setStudentId] = useState("");
  const [studentIdError, setStudentIdError] = useState("");
  const [pattern, setPattern] = useState("LOW");
  const [result, setResult] = useState(null);
  const [weeksData, setWeeksData] = useState([]);
  const [activeTab, setActiveTab] = useState("input");
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [showRawJson, setShowRawJson] = useState(false);

  const [formData, setFormData] = useState({
    login_count: 0,
    avg_session_duration_min: 0,
    total_active_time_min: 0,
    days_since_last_login: 0,
    page_views: 0,
    assignments_submitted: 0,
    on_time_submissions: 0,
    late_submissions: 0,
    alerts_responded: 0,
    response_rate: 0,
  });

  /* =========================
     FIELD CONFIGURATION
  ========================= */

  const fieldConfig = {
    login_count: { label: "Login Count", description: "Weekly LMS logins", color: "blue", icon: "🔑", unit: "logins" },
    avg_session_duration_min: { label: "Avg Session Duration", description: "minutes", color: "green", icon: "⏱️", unit: "min" },
    total_active_time_min: { label: "Total Active Time", description: "minutes", color: "purple", icon: "⌛", unit: "min" },
    days_since_last_login: { label: "Days Since Last Login", description: "days inactive", color: "red", icon: "📅", unit: "days" },
    page_views: { label: "Page Views", description: "LMS navigation", color: "yellow", icon: "📄", unit: "views" },
    assignments_submitted: { label: "Assignments Submitted", description: "total", color: "indigo", icon: "📚", unit: "assignments" },
    on_time_submissions: { label: "On-Time Submissions", description: "completed on time", color: "emerald", icon: "✅", unit: "submissions" },
    late_submissions: { label: "Late Submissions", description: "submitted late", color: "orange", icon: "⚠️", unit: "submissions" },
    alerts_responded: { label: "Alerts Responded", description: "responses to alerts", color: "teal", icon: "🔔", unit: "responses" },
    response_rate: { label: "Response Rate", description: "0-1 scale", color: "cyan", icon: "📊", unit: "%" }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      red: "bg-red-50 border-red-200 text-red-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      teal: "bg-teal-50 border-teal-200 text-teal-700",
      cyan: "bg-cyan-50 border-cyan-200 text-cyan-700"
    };
    return colors[color] || colors.blue;
  };

  const rand = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  /* =========================
     STUDENT ID VALIDATION
  ========================= */

  const validateStudentId = (id) => {
    const pattern = /^\d{4}$/;
    return pattern.test(id);
  };

  const handleStudentIdChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setStudentId(value);
    
    if (value && !validateStudentId(value)) {
      setStudentIdError("Student ID must be exactly 4 digits");
    } else {
      setStudentIdError("");
    }
  };

  /* =========================
     RISK PATTERN GENERATORS
  ========================= */

  const generateLowRiskWeek = () => ({
    login_count: rand(9, 13),
    avg_session_duration_min: rand(42, 55),
    total_active_time_min: rand(380, 620),
    days_since_last_login: rand(0, 1),
    page_views: rand(48, 65),
    assignments_submitted: rand(2, 4),
    on_time_submissions: rand(2, 4),
    late_submissions: 0,
    alerts_responded: 1,
    response_rate: 1
  });

  const generateHighRiskWeek = () => ({
    login_count: rand(0, 3),
    avg_session_duration_min: rand(2, 10),
    total_active_time_min: rand(10, 80),
    days_since_last_login: rand(5, 12),
    page_views: rand(1, 10),
    assignments_submitted: 0,
    on_time_submissions: 0,
    late_submissions: rand(1, 2),
    alerts_responded: 0,
    response_rate: 0
  });

  const generatePattern = (type) => {
    const data = type === "LOW" ? generateLowRiskWeek() : generateHighRiskWeek();
    setFormData(data);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: Number(e.target.value),
    });
  };

  /* =========================
     API CALLS
  ========================= */

  const addWeek = async () => {
    if (!validateStudentId(studentId)) {
      setStudentIdError("Valid 4-digit Student ID required");
      return;
    }
    
    setLoading(true);
    setLastAction("addWeek");
    try {
      const res = await fetch(`${BASE_URL}/student/add-week`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, ...formData }),
      });
      const data = await res.json();
      setResult({
        type: "addWeek",
        data: data,
        formData: formData,
        message: "Week added successfully!",
        timestamp: new Date().toISOString()
      });
      setActiveTab("results");
    } catch (error) {
      setResult({
        type: "error",
        message: "Failed to add week",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const add10Weeks = async () => {
    if (!validateStudentId(studentId)) {
      setStudentIdError("Valid 4-digit Student ID required");
      return;
    }
    
    setLoading(true);
    setLastAction("add10Weeks");
    const weeks = [];
    for (let i = 0; i < 10; i++) {
      weeks.push(pattern === "LOW" ? generateLowRiskWeek() : generateHighRiskWeek());
    }
    try {
      const res = await fetch(`${BASE_URL}/student/add-10-weeks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, weeks }),
      });
      const data = await res.json();
      setResult({
        type: "add10Weeks",
        data: data,
        weeks: weeks,
        message: "10 weeks generated successfully!",
        pattern: pattern,
        timestamp: new Date().toISOString()
      });
      setActiveTab("results");
    } catch (error) {
      setResult({
        type: "error",
        message: "Failed to generate weeks",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getLast10Weeks = async () => {
    if (!validateStudentId(studentId)) {
      setStudentIdError("Valid 4-digit Student ID required");
      return;
    }
    
    setLoading(true);
    setLastAction("getLast10Weeks");
    try {
      const res = await fetch(`${BASE_URL}/test-gru-reader/${studentId}`);
      const data = await res.json();
      if (data.weeks) {
        const formattedWeeks = data.weeks.map((week, index) => ({
          week: `Week ${index + 1}`,
          ...week
        }));
        setWeeksData(formattedWeeks);
      }
      setResult({
        type: "getLast10Weeks",
        data: data,
        weeks: data.weeks || [],
        message: "Retrieved last 10 weeks successfully!",
        timestamp: new Date().toISOString()
      });
      setActiveTab("results");
    } catch (error) {
      setResult({
        type: "error",
        message: "Failed to retrieve weeks",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runGru = async () => {
    if (!validateStudentId(studentId)) {
      setStudentIdError("Valid 4-digit Student ID required");
      return;
    }
    
    setLoading(true);
    setLastAction("runGru");
    try {
      const res = await fetch(`${BASE_URL}/gru/run/${studentId}`);
      const data = await res.json();
      setResult({
        type: "runGru",
        data: data,
        message: "GRU model executed successfully!",
        timestamp: new Date().toISOString()
      });
      setActiveTab("results");
    } catch (error) {
      setResult({
        type: "error",
        message: "Failed to run GRU model",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runRl = async () => {
    if (!validateStudentId(studentId)) {
      setStudentIdError("Valid 4-digit Student ID required");
      return;
    }
    
    setLoading(true);
    setLastAction("runRl");
    try {
      const res = await fetch(`${BASE_URL}/rl/run/${studentId}`);
      const data = await res.json();
      setResult({
        type: "runRl",
        data: data,
        message: "RL model executed successfully!",
        timestamp: new Date().toISOString()
      });
      setActiveTab("results");
    } catch (error) {
      setResult({
        type: "error",
        message: "Failed to run RL model",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RESULT RENDERERS
  ========================= */

  const renderRiskIndicator = (riskLevel) => {
    if (!riskLevel) return null;
    
    const isHighRisk = riskLevel === "HIGH";
    const isMediumRisk = riskLevel === "MEDIUM";
    
    return (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span className="font-semibold text-lg">
              {riskLevel} Risk
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              isHighRisk ? 'bg-red-500' : 
              isMediumRisk ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: isHighRisk ? '100%' : isMediumRisk ? '60%' : '30%' }}
          />
        </div>
      </div>
    );
  };

  const renderTrendIndicator = (trend) => {
    if (!trend) return null;
    
    const trendConfig = {
      'INCREASING': { icon: '📈', color: 'text-red-600', bg: 'bg-red-50' },
      'DECREASING': { icon: '📉', color: 'text-green-600', bg: 'bg-green-50' },
      'STABLE': { icon: '➡️', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    };
    
    const config = trendConfig[trend] || { icon: '➡️', color: 'text-gray-600', bg: 'bg-gray-50' };
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
        <span>{config.icon}</span>
        <span className="font-medium">{trend}</span>
      </div>
    );
  };

  const renderActionBadge = (action) => {
    if (!action) return null;
    
    const actionConfig = {
      'SOFT_NUDGE': { color: 'bg-blue-100 text-blue-800', icon: '🔔' },
      'HARD_NUDGE': { color: 'bg-orange-100 text-orange-800', icon: '⚠️' },
      'ALERT': { color: 'bg-red-100 text-red-800', icon: '🚨' },
      'INTERVENTION': { color: 'bg-purple-100 text-purple-800', icon: '🤝' }
    };
    
    const config = actionConfig[action] || { color: 'bg-gray-100 text-gray-800', icon: '📋' };
    
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const renderMetricCard = (icon, label, value, subValue = null) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-indigo-200 transition">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
      </div>
    );
  };

  const renderGruResult = () => {
    if (!result || result.type !== "runGru" || !result.data) return null;
    
    const { status, record } = result.data;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          <div>
            <h3 className="font-bold text-indigo-800">GRU Model Prediction</h3>
            <p className="text-indigo-600">{status || "Prediction completed"}</p>
            <p className="text-sm text-indigo-500 mt-1">
              Student: {studentId} • {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {record && (
          <>
            {/* Main Record Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h4 className="font-semibold text-indigo-900">Prediction Record</h4>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Student ID */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm text-indigo-600 mb-1">Student ID</div>
                    <div className="text-2xl font-bold text-indigo-900">{record.student_id}</div>
                  </div>

                  {/* Week */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 mb-1">Week</div>
                    <div className="text-2xl font-bold text-blue-900">{record.week}</div>
                  </div>

                  {/* Risk Level with Indicator */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600 mb-1">Risk Level</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${record.risk_level === 'HIGH' ? 'bg-red-500' : record.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <div className="text-2xl font-bold text-red-900">{record.risk_level}</div>
                    </div>
                  </div>

                  {/* Risk Trend */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">Risk Trend</div>
                    <div className="flex items-center gap-2">
                      {renderTrendIndicator(record.risk_trend)}
                    </div>
                  </div>
                </div>

                {/* Reconstruction Error */}
                {record.reconstruction_error !== undefined && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Reconstruction Error</div>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold text-indigo-600">
                        {record.reconstruction_error.toFixed(4)}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-indigo-600 h-3 rounded-full"
                            style={{ width: `${Math.min(record.reconstruction_error * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Anomaly score: {record.reconstruction_error > 0.1 ? 'High' : record.reconstruction_error > 0.05 ? 'Medium' : 'Low'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                  <span>🕒</span>
                  Created: {new Date(record.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderMetricCard('📊', 'Risk Assessment', record.risk_level, `Trend: ${record.risk_trend}`)}
              {renderMetricCard('📅', 'Analysis Week', record.week, 'Current period')}
              {renderMetricCard('🎯', 'Confidence', 
                record.reconstruction_error ? 
                  `${((1 - record.reconstruction_error) * 100).toFixed(1)}%` : 
                  'N/A'
              )}
            </div>
          </>
        )}

        {/* Raw JSON Toggle */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full px-6 py-3 bg-gray-50 text-left font-medium flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-gray-600">📦</span>
              Raw API Response
            </span>
            <span className="text-gray-500">{showRawJson ? '▼' : '▶'}</span>
          </button>
          {showRawJson && (
            <pre className="p-4 bg-gray-900 text-gray-100 overflow-auto text-sm max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderRlResult = () => {
    if (!result || result.type !== "runRl" || !result.data) return null;
    
    const { status, record } = result.data;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="font-bold text-indigo-800">RL Model Recommendation</h3>
            <p className="text-indigo-600">{status || "Decision completed"}</p>
            <p className="text-sm text-indigo-500 mt-1">
              Student: {studentId} • {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {record && (
          <>
            {/* Main Action Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl p-6 shadow-lg">
              <div className="text-sm opacity-90 mb-2">Recommended Action</div>
              <div className="text-3xl font-bold mb-4">{renderActionBadge(record.action)}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-indigo-200 text-sm">Risk Level</div>
                  <div className="font-semibold">{record.risk_level}</div>
                </div>
                <div>
                  <div className="text-indigo-200 text-sm">Risk Trend</div>
                  <div className="font-semibold">{record.risk_trend}</div>
                </div>
                <div>
                  <div className="text-indigo-200 text-sm">No Response Streak</div>
                  <div className="font-semibold">{record.no_response_streak} weeks</div>
                </div>
                <div>
                  <div className="text-indigo-200 text-sm">Fatigue Level</div>
                  <div className="font-semibold">{record.fatigue_level}</div>
                </div>
              </div>
            </div>

            {/* Decision Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Decision Reason */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-indigo-600">📋</span>
                  Decision Reason
                </h4>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <span className="text-indigo-800 font-medium">{record.decision_reason}</span>
                </div>
              </div>

              {/* Last Action */}
              {record.last_action && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="text-indigo-600">🔄</span>
                    Last Action Taken
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <span className="text-blue-800 font-medium">{record.last_action.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Record Details */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h4 className="font-semibold">Complete Decision Record</h4>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Student ID</dt>
                    <dd className="text-base font-medium">{record.student_id}</dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Week</dt>
                    <dd className="text-base font-medium">{record.week}</dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Risk Level</dt>
                    <dd className="text-base font-medium">
                      <span className={`inline-flex items-center gap-1 ${
                        record.risk_level === 'HIGH' ? 'text-red-600' : 
                        record.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          record.risk_level === 'HIGH' ? 'bg-red-600' : 
                          record.risk_level === 'MEDIUM' ? 'bg-yellow-600' : 'bg-green-600'
                        }`} />
                        {record.risk_level}
                      </span>
                    </dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Risk Trend</dt>
                    <dd className="text-base font-medium">{record.risk_trend}</dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Action Taken</dt>
                    <dd className="text-base font-medium">{record.action}</dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">No Response Streak</dt>
                    <dd className="text-base font-medium">{record.no_response_streak} weeks</dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Fatigue Level</dt>
                    <dd className="text-base font-medium">{record.fatigue_level}</dd>
                  </div>
                  <div className="border-b border-gray-100 pb-2">
                    <dt className="text-sm text-gray-500">Created At</dt>
                    <dd className="text-base font-medium">{new Date(record.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-indigo-600">⏱️</span>
                Decision Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Current Decision: {record.action}</span>
                </div>
                {record.last_action && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Previous Action: {record.last_action}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Decision Reason: {record.decision_reason}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Raw JSON Toggle */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full px-6 py-3 bg-gray-50 text-left font-medium flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-gray-600">📦</span>
              Raw API Response
            </span>
            <span className="text-gray-500">{showRawJson ? '▼' : '▶'}</span>
          </button>
          {showRawJson && (
            <pre className="p-4 bg-gray-900 text-gray-100 overflow-auto text-sm max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderAddWeekResult = () => {
    if (!result || result.type !== "addWeek") return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-bold text-green-800">Success!</h3>
            <p className="text-green-600">{result.message}</p>
            <p className="text-sm text-green-500 mt-1">
              Student: {studentId} • {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Raw JSON Toggle */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full px-6 py-3 bg-gray-50 text-left font-medium flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-gray-600">📦</span>
              Raw API Response
            </span>
            <span className="text-gray-500">{showRawJson ? '▼' : '▶'}</span>
          </button>
          {showRawJson && (
            <pre className="p-4 bg-gray-900 text-gray-100 overflow-auto text-sm max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderAdd10WeeksResult = () => {
    if (!result || result.type !== "add10Weeks") return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <div>
            <h3 className="font-bold text-green-800">10 Weeks Generated!</h3>
            <p className="text-green-600">
              Pattern: {result.pattern === "LOW" ? "Low Risk (Engaged Student)" : "High Risk (At-Risk Student)"}
            </p>
            <p className="text-sm text-green-500 mt-1">
              Student: {studentId} • {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Raw JSON Toggle */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full px-6 py-3 bg-gray-50 text-left font-medium flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-gray-600">📦</span>
              Raw API Response
            </span>
            <span className="text-gray-500">{showRawJson ? '▼' : '▶'}</span>
          </button>
          {showRawJson && (
            <pre className="p-4 bg-gray-900 text-gray-100 overflow-auto text-sm max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderGetLast10WeeksResult = () => {
    if (!result || result.type !== "getLast10Weeks") return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="font-bold text-blue-800">Historical Data Retrieved</h3>
            <p className="text-blue-600">{result.message}</p>
            <p className="text-sm text-blue-500 mt-1">
              Student: {studentId} • {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Raw JSON Toggle */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="w-full px-6 py-3 bg-gray-50 text-left font-medium flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-2">
              <span className="text-gray-600">📦</span>
              Raw API Response
            </span>
            <span className="text-gray-500">{showRawJson ? '▼' : '▶'}</span>
          </button>
          {showRawJson && (
            <pre className="p-4 bg-gray-900 text-gray-100 overflow-auto text-sm max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderErrorResult = () => {
    if (!result || result.type !== "error") return null;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">❌</span>
          <h3 className="text-xl font-bold text-red-800">Error</h3>
        </div>
        <p className="text-red-600 mb-2">{result.message}</p>
        {result.error && (
          <pre className="bg-red-100 p-3 rounded-lg text-red-800 text-sm">
            {result.error}
          </pre>
        )}
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    switch (result.type) {
      case "addWeek":
        return renderAddWeekResult();
      case "add10Weeks":
        return renderAdd10WeeksResult();
      case "getLast10Weeks":
        return renderGetLast10WeeksResult();
      case "runGru":
        return renderGruResult();
      case "runRl":
        return renderRlResult();
      case "error":
        return renderErrorResult();
      default:
        return (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
    }
  };

  /* =========================
     MAIN RENDER
  ========================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Navy Blue Theme */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🎓</span>
            Student Behavior Intelligence Dashboard
          </h1>
          <p className="mt-2 text-indigo-200">Monitor, analyze, and predict student engagement patterns</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Student Selection Card - Navy Blue Theme */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-indigo-900 mb-2">
                Student ID (4 digits)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0000"
                  value={studentId}
                  onChange={handleStudentIdChange}
                  maxLength="4"
                  className={`w-full px-4 py-2 border ${
                    studentIdError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono text-center text-lg`}
                />
                {studentId && !studentIdError && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
              </div>
              {studentIdError && (
                <p className="text-sm text-red-500 mt-1">{studentIdError}</p>
              )}
            </div>
            
            <div className="w-64">
              <label className="block text-sm font-semibold text-indigo-900 mb-2">
                Risk Pattern
              </label>
              <div className="relative">
                <select
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none bg-white"
                >
                  <option value="LOW" className="py-2">📊 Low Risk (Engaged Student)</option>
                  <option value="HIGH" className="py-2">⚠️ High Risk (At-Risk Student)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={() => generatePattern(pattern)}
              disabled={!studentId || !!studentIdError}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-900 transition shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Sample Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "input"
                ? "text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50"
                : "text-gray-600 hover:text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            📝 Data Input
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "results"
                ? "text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50"
                : "text-gray-600 hover:text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            🤖 Results
          </button>
        </div>

        {/* Input Tab */}
        {activeTab === "input" && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {Object.keys(formData).map((key) => (
                <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-indigo-200 transition">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="mr-2">{fieldConfig[key].icon}</span>
                    {fieldConfig[key].label}
                  </label>
                  <input
                    name={key}
                    type="number"
                    value={formData[key]}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{fieldConfig[key].description}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons - Navy Blue Theme */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <button
                onClick={addWeek}
                disabled={loading || !studentId || !!studentIdError}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loading && lastAction === "addWeek" ? '⏳ Processing...' : '➕ Add Single Week'}
              </button>

              <button
                onClick={add10Weeks}
                disabled={loading || !studentId || !!studentIdError}
                className="px-4 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loading && lastAction === "add10Weeks" ? '⏳ Processing...' : '📅 Generate 10 Weeks'}
              </button>

              <button
                onClick={getLast10Weeks}
                disabled={loading || !studentId || !!studentIdError}
                className="px-4 py-3 bg-indigo-800 text-white rounded-lg hover:bg-indigo-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loading && lastAction === "getLast10Weeks" ? '⏳ Processing...' : '📊 View Last 10 Weeks'}
              </button>

              <button
                onClick={runGru}
                disabled={loading || !studentId || !!studentIdError}
                className="px-4 py-3 bg-indigo-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loading && lastAction === "runGru" ? '⏳ Processing...' : '🧠 Run GRU Model'}
              </button>

              <button
                onClick={runRl}
                disabled={loading || !studentId || !!studentIdError}
                className="px-4 py-3 bg-indigo-950 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loading && lastAction === "runRl" ? '⏳ Processing...' : '🤖 Run RL Model'}
              </button>
            </div>
          </>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {renderResult()}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-lg font-medium">Processing request...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}