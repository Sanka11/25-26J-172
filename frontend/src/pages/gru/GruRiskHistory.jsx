import { useEffect, useState } from "react";
import { getGruHistory } from "../../services/gruHistoryService";

export default function GruRiskHistory() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'week', direction: 'desc' });
  const [riskFilter, setRiskFilter] = useState("all");
  const [stats, setStats] = useState({
    totalRecords: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    avgError: 0,
    maxError: 0,
    uniqueStudents: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getGruHistory(searchMode === 'single' ? studentId || null : null);
      setData(result);
      setFilteredData(result);
      calculateStats(result);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [data, riskFilter, sortConfig, studentId, searchMode]);

  const calculateStats = (data) => {
    // Calculate actual stats from the data
    const highCount = data.filter(item => item.risk_level?.toLowerCase() === 'high').length;
    const mediumCount = data.filter(item => item.risk_level?.toLowerCase() === 'medium').length;
    const lowCount = data.filter(item => item.risk_level?.toLowerCase() === 'low').length;
    
    // Calculate average error
    let avgError = 0;
    const errors = data.map(item => item.reconstruction_error || 0).filter(val => val > 0);
    if (errors.length > 0) {
      avgError = (errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(4);
    }

    // Calculate max error for progress bars
    const maxError = Math.max(...data.map(item => item.reconstruction_error || 0));

    // Count unique students
    const uniqueStudents = new Set(data.map(item => item.student_id).filter(id => id)).size;

    setStats({
      totalRecords: data.length,
      highRisk: highCount,
      mediumRisk: mediumCount,
      lowRisk: lowCount,
      avgError: avgError,
      maxError: maxError,
      uniqueStudents: uniqueStudents
    });
  };

  const filterAndSortData = () => {
    let filtered = [...data];

    // Apply student ID filter based on search mode
    if (searchMode === 'single' && studentId) {
      filtered = filtered.filter(item => 
        item.student_id?.toLowerCase() === studentId.toLowerCase()
      );
    }

    // Apply risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.risk_level?.toLowerCase() === riskFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortConfig.key === 'week') {
        return sortConfig.direction === 'asc' 
          ? (a.week || 0) - (b.week || 0)
          : (b.week || 0) - (a.week || 0);
      }
      if (sortConfig.key === 'reconstruction_error') {
        return sortConfig.direction === 'asc'
          ? (a.reconstruction_error || 0) - (b.reconstruction_error || 0)
          : (b.reconstruction_error || 0) - (a.reconstruction_error || 0);
      }
      return 0;
    });

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    const sorted = [...filteredData].sort((a, b) => {
      if (key === 'week') {
        return direction === 'asc' 
          ? (a.week || 0) - (b.week || 0)
          : (b.week || 0) - (a.week || 0);
      }
      if (key === 'reconstruction_error') {
        return direction === 'asc'
          ? (a.reconstruction_error || 0) - (b.reconstruction_error || 0)
          : (b.reconstruction_error || 0) - (a.reconstruction_error || 0);
      }
      return 0;
    });

    setFilteredData(sorted);
    setSortConfig({ key, direction });
  };

  const getRiskColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'high': return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend?.toLowerCase()) {
      case 'increasing':
        return (
          <span className="inline-flex items-center gap-1 text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Increasing
          </span>
        );
      case 'decreasing':
        return (
          <span className="inline-flex items-center gap-1 text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Decreasing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            Stable
          </span>
        );
    }
  };

  const getErrorGradient = (error) => {
    if (!stats.maxError) return 'from-slate-500 to-slate-500';
    const percentage = (error / stats.maxError) * 100;
    if (percentage > 75) return 'from-red-500 to-rose-500';
    if (percentage > 50) return 'from-amber-500 to-orange-500';
    if (percentage > 25) return 'from-blue-500 to-indigo-500';
    return 'from-emerald-500 to-teal-500';
  };

  const clearFilters = () => {
    setStudentId("");
    setRiskFilter("all");
    setSearchMode("all");
    loadData();
  };

  // Calculate max risk count for distribution chart
  const maxRiskCount = Math.max(stats.highRisk, stats.mediumRisk, stats.lowRisk);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Decorative Header Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3 shadow-lg shadow-blue-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                GRU Risk History
              </h1>
              <p className="text-slate-500 mt-1 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                Monitor and analyze GRU model risk predictions over time
              </p>
            </div>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-600">Live</span>
          </div>
        </div>

        {/* Stats Cards with Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalRecords}</p>
                <p className="text-xs text-slate-400 mt-1">Risk assessments</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">High Risk</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
                <p className="text-xs text-slate-400 mt-1">Critical attention</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 group-hover:from-red-100 group-hover:to-rose-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Medium Risk</p>
                <p className="text-3xl font-bold text-amber-600">{stats.mediumRisk}</p>
                <p className="text-xs text-slate-400 mt-1">Monitor closely</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Low Risk</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.lowRisk}</p>
                <p className="text-xs text-slate-400 mt-1">On track</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 group-hover:from-emerald-100 group-hover:to-teal-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Error</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgError}</p>
                <p className="text-xs text-slate-400 mt-1">Reconstruction error</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution Chart - Only show if there are records */}
        {stats.totalRecords > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">High Risk</span>
                  <span className="font-medium text-red-600">{stats.highRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                    style={{ width: `${(stats.highRisk / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Medium Risk</span>
                  <span className="font-medium text-amber-600">{stats.mediumRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${(stats.mediumRisk / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Low Risk</span>
                  <span className="font-medium text-emerald-600">{stats.lowRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${(stats.lowRisk / stats.totalRecords) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 w-full md:w-auto">
              <button
                onClick={() => setSearchMode("all")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all ${
                  searchMode === "all" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setSearchMode("single")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all ${
                  searchMode === "single" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-600 hover:text-blue-600 hover:bg-white/50"
                }`}
              >
                Single Student
              </button>
            </div>

            {/* Student ID Input */}
            {searchMode === "single" && (
              <div className="w-full md:flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Risk Level Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={loadData}
                disabled={loading || (searchMode === 'single' && !studentId)}
                className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>

              <button
                onClick={clearFilters}
                className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(studentId || riskFilter !== 'all') && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-slate-500">Active filters:</span>
              {studentId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Student: {studentId}
                  <button onClick={() => setStudentId("")} className="ml-1 hover:text-blue-900 font-bold">×</button>
                </span>
              )}
              {riskFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Risk: {riskFilter}
                  <button onClick={() => setRiskFilter("all")} className="ml-1 hover:text-blue-900 font-bold">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('week')}
                  >
                    <div className="flex items-center gap-2">
                      Week
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === 'week' ? (
                          <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : (
                          <span className="text-slate-400">↕️</span>
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('reconstruction_error')}
                  >
                    <div className="flex items-center gap-2">
                      Error
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === 'reconstruction_error' ? (
                          <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : (
                          <span className="text-slate-400">↕️</span>
                        )}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Loading risk history data...</p>
                        <p className="text-sm text-slate-400">Please wait a moment</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr 
                      key={row.id || `${row.student_id}-${row.week}-${index}`} 
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {row.student_id?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            {row.risk_level?.toLowerCase() === 'high' && (
                              <span className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500"></span>
                            )}
                          </div>
                          <span className="ml-3 text-sm font-medium text-slate-800">
                            {row.student_id || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Week {row.week || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getRiskColor(row.risk_level)}`}>
                          {row.risk_level || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrendIcon(row.risk_trend)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-slate-700">
                            {row.reconstruction_error ? row.reconstruction_error.toFixed(4) : 'N/A'}
                          </span>
                          {row.reconstruction_error && stats.maxError > 0 && (
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${getErrorGradient(row.reconstruction_error)}`}
                                style={{ width: `${(row.reconstruction_error / stats.maxError) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-50 rounded-full p-4 mb-3">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <p className="text-slate-700 text-lg font-medium">No risk data available</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filteredData.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-800">{filteredData.length}</span> of{' '}
                  <span className="font-semibold text-slate-800">{data.length}</span> records
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {new Date().toLocaleString()}
                  </div>
                  {stats.uniqueStudents > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                      {stats.uniqueStudents} unique students
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}