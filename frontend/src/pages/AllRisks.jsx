import { useState } from "react";
import {
  startAllRisksJob,
  getAllRisksJobResult,
} from "../services/riskApi";

export default function AllRisks() {
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const badgeColor = {
    LOW: "bg-green-100 text-green-800 border border-green-200",
    NORMAL: "bg-amber-100 text-amber-800 border border-amber-200",
    HIGH: "bg-red-100 text-red-800 border border-red-200",
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setStudents([]);
      setStatus("starting");

      // Start async GRU job
      const startRes = await startAllRisksJob();
      const jobId = startRes.job_id;

      setStatus(startRes.status); // processing

      // Poll job result
      const interval = setInterval(async () => {
        try {
          const res = await getAllRisksJobResult(jobId);
          setStatus(res.status);

          if (res.status === "completed") {
            setStudents(res.students || []);
            setLoading(false);
            clearInterval(interval);
          }

          if (res.status === "failed") {
            console.error("ML failed:", res.error);
            setLoading(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
          setLoading(false);
          clearInterval(interval);
        }
      }, 3000);
    } catch (err) {
      console.error("Start job error:", err);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      starting: "text-blue-600 bg-blue-50",
      processing: "text-amber-600 bg-amber-50",
      completed: "text-green-600 bg-green-50",
      failed: "text-red-600 bg-red-50"
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* ================= HEADER ================= */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Student Disengagement Risk Analysis
            </h1>
            <p className="mt-1 text-gray-600">
              GRU-based autoencoder model for anomaly detection in student engagement patterns
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* ================= CONTROL CARD ================= */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">
                Process all student sequences through the GRU autoencoder model
              </p>
            </div>
            <div className="flex items-center gap-4">
              {status && (
                <div className={`px-4 py-2 rounded-lg ${getStatusColor(status)}`}>
                  <span className="text-sm font-medium capitalize">{status}</span>
                </div>
              )}
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Run Risk Analysis"
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Analyzing student sequences</span>
                <span>GRU Model Active</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse w-full"></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Processing time-series data through GRU autoencoder layers...
              </p>
            </div>
          )}
        </div>

        {/* ================= RESULTS SECTION ================= */}
        {students.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Risk Analysis Results
                </h2>
                <span className="text-sm text-gray-600">
                  {students.length} students analyzed
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Student ID
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Reconstruction Error
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s.student_id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium text-sm">
                              {s.student_id.charAt(0)}
                            </span>
                          </div>
                          <span className="font-mono text-gray-900">{s.student_id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-900">
                            {Number(s.error).toFixed(4)}
                          </span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-indigo-400"
                              style={{ width: `${Math.min(Number(s.error) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${badgeColor[s.risk] || "bg-gray-100 text-gray-800"}`}
                        >
                          {s.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : !loading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Analysis Results
              </h3>
              <p className="text-gray-600 mb-6">
                Click "Run Risk Analysis" to process student engagement data through the GRU model
              </p>
            </div>
          </div>
        )}

        {/* ================= METHODOLOGY CARD ================= */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Methodology</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <h3 className="font-semibold text-lg mb-3 text-blue-200">GRU Autoencoder</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    The model uses Gated Recurrent Units to learn temporal patterns in 
                    student engagement sequences. It reconstructs input data and 
                    measures anomalies through reconstruction error.
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <h3 className="font-semibold text-lg mb-3 text-blue-200">Risk Thresholds</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span><b>LOW</b> – Below 50th percentile (normal engagement)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span><b>NORMAL</b> – 50th to 75th percentiles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span><b>HIGH</b> – Above 75th percentile (potential disengagement)</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <h3 className="font-semibold text-lg mb-3 text-blue-200">Input Features</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {['Login Frequency', 'Session Duration', 'Activity Time', 'Forum Participation', 
                      'Assignment Submissions', 'Alert Responses', 'Engagement Scores', 'Inactivity Gaps'].map((feature, idx) => (
                      <div key={idx} className="bg-white/5 rounded px-3 py-2">
                        {feature}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    10-week sliding window of temporal data
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                  <h3 className="font-semibold text-lg mb-3 text-blue-200">Processing</h3>
                  <p className="text-sm text-gray-300">
                    Each student's time-series data is processed through encoder-decoder 
                    GRU layers, with reconstruction errors calculated as mean squared 
                    differences between original and reconstructed sequences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}