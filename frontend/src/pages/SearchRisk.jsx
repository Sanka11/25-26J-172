import { useState } from "react";
import { getRiskById } from "../services/riskApi";

export default function SearchRisk() {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const search = async () => {
    if (!studentId.trim()) {
      setErrorMsg("Please enter a Student ID");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setResult(null);

      const data = await getRiskById(studentId.trim());
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Student not found or analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = {
    LOW: "bg-gradient-to-r from-green-500 to-emerald-600",
    NORMAL: "bg-gradient-to-r from-amber-500 to-orange-600",
    HIGH: "bg-gradient-to-r from-red-500 to-rose-600",
  };

  const badgeTextColor = {
    LOW: "text-green-100",
    NORMAL: "text-amber-100",
    HIGH: "text-red-100",
  };

  const getRiskDescription = (risk) => {
    const descriptions = {
      LOW: "Normal engagement patterns detected",
      NORMAL: "Moderate risk of disengagement",
      HIGH: "High risk - intervention recommended"
    };
    return descriptions[risk] || "Risk assessment completed";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ================= HEADER ================= */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Individual Student Risk Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Search for a specific student's disengagement risk assessment
              </p>
            </div>
          </div>
        </div>

        {/* ================= SEARCH CARD ================= */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Search Student
            </h2>
            <p className="text-gray-600">
              Enter a Student ID to run GRU autoencoder analysis on their engagement patterns
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 transition-all duration-200"
                  placeholder="Enter Student ID (e.g., S0001, S0002)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>
            </div>
            <button
              onClick={search}
              disabled={loading || !studentId.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run Analysis
                </span>
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* ================= RESULTS SECTION ================= */}
        {result && (
          <div className="space-y-8">
            {/* Risk Summary Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
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
                  
                  <div className="text-center md:text-right">
                    <p className="text-sm text-gray-600 mb-1">Reconstruction Error</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {result.reconstruction_error?.toFixed(4) || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Mean Squared Error</p>
                  </div>
                </div>

                {/* Risk Level Badge */}
                <div className="text-center mb-8">
                  <div className="inline-flex flex-col items-center">
                    <span className={`px-8 py-3 rounded-full text-lg font-bold shadow-lg ${badgeColor[result.risk]} ${badgeTextColor[result.risk]}`}>
                      {result.risk} RISK
                    </span>
                    <p className="text-gray-600 mt-3 text-sm">
                      {getRiskDescription(result.risk)}
                    </p>
                  </div>
                </div>

                {/* Error Visualization */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Reconstruction Error Scale</span>
                    <span className="font-semibold">
                      {result.reconstruction_error?.toFixed(4)} MSE
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${badgeColor[result.risk]} transition-all duration-1000 ease-out`}
                      style={{ 
                        width: `${Math.min((result.reconstruction_error || 0) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Low Risk</span>
                    <span>Normal</span>
                    <span>High Risk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Reasons Card */}
            {result.reasons && result.reasons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-8 py-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.347 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Risk Indicators & Insights
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Key factors contributing to the risk assessment
                  </p>
                </div>
                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {result.reasons.map((reason, index) => (
                      <div 
                        key={index} 
                        className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badgeColor[result.risk]} ${badgeTextColor[result.risk]}`}>
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Methodology Card */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How This Analysis Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-indigo-600 font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">GRU Processing</h4>
                  <p className="text-sm text-gray-600">
                    Student's 10-week engagement data is processed through GRU autoencoder layers
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-indigo-600 font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Error Calculation</h4>
                  <p className="text-sm text-gray-600">
                    Reconstruction error measures deviation from normal behavioral patterns
                  </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-indigo-600 font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Risk Classification</h4>
                  <p className="text-sm text-gray-600">
                    Errors are compared against percentile thresholds to determine risk level
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!result && !loading && !errorMsg && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Search for Student Risk Analysis
              </h3>
              <p className="text-gray-600 mb-6">
                Enter a Student ID above to run GRU-based disengagement risk assessment
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Try searching for: S0001, S0002, S0003</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}