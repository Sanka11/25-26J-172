import { useState } from "react";
import { 
  Search, 
  Users, 
  User, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { mlApi } from "../../services/mlApi";

export default function RlHistory() {
  const [studentId, setStudentId] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(null); // 'single' or 'all'

  // 🌍 Get ALL students
  const fetchAllHistory = async () => {
    try {
      setLoading(true);
      setViewMode('all');
      const res = await mlApi.get("/ml/rl-history");
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch all students history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔎 Get SINGLE student
  const fetchSingleHistory = async () => {
    if (!studentId.trim()) {
      alert("Please enter a student ID");
      return;
    }

    try {
      setLoading(true);
      setViewMode('single');
      const res = await mlApi.get(`/ml/rl-history/${studentId.trim()}`);
      setHistory(Array.isArray(res.data) ? res.data : [res.data].filter(Boolean));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch student history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchSingleHistory();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";

    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskBadge = (risk) => {
    switch(risk) {
      case "HIGH":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">HIGH</span>;
      case "NORMAL":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">NORMAL</span>;
      case "LOW":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">LOW</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{risk || 'UNKNOWN'}</span>;
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case "INCREASING":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "DECREASING":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const clearSearch = () => {
    setStudentId("");
    setHistory([]);
    setViewMode(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                RL Intervention History
              </h1>
              <p className="text-slate-600 mt-1">
                View and analyze reinforcement learning intervention records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Student ID Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter student ID (e.g., 0008)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchSingleHistory}
                disabled={loading || !studentId.trim()}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                Load Single Student
              </button>

              <button
                onClick={fetchAllHistory}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Users className="w-4 h-4" />
                Load All Students
              </button>

              {(history.length > 0 || studentId) && (
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* View Mode Indicator */}
          {viewMode && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                {viewMode === 'single' ? 'Showing results for single student' : 'Showing results for all students'}
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
            <p className="text-slate-600">Loading history data...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
            <div className="text-center">
              <div className="inline-flex p-3 bg-slate-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No Records Found
              </h3>
              <p className="text-slate-600 mb-6">
                {viewMode 
                  ? "No intervention history matches your search criteria."
                  : "Use the controls above to load student history data."}
              </p>
              {!viewMode && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={fetchAllHistory}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Load All Students
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Table */}
        {!loading && history.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header with Count */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  {history.length} {history.length === 1 ? 'Record' : 'Records'} Found
                </span>
                {viewMode === 'single' && history[0]?.student_id && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    ID: {history[0].student_id}
                  </span>
                )}
              </div>
              <button 
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                onClick={() => {
                  // Add export functionality if needed
                  console.log('Export data', history);
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Last Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Recommended Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Run Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {history.map((item, index) => (
                    <tr 
                      key={item.id || index} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-slate-100 rounded-md mr-2">
                            <User className="w-3 h-3 text-slate-600" />
                          </div>
                          <span className="font-mono text-sm font-medium text-slate-900">
                            {item.student_id}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskBadge(item.current_risk)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.risk_trend)}
                          <span className="text-sm text-slate-600">
                            {item.risk_trend || 'STABLE'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">
                          {item.last_action || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {item.recommended_action || '-'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {item.reason || '-'}
                        </p>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(item.run_date)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}