import { useNavigate } from "react-router-dom";

/**
 * GRU Home Page
 * Purpose:
 * - Entry point for the GRU-based Student Disengagement Detection module
 * - Allows users to choose between single-student and cohort-level analysis
 */
export default function GRUMain() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ================= HEADER ================= */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Student Engagement Intelligence Platform
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-600 leading-relaxed">
              Advanced GRU-based deep learning for <span className="font-semibold text-blue-600">early detection</span> of student disengagement risks through temporal pattern analysis.
            </p>
          </div>
        </div>

        {/* ================= FEATURE HIGHLIGHTS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Temporal Analysis</h3>
            <p className="text-sm text-gray-600">
              GRU autoencoders analyze 10-week engagement sequences for pattern anomalies
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Risk Stratification</h3>
            <p className="text-sm text-gray-600">
              Three-tier risk classification based on statistical percentile thresholds
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Proactive Alerts</h3>
            <p className="text-sm text-gray-600">
              Early warning system for academic advisors and student success teams
            </p>
          </div>
        </div>

        {/* ================= MAIN ACTION CARDS ================= */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Single Student Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-100 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Individual Analysis</h2>
                    <p className="text-blue-600 font-medium">Targeted Student Assessment</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Perform detailed GRU analysis on a specific student's engagement patterns. Ideal for advisors tracking individual progress or investigating concerns about particular students.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Personalized risk assessment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Detailed engagement timeline</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Specific risk factor identification</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate("/gru/search")}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3.5 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center gap-3">
                    Analyze Individual Student
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </div>
              
              <div className="bg-blue-50 border-t border-blue-100 px-8 py-4">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Best for: Academic advisors, Course instructors, Student support specialists
                </p>
              </div>
            </div>

            {/* Cohort Analysis Card */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-xl border border-emerald-100 overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cohort Analysis</h2>
                    <p className="text-emerald-600 font-medium">Program-Level Insights</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Comprehensive analysis of all students to identify engagement trends, high-risk groups, and overall program health. Essential for curriculum designers and administrators.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Batch processing of all students</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Comparative risk distribution</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Trend analysis and pattern detection</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate("/gru/all")}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-3.5 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center gap-3">
                    Analyze All Students
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                </button>
              </div>
              
              <div className="bg-emerald-50 border-t border-emerald-100 px-8 py-4">
                <p className="text-sm text-emerald-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Best for: Program directors, Institutional researchers, Academic administrators
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= METHODOLOGY SECTION ================= */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-10 text-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">GRU Autoencoder Methodology</h2>
                  <p className="text-blue-200">How Our Deep Learning Model Works</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="text-cyan-300 text-sm font-semibold mb-2">1. DATA PROCESSING</div>
                  <h3 className="font-semibold text-lg mb-3">Sequence Encoding</h3>
                  <p className="text-gray-300 text-sm">
                    10-week engagement sequences are transformed into temporal feature vectors including login frequency, activity time, and forum participation.
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="text-cyan-300 text-sm font-semibold mb-2">2. MODEL INFERENCE</div>
                  <h3 className="font-semibold text-lg mb-3">GRU Autoencoder</h3>
                  <p className="text-gray-300 text-sm">
                    Gated Recurrent Units encode sequences, reconstruct them, and compute reconstruction errors as anomaly scores for each student.
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="text-cyan-300 text-sm font-semibold mb-2">3. RISK CLASSIFICATION</div>
                  <h3 className="font-semibold text-lg mb-3">Threshold Analysis</h3>
                  <p className="text-gray-300 text-sm">
                    Reconstruction errors are compared against statistical thresholds (50th and 75th percentiles) to classify risk as LOW, NORMAL, or HIGH.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-blue-200 text-sm">
                  <span className="font-semibold">Technical Note:</span> Model trained on historical engagement data with 10-fold cross-validation. Reconstruction error serves as a proxy for behavioral anomaly detection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Disclaimer:</span> Risk predictions are generated using historical learning behavior patterns and should be used to support, not replace, professional academic judgment and student consultation.
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Data encrypted and anonymized
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              FERPA compliant
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Real-time processing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}