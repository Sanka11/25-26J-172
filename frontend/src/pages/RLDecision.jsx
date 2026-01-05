import { useState } from "react";

/**
 * RL Decision Page
 * - Calls the FastAPI RL service directly
 * - Displays recommended adaptive intervention
 */
export default function RLDecision() {
  const [studentId, setStudentId] = useState("S0971");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDecision = async () => {
    if (!studentId.trim()) {
      setError("Please enter a Student ID");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ IMPORTANT: call FastAPI RL service directly
      const response = await fetch(
        `http://127.0.0.1:8000/rl/decide/${studentId.trim()}`
      );

      if (!response.ok) {
        throw new Error("RL service returned an error");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to fetch RL decision");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchDecision();
    }
  };

  const getRiskBadgeClass = (risk) => {
    const classes = {
      LOW: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200",
      NORMAL: "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200",
      HIGH: "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200"
    };
    return classes[risk] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getActionBadgeClass = (action) => {
    const actionType = action?.toUpperCase();
    const classes = {
      "NO_ACTION": "bg-gradient-to-r from-green-100 to-emerald-50 text-emerald-800 border border-emerald-200",
      "EMAIL": "bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-800 border border-blue-200",
      "SMS": "bg-gradient-to-r from-indigo-100 to-violet-50 text-indigo-800 border border-indigo-200",
      "CALL": "bg-gradient-to-r from-purple-100 to-fuchsia-50 text-purple-800 border border-purple-200",
      "MEETING": "bg-gradient-to-r from-amber-100 to-orange-50 text-amber-800 border border-amber-200",
      "INTERVENTION": "bg-gradient-to-r from-red-100 to-rose-50 text-red-800 border border-red-200"
    };
    return classes[actionType] || "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200";
  };

  const getActionIcon = (action) => {
    const actionType = action?.toUpperCase();
    const icons = {
      "NO_ACTION": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      "EMAIL": "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      "SMS": "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
      "CALL": "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      "MEETING": "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      "INTERVENTION": "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
    };
    return icons[actionType] || "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  };

  const getActionDescription = (action) => {
    const actionType = action?.toUpperCase();
    const descriptions = {
      "NO_ACTION": "Continue monitoring. No immediate intervention needed.",
      "EMAIL": "Send personalized email with engagement tips and resources.",
      "SMS": "Send text message reminder about upcoming assignments.",
      "CALL": "Schedule a phone call with academic advisor.",
      "MEETING": "Arrange in-person meeting with student success team.",
      "INTERVENTION": "Immediate academic intervention required. Escalate to department head."
    };
    return descriptions[actionType] || "Custom intervention plan recommended.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ================= HEADER ================= */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reinforcement Learning Decision Engine
              </h1>
              <p className="text-gray-600 mt-1">
                Adaptive intervention recommendations based on GRU risk assessment
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ================= LEFT PANEL: INPUT CARD ================= */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sticky top-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Search Student
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter a Student ID to get RL-based intervention recommendations
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200"
                      placeholder="Enter Student ID"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Example: S0971, S0001, S0002
                  </p>
                </div>

                <button
                  onClick={fetchDecision}
                  disabled={loading || !studentId.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3.5 px-4 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing with RL...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Get RL Decision
                    </span>
                  )}
                </button>

                {/* ================= ERROR DISPLAY ================= */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ================= INFO PANEL ================= */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How RL Decisions Work
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs mt-0.5">
                      1
                    </div>
                    <span>GRU model assesses student engagement risk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs mt-0.5">
                      2
                    </div>
                    <span>RL agent evaluates optimal intervention strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs mt-0.5">
                      3
                    </div>
                    <span>Action is selected to maximize long-term engagement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ================= RIGHT PANEL: RESULTS ================= */}
          <div className="lg:col-span-2 space-y-8">
            {/* ================= EMPTY STATE ================= */}
            {!result && !loading && !error && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Awaiting RL Decision
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Enter a Student ID and click "Get RL Decision" to receive personalized intervention recommendations
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Reinforcement Learning powered recommendations</span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= RESULTS DISPLAY ================= */}
            {result && (
              <div className="space-y-8">
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">
                            {result.student_id?.charAt(0) || "S"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Student ID</p>
                          <p className="text-2xl font-bold text-gray-900 font-mono">
                            {result.student_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">GRU Risk Level</p>
                        <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getRiskBadgeClass(result.gru_risk)}`}>
                          {result.gru_risk}
                        </span>
                      </div>
                    </div>

                    {/* Recommended Action Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recommended Intervention
                        </h3>
                        <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getActionBadgeClass(result.recommended_action)}`}>
                          {result.recommended_action?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIcon(result.recommended_action)} />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">
                            {getActionDescription(result.recommended_action)}
                          </p>
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              RL Agent Decision
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Optimized for Engagement
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Risk Analysis Card */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.347 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Risk Context
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Current GRU Assessment</p>
                        <p className="text-lg font-semibold text-gray-900">{result.gru_risk} Risk Level</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Based on the GRU model's assessment of engagement patterns, the RL agent has determined the optimal intervention strategy.
                      </p>
                    </div>
                  </div>

                  {/* RL Process Card */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      RL Decision Process
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <span className="text-sm text-gray-700">Evaluate current state</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <span className="text-sm text-gray-700">Calculate Q-values for actions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <span className="text-sm text-gray-700">Select max expected reward</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Methodology Card */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-8 text-white">
                    <h3 className="text-xl font-bold mb-6">Reinforcement Learning Methodology</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                        <h4 className="font-semibold mb-3 text-purple-200">State Representation</h4>
                        <p className="text-sm text-gray-200">
                          Student engagement metrics, historical interventions, and GRU risk scores form the state space.
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                        <h4 className="font-semibold mb-3 text-purple-200">Action Space</h4>
                        <p className="text-sm text-gray-200">
                          Six intervention levels from no action to direct intervention, each with associated costs and benefits.
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                        <h4 className="font-semibold mb-3 text-purple-200">Reward Function</h4>
                        <p className="text-sm text-gray-200">
                          Positive rewards for engagement improvement, negative for over-intervention or worsening engagement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}