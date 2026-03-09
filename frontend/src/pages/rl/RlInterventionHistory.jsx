import { useEffect, useState } from "react";
import { getRlHistory } from "../../services/rlHistoryService";

export default function RlInterventionHistory() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'week', direction: 'desc' });
  const [actionFilter, setActionFilter] = useState("all");
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalInterventions: 0,
    avgFatigue: 0,
    avgNoResponse: 0,
    uniqueStudents: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getRlHistory(searchMode === 'single' ? studentId || null : null);
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
  }, [data, actionFilter, sortConfig, studentId, searchMode]);

  const calculateStats = (data) => {
    const uniqueStudents = new Set(data.map(item => item.student_id)).size;
    const totalInterventions = data.length;
    const avgFatigue = data.length > 0 
      ? (data.reduce((acc, item) => acc + (item.fatigue_level || 0), 0) / data.length).toFixed(2)
      : 0;
    const avgNoResponse = data.length > 0
      ? (data.reduce((acc, item) => acc + (item.no_response_streak || 0), 0) / data.length).toFixed(2)
      : 0;

    setStats({
      totalRecords: data.length,
      totalInterventions,
      avgFatigue,
      avgNoResponse,
      uniqueStudents
    });
  };

  const filterAndSortData = () => {
    let filtered = [...data];

    if (actionFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.action?.toLowerCase() === actionFilter.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      if (sortConfig.key === 'week') {
        return sortConfig.direction === 'asc' 
          ? a.week - b.week 
          : b.week - a.week;
      }
      if (sortConfig.key === 'fatigue_level') {
        return sortConfig.direction === 'asc'
          ? (a.fatigue_level || 0) - (b.fatigue_level || 0)
          : (b.fatigue_level || 0) - (a.fatigue_level || 0);
      }
      if (sortConfig.key === 'no_response_streak') {
        return sortConfig.direction === 'asc'
          ? (a.no_response_streak || 0) - (b.no_response_streak || 0)
          : (b.no_response_streak || 0) - (a.no_response_streak || 0);
      }
      return 0;
    });

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    const sorted = [...filteredData].sort((a, b) => {
      if (key === 'week') {
        return direction === 'asc' ? a.week - b.week : b.week - a.week;
      }
      if (key === 'fatigue_level') {
        return direction === 'asc'
          ? (a.fatigue_level || 0) - (b.fatigue_level || 0)
          : (b.fatigue_level || 0) - (a.fatigue_level || 0);
      }
      if (key === 'no_response_streak') {
        return direction === 'asc'
          ? (a.no_response_streak || 0) - (b.no_response_streak || 0)
          : (b.no_response_streak || 0) - (a.no_response_streak || 0);
      }
      return 0;
    });

    setFilteredData(sorted);
    setSortConfig({ key, direction });
  };

  const getActionColor = (action) => {
    switch(action?.toLowerCase()) {
      case 'intervention':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200';
      case 'monitor':
        return 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200';
      case 'ignore':
        return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200';
      case 'escalate':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200';
      case 'reward':
        return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getActionIcon = (action) => {
    switch(action?.toLowerCase()) {
      case 'intervention':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'monitor':
        return (
          <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'ignore':
        return (
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'escalate':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'reward':
        return (
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getFatigueColor = (level) => {
    if (level >= 0.7) return 'text-red-600';
    if (level >= 0.4) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getFatigueGradient = (level) => {
    if (level >= 0.7) return 'from-red-500 to-rose-500';
    if (level >= 0.4) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 to-teal-500';
  };

  const maxFatigue = Math.max(...data.map(item => item.fatigue_level || 0));
  const maxNoResponse = Math.max(...data.map(item => item.no_response_streak || 0));

  const clearFilters = () => {
    setStudentId("");
    setActionFilter("all");
    setSearchMode("all");
    loadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Decorative Header Gradient - Navy Blue */}
      <div className="bg-gradient-to-r from-[#0B2B4F] via-[#1A3A5F] to-[#2A4A6F] h-2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Icon - Navy Blue */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-[#0B2B4F] to-[#1A3A5F] rounded-2xl p-3 shadow-lg shadow-[#0B2B4F]/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                RL Intervention History
              </h1>
              <p className="text-slate-500 mt-1 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0B2B4F] mr-2"></span>
                Track reinforcement learning interventions and student responses
              </p>
            </div>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B2B4F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B2B4F]"></span>
            </span>
            <span className="text-sm font-medium text-slate-600">Live</span>
          </div>
        </div>

        {/* Stats Cards with Icons - Navy Blue accents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalRecords}</p>
                <p className="text-xs text-slate-400 mt-1">All interventions</p>
              </div>
              <div className="bg-gradient-to-br from-[#0B2B4F]/10 to-[#1A3A5F]/10 group-hover:from-[#0B2B4F]/20 group-hover:to-[#1A3A5F]/20 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Interventions</p>
                <p className="text-3xl font-bold text-[#0B2B4F]">{stats.totalInterventions}</p>
                <p className="text-xs text-slate-400 mt-1">Total actions taken</p>
              </div>
              <div className="bg-gradient-to-br from-[#0B2B4F]/10 to-[#1A3A5F]/10 group-hover:from-[#0B2B4F]/20 group-hover:to-[#1A3A5F]/20 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Unique Students</p>
                <p className="text-3xl font-bold text-[#0B2B4F]">{stats.uniqueStudents}</p>
                <p className="text-xs text-slate-400 mt-1">Individuals reached</p>
              </div>
              <div className="bg-gradient-to-br from-[#0B2B4F]/10 to-[#1A3A5F]/10 group-hover:from-[#0B2B4F]/20 group-hover:to-[#1A3A5F]/20 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Fatigue</p>
                <p className="text-3xl font-bold text-amber-600">{stats.avgFatigue}</p>
                <p className="text-xs text-slate-400 mt-1">Fatigue level</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg No Response</p>
                <p className="text-3xl font-bold text-rose-600">{stats.avgNoResponse}</p>
                <p className="text-xs text-slate-400 mt-1">Response streak</p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 group-hover:from-rose-100 group-hover:to-pink-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search Mode Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 w-full md:w-auto">
              <button
                onClick={() => setSearchMode("all")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all ${
                  searchMode === "all" 
                    ? "bg-white text-[#0B2B4F] shadow-sm" 
                    : "text-slate-600 hover:text-[#0B2B4F] hover:bg-white/50"
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setSearchMode("single")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all ${
                  searchMode === "single" 
                    ? "bg-white text-[#0B2B4F] shadow-sm" 
                    : "text-slate-600 hover:text-[#0B2B4F] hover:bg-white/50"
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
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2B4F]/20 focus:border-[#0B2B4F] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Action Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2B4F]/20 focus:border-[#0B2B4F] transition-all"
              >
                <option value="all">All Actions</option>
                <option value="intervention">Intervention</option>
                <option value="monitor">Monitor</option>
                <option value="ignore">Ignore</option>
                <option value="escalate">Escalate</option>
                <option value="reward">Reward</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={loadData}
                disabled={loading || (searchMode === 'single' && !studentId)}
                className="flex-1 md:flex-none bg-gradient-to-r from-[#0B2B4F] to-[#1A3A5F] hover:from-[#1A3A5F] hover:to-[#2A4A6F] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0B2B4F]/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
          {(studentId || actionFilter !== 'all') && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-slate-500">Active filters:</span>
              {studentId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0B2B4F]/10 text-[#0B2B4F] border border-[#0B2B4F]/20">
                  Student: {studentId}
                  <button onClick={() => setStudentId("")} className="ml-1 hover:text-[#0B2B4F] font-bold">×</button>
                </span>
              )}
              {actionFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0B2B4F]/10 text-[#0B2B4F] border border-[#0B2B4F]/20">
                  Action: {actionFilter}
                  <button onClick={() => setActionFilter("all")} className="ml-1 hover:text-[#0B2B4F] font-bold">×</button>
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
                          <span className="text-[#0B2B4F]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : (
                          <span className="text-slate-400">↕️</span>
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('fatigue_level')}
                  >
                    <div className="flex items-center gap-2">
                      Fatigue
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === 'fatigue_level' ? (
                          <span className="text-[#0B2B4F]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : (
                          <span className="text-slate-400">↕️</span>
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('no_response_streak')}
                  >
                    <div className="flex items-center gap-2">
                      No Response
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === 'no_response_streak' ? (
                          <span className="text-[#0B2B4F]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
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
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2B4F]"></div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Loading intervention history...</p>
                        <p className="text-sm text-slate-400">Please wait a moment</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr 
                      key={row.id || index} 
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0B2B4F] to-[#1A3A5F] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {row.student_id?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-[#0B2B4F]"></span>
                          </div>
                          <span className="ml-3 text-sm font-medium text-slate-800">
                            {row.student_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Week {row.week}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6">
                            {getActionIcon(row.action)}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getActionColor(row.action)}`}>
                            {row.action || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                        <div className="line-clamp-2" title={row.decision_reason}>
                          {row.decision_reason || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-mono ${getFatigueColor(row.fatigue_level)}`}>
                            {row.fatigue_level?.toFixed(2) || 'N/A'}
                          </span>
                          {row.fatigue_level && (
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${getFatigueGradient(row.fatigue_level)}`}
                                style={{ width: `${(row.fatigue_level / maxFatigue) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono ${row.no_response_streak > 3 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {row.no_response_streak || 0}
                          </span>
                          {row.no_response_streak > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700" title="High no-response streak">
                              High
                            </span>
                          )}
                          {row.no_response_streak > 0 && (
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                                style={{ width: `${(row.no_response_streak / maxNoResponse) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-50 rounded-full p-4 mb-3">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-slate-700 text-lg font-medium">No intervention data available</p>
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
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}