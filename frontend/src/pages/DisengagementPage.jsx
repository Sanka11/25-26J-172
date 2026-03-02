import { useState } from "react";
import { runWeeklyTest, uploadWeeklyCSV } from "../services/api/disengagementApi";

// Status Card Component
const StatusCard = ({ title, value, color, icon }) => (
  <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold mt-2">{value}</p>
      </div>
      <div className="text-3xl" style={{ color }}>{icon}</div>
    </div>
  </div>
);

// Risk Indicator Component
const RiskIndicator = ({ level }) => {
  const getRiskColor = () => {
    switch(level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${getRiskColor()}`}>
      <span className="text-sm font-medium">
        {level || 'Unknown'} Risk
      </span>
    </div>
  );
};

// Action Badge Component
const ActionBadge = ({ action }) => {
  const getActionColor = () => {
    switch(action) {
      case 'SOFT_NUDGE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HARD_NUDGE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ESCALATE': return 'bg-red-100 text-red-800 border-red-200';
      case 'DO_NOTHING': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (action) => {
    switch(action) {
      case 'SOFT_NUDGE': return 'Soft Nudge';
      case 'HARD_NUDGE': return 'Hard Nudge';
      case 'ESCALATE': return 'Escalate';
      case 'DO_NOTHING': return 'No Action';
      default: return action;
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${getActionColor()}`}>
      <span className="text-sm font-medium">
        {getActionLabel(action)}
      </span>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, subValue }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-semibold">{value}</p>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

export default function DisengagementPage() {
  const [studentId, setStudentId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearch, setShowSearch] = useState(true);

  const handleWeeklyTest = async () => {
    if (!studentId) {
      alert("Please enter a student ID");
      return;
    }

    try {
      setLoading(true);
      setCsvResult(null); // Clear CSV results when doing single student search
      const data = await runWeeklyTest(studentId);
      setResult(data);
      setSearchHistory(prev => [...new Set([studentId, ...prev])].slice(0, 5));
    } catch (err) {
      alert("Failed to run weekly test. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("Please select a valid CSV file");
      return;
    }

    try {
      setCsvLoading(true);
      setResult(null); // Clear single student results when doing CSV upload
      const data = await uploadWeeklyCSV(file);
      setCsvResult(data);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      alert("CSV upload failed. Please check the file format.");
      console.error(err);
    } finally {
      setCsvLoading(false);
    }
  };

  const renderStudentResult = () => {
    if (!result) return null;

    const { current_output, detailed_output } = result;

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Student Info Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center">
              <span className="mr-2">👤</span> Student Analysis Results
            </h2>
            <RiskIndicator level={current_output.risk_level} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              label="Student ID" 
              value={detailed_output.student_id} 
            />
            <MetricCard 
              label="Weeks Available" 
              value={detailed_output.data_summary.weeks_available}
              subValue={`Used: ${detailed_output.data_summary.weeks_used_for_prediction} for prediction`}
            />
            <MetricCard 
              label="Reconstruction Error" 
              value={current_output.reconstruction_error.toFixed(4)} 
            />
            <MetricCard 
              label="Risk Trend" 
              value={current_output.risk_trend} 
            />
          </div>
        </div>

        {/* Model Output Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GRU Model Output */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <span className="mr-2">🧠</span> GRU Model Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Current Risk Level</span>
                <RiskIndicator level={detailed_output.gru_model_output.current_risk_level} />
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Current Error</span>
                <span className="font-medium">{detailed_output.gru_model_output.current_reconstruction_error.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Previous Error</span>
                <span className="font-medium">{detailed_output.gru_model_output.previous_reconstruction_error || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Risk Trend</span>
                <span className="font-medium">{detailed_output.gru_model_output.risk_trend}</span>
              </div>
            </div>
          </div>

          {/* RL State & Decision */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <span className="mr-2">🤖</span> RL Agent Decision
            </h3>
            
            {/* RL State */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Current State</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Last Action</span>
                  <ActionBadge action={detailed_output.rl_state.last_action} />
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">No Response Streak</span>
                  <span className="font-medium">{detailed_output.rl_state.no_response_streak}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Fatigue Level</span>
                  <span className="font-medium">{detailed_output.rl_state.fatigue_level}</span>
                </div>
              </div>
            </div>

            {/* Decision */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-3">Recommended Action</h4>
              <div className="flex items-center justify-between">
                <ActionBadge action={detailed_output.decision.recommended_action} />
                <span className="text-sm text-blue-600">Reason: {detailed_output.decision.decision_reason}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Decision Summary</h3>
              <p className="text-gray-600">
                Based on the GRU model analysis (error: {current_output.reconstruction_error.toFixed(4)}) 
                and RL agent state, the recommended action is to apply a <strong>{current_output.recommended_action.replace('_', ' ')}</strong>.
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCSVResult = () => {
    if (!csvResult) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Upload Successful</h2>
            <p className="text-sm text-gray-500">{csvResult.status}</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-4xl font-bold text-green-600 mb-2">{csvResult.rows_processed}</p>
          <p className="text-sm text-green-700">Rows Successfully Processed</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              // You can add logic to view detailed results or download a report
              alert(`Processed ${csvResult.rows_processed} student records successfully`);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Disengagement Risk Analysis</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor and analyze student engagement metrics using GRU-RL model</p>
            </div>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-2">🔍</span>
              {showSearch ? 'Hide Search' : 'Search Student'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        {showSearch && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Search Student</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <label htmlFor="studentId" className="sr-only">Student ID</label>
                <input
                  id="studentId"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Student ID (e.g., S01)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleWeeklyTest()}
                />
              </div>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleWeeklyTest}
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Recent searches:</p>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map(id => (
                    <button
                      key={id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      onClick={() => {
                        setStudentId(id);
                        handleWeeklyTest();
                      }}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSV Upload Section */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">📁 Batch Upload (CSV)</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 w-full">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                disabled={csvLoading}
              />
            </div>
            <button
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={handleCSVUpload}
              disabled={csvLoading || !file}
            >
              {csvLoading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Upload a CSV file containing multiple student records for batch analysis
          </p>
          
          {/* File info */}
          {file && !csvLoading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center">
                <span className="mr-2">📎</span>
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          {/* CSV Loading State */}
          {csvLoading && (
            <div className="mt-6 text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Processing CSV file...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Analyzing student data...</p>
          </div>
        )}

        {/* Show Single Student Results */}
        {result && !loading && renderStudentResult()}

        {/* Show CSV Results */}
        {csvResult && !csvLoading && renderCSVResult()}

        {/* Empty State */}
        {!result && !csvResult && !loading && !csvLoading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Search for a student by ID or upload a CSV file to see disengagement risk analysis
            </p>
          </div>
        )}
      </main>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}