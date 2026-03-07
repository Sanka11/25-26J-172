import { useState, useMemo } from "react";
import { 
  Search, 
  Users, 
  User, 
  Brain,
  AlertCircle,
  Clock,
  Calendar,
  Activity,
  Download,
  RefreshCw,
  FileText,
  Filter,
  ChevronDown,
  ChevronRight,
  Layers
} from "lucide-react";
import { mlApi } from "../../services/mlApi";

export default function GruSingleStudent() {
  const [studentId, setStudentId] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState("single"); // 'single' or 'all'
  const [filterStudentId, setFilterStudentId] = useState("");
  const [expandedStudents, setExpandedStudents] = useState({});
  const [groupByStudent, setGroupByStudent] = useState(true);

  // 🔎 Run GRU for single student (live inference)
  const runGruSingle = async () => {
    if (!studentId.trim()) {
      alert("Please enter a student ID");
      return;
    }

    try {
      setLoadingSingle(true);
      const res = await mlApi.get(`/test-gru-inference/${studentId.trim()}`);
      setSingleResult(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "GRU inference failed");
    } finally {
      setLoadingSingle(false);
    }
  };

  // 🌍 Load all GRU history (from Firestore collection)
  const loadAllGru = async () => {
    try {
      setLoadingAll(true);
      const res = await mlApi.get("/ml/gru-history");
      setAllResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to fetch GRU history");
    } finally {
      setLoadingAll(false);
    }
  };

  // Group results by student ID - using ONLY actual data
  const groupedResults = useMemo(() => {
    if (!groupByStudent) return null;
    
    return allResults.reduce((acc, item) => {
      const studentId = item.student_id;
      if (!acc[studentId]) {
        acc[studentId] = [];
      }
      acc[studentId].push(item);
      return acc;
    }, {});
  }, [allResults, groupByStudent]);

  // Filtered results based on student ID filter - using ONLY actual data
  const filteredResults = useMemo(() => {
    if (!filterStudentId.trim()) {
      return groupByStudent ? groupedResults : allResults;
    }
    
    if (groupByStudent && groupedResults) {
      // Filter grouped results
      return Object.keys(groupedResults).reduce((acc, studentId) => {
        if (studentId.includes(filterStudentId)) {
          acc[studentId] = groupedResults[studentId];
        }
        return acc;
      }, {});
    } else {
      // Filter flat list
      return allResults.filter(item => 
        item.student_id?.includes(filterStudentId)
      );
    }
  }, [groupedResults, allResults, filterStudentId, groupByStudent]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      runGruSingle();
    }
  };

  const clearSingle = () => {
    setStudentId("");
    setSingleResult(null);
  };

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const expandAll = () => {
    if (groupedResults) {
      const allExpanded = Object.keys(groupedResults).reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {});
      setExpandedStudents(allExpanded);
    }
  };

  const collapseAll = () => {
    setExpandedStudents({});
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                GRU Risk Analysis
              </h1>
              <p className="text-slate-600 mt-1">
                Run Gated Recurrent Unit inference and view historical risk assessments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Single Student Inference
            </span>
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "all"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Students History
            </span>
          </button>
        </div>

        {/* Single Student Tab */}
        {activeTab === "single" && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Run Single Student Inference
              </h2>
              
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter student ID (e.g., 0008)"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loadingSingle}
                    />
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={runGruSingle}
                    disabled={loadingSingle || !studentId.trim()}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {loadingSingle ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Run GRU Inference
                      </>
                    )}
                  </button>
                  
                  {(studentId || singleResult) && (
                    <button
                      onClick={clearSingle}
                      className="inline-flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Single Result - Only shows actual API data */}
            {loadingSingle && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mb-4" />
                    <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Running GRU Inference
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    Analyzing student {studentId} with Gated Recurrent Unit model...
                  </p>
                </div>
              </div>
            )}

            {singleResult && !loadingSingle && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Inference Result
                    </span>
                  </div>
                  <span className="text-xs text-blue-600">
                    Live Prediction
                  </span>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Info - Only showing actual data fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Student ID
                        </label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                          {singleResult.studentId || studentId}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Risk Level
                        </label>
                        <div className="mt-1">
                          {getRiskBadge(singleResult.gruResult?.risk_level)}
                        </div>
                      </div>
                    </div>

                    {/* GRU Metrics - Only showing actual data fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Reconstruction Error
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <p className="text-lg font-semibold text-slate-900">
                            {singleResult.gruResult?.reconstruction_error?.toFixed(6)}
                          </p>
                        </div>
                      </div>

                      {singleResult.timestamp && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Timestamp
                          </label>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            {formatDate(singleResult.timestamp)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Only show threshold if it exists in the actual data */}
                  {singleResult.gruResult?.threshold && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Threshold Information
                      </h4>
                      <p className="text-sm text-slate-600">
                        Error Threshold: {singleResult.gruResult.threshold}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {singleResult.gruResult.reconstruction_error > singleResult.gruResult.threshold 
                          ? "⚠️ Error exceeds threshold - High risk detected" 
                          : "✓ Error within normal range"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loadingSingle && !singleResult && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="text-center">
                  <div className="inline-flex p-3 bg-slate-100 rounded-full mb-4">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No Inference Run
                  </h3>
                  <p className="text-slate-600">
                    Enter a student ID and click "Run GRU Inference" to analyze risk.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Students Tab */}
        {activeTab === "all" && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  All Students GRU History
                </h2>
                <button
                  onClick={loadAllGru}
                  disabled={loadingAll}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loadingAll ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Load All Results
                    </>
                  )}
                </button>
              </div>

              {/* Filter and Group Controls - Only show when we have actual data */}
              {allResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Student ID Filter */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Filter by Student ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter student ID to filter..."
                          value={filterStudentId}
                          onChange={(e) => setFilterStudentId(e.target.value)}
                        />
                        <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Group Toggle */}
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => setGroupByStudent(!groupByStudent)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          groupByStudent 
                            ? 'bg-purple-50 border-purple-300 text-purple-700' 
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        {groupByStudent ? 'Grouped by Student' : 'Flat View'}
                      </button>

                      {groupByStudent && groupedResults && Object.keys(groupedResults).length > 0 && (
                        <>
                          <button
                            onClick={expandAll}
                            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Expand All
                          </button>
                          <button
                            onClick={collapseAll}
                            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Collapse All
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loadingAll && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-purple-600 mb-4" />
                    <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Loading GRU History
                  </h3>
                  <p className="text-slate-600">
                    Fetching all students GRU results...
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingAll && allResults.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12">
                <div className="text-center">
                  <div className="inline-flex p-3 bg-slate-100 rounded-full mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No Records Found
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Click "Load All Results" to fetch GRU history data.
                  </p>
                  <button
                    onClick={loadAllGru}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Load All Results
                  </button>
                </div>
              </div>
            )}

            {/* Results - Only showing actual data from API */}
            {!loadingAll && allResults.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {groupByStudent && filteredResults
                        ? `${Object.keys(filteredResults).length} Students Found`
                        : `${filteredResults.length} Records Found`}
                    </span>
                    {filterStudentId && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Filtered: {filterStudentId}
                      </span>
                    )}
                  </div>
                  <button 
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    onClick={() => {
                      // Export functionality - only exports actual data
                      const dataStr = JSON.stringify(allResults, null, 2);
                      console.log('Export data', allResults);
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                {groupByStudent && filteredResults ? (
                  // Grouped View - Only showing actual grouped data
                  <div className="divide-y divide-slate-200">
                    {Object.entries(filteredResults).map(([studentId, records]) => (
                      <div key={studentId} className="hover:bg-slate-50 transition-colors">
                        {/* Student Header */}
                        <div 
                          className="px-6 py-4 flex items-center justify-between cursor-pointer"
                          onClick={() => toggleStudent(studentId)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {expandedStudents[studentId] ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <div className="p-1.5 bg-slate-100 rounded-md">
                              <User className="w-4 h-4 text-slate-600" />
                            </div>
                            <span className="font-mono font-medium text-slate-900">
                              {studentId}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({records.length} {records.length === 1 ? 'run' : 'runs'})
                            </span>
                          </div>
                          
                          {/* Only showing actual data - latest risk from records */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xs text-slate-500">Latest Risk</span>
                              <div className="mt-1">
                                {getRiskBadge(records[records.length - 1]?.risk_level)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Student Records (expanded) - Only showing actual record data */}
                        {expandedStudents[studentId] && (
                          <div className="px-12 pb-4">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-slate-100 rounded-lg">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Run Date
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Risk Level
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Reconstruction Error
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {records.map((record, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-sm text-slate-600">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {formatDate(record.run_date)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      {getRiskBadge(record.risk_level)}
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-3 h-3 text-slate-400" />
                                        <span className="text-sm font-mono text-slate-700">
                                          {record.reconstruction_error?.toFixed(6)}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Flat View - Only showing actual data
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Risk Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Reconstruction Error
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Run Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredResults.map((item, index) => (
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
                              {getRiskBadge(item.risk_level)}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-slate-400" />
                                <span className="text-sm font-mono text-slate-700">
                                  {item.reconstruction_error?.toFixed(6)}
                                </span>
                              </div>
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
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}