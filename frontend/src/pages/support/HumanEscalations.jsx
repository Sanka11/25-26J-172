import { useEffect, useState } from "react";
import { getHumanEscalations } from "../../services/humanEscalationService";

export default function HumanEscalations() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'week', direction: 'desc' });
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [stats, setStats] = useState({
    totalEscalations: 0,
    criticalRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    pendingSupport: 0,
    avgResponseTime: '0h'
  });

  const loadEscalations = async () => {
    setLoading(true);
    try {
      const result = await getHumanEscalations();
      setData(result);
      setFilteredData(result);
      calculateStats(result);
    } catch (error) {
      console.error("Error loading escalations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, riskFilter, data]);

  const calculateStats = (data) => {
    // Calculate actual counts from the data
    const criticalCount = data.filter(item => item.risk_level?.toLowerCase() === 'critical').length;
    const highCount = data.filter(item => item.risk_level?.toLowerCase() === 'high').length;
    const mediumCount = data.filter(item => item.risk_level?.toLowerCase() === 'medium').length;
    const lowCount = data.filter(item => item.risk_level?.toLowerCase() === 'low').length;
    
    // Calculate pending support (escalations that are not resolved)
    const pendingCount = data.filter(item => item.status?.toLowerCase() !== 'resolved' && item.status?.toLowerCase() !== 'completed').length;
    
    // Calculate average response time if data exists
    let avgTime = '0h';
    const responseTimes = data
      .filter(item => item.response_time) // Only items with response time
      .map(item => parseFloat(item.response_time) || 0);
    
    if (responseTimes.length > 0) {
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      avgTime = avg.toFixed(1) + 'h';
    }

    setStats({
      totalEscalations: data.length,
      criticalRisk: criticalCount,
      highRisk: highCount,
      mediumRisk: mediumCount,
      lowRisk: lowCount,
      pendingSupport: pendingCount,
      avgResponseTime: avgTime
    });
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mobile?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.risk_level?.toLowerCase() === riskFilter.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      if (sortConfig.key === 'week') {
        return sortConfig.direction === 'asc' 
          ? a.week - b.week 
          : b.week - a.week;
      }
      if (sortConfig.key === 'risk_level') {
        const riskWeight = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
        const weightA = riskWeight[a.risk_level?.toLowerCase()] || 0;
        const weightB = riskWeight[b.risk_level?.toLowerCase()] || 0;
        return sortConfig.direction === 'asc' 
          ? weightA - weightB 
          : weightB - weightA;
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
      if (key === 'risk_level') {
        const riskWeight = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
        const weightA = riskWeight[a.risk_level?.toLowerCase()] || 0;
        const weightB = riskWeight[b.risk_level?.toLowerCase()] || 0;
        return direction === 'asc' ? weightA - weightB : weightB - weightA;
      }
      return 0;
    });

    setFilteredData(sorted);
    setSortConfig({ key, direction });
  };

  const getRiskColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'critical':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRiskBadge = (level) => {
    switch(level?.toLowerCase()) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Critical
          </span>
        );
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return level;
    }
  };

  const handleContact = (escalation) => {
    setSelectedEscalation(escalation);
    // Here you would implement actual contact functionality
    console.log(`Contacting ${escalation.name}...`);
  };

  const handleResolve = async (id) => {
    try {
      // Here you would call an API to mark as resolved
      // await markEscalationResolved(id);
      console.log(`Resolving escalation ${id}`);
      // Refresh the list after resolving
      loadEscalations();
    } catch (error) {
      console.error("Error resolving escalation:", error);
    }
  };

  const maxRiskCount = Math.max(stats.criticalRisk, stats.highRisk, stats.mediumRisk, stats.lowRisk);

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Human Support Escalations
              </h1>
              <p className="text-slate-500 mt-1 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0B2B4F] mr-2"></span>
                Manage and respond to student escalations requiring human intervention
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
                <p className="text-sm font-medium text-slate-500 mb-1">Total Escalations</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalEscalations}</p>
                <p className="text-xs text-slate-400 mt-1">Requiring attention</p>
              </div>
              <div className="bg-gradient-to-br from-[#0B2B4F]/10 to-[#1A3A5F]/10 group-hover:from-[#0B2B4F]/20 group-hover:to-[#1A3A5F]/20 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Critical Risk</p>
                <p className="text-3xl font-bold text-red-600">{stats.criticalRisk}</p>
                <p className="text-xs text-slate-400 mt-1">Immediate action</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 group-hover:from-red-100 group-hover:to-rose-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">High Risk</p>
                <p className="text-3xl font-bold text-orange-600">{stats.highRisk}</p>
                <p className="text-xs text-slate-400 mt-1">Needs attention</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Pending Support</p>
                <p className="text-3xl font-bold text-[#0B2B4F]">{stats.pendingSupport}</p>
                <p className="text-xs text-slate-400 mt-1">Awaiting response</p>
              </div>
              <div className="bg-gradient-to-br from-[#0B2B4F]/10 to-[#1A3A5F]/10 group-hover:from-[#0B2B4F]/20 group-hover:to-[#1A3A5F]/20 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-[#0B2B4F]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Response</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.avgResponseTime}</p>
                <p className="text-xs text-slate-400 mt-1">Response time</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 group-hover:from-emerald-100 group-hover:to-teal-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Level Distribution - Only show if there are escalations */}
        {stats.totalEscalations > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Critical</span>
                  <span className="font-medium text-red-600">{stats.criticalRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                    style={{ width: `${(stats.criticalRisk / stats.totalEscalations) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">High</span>
                  <span className="font-medium text-orange-600">{stats.highRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                    style={{ width: `${(stats.highRisk / stats.totalEscalations) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Medium</span>
                  <span className="font-medium text-amber-600">{stats.mediumRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                    style={{ width: `${(stats.mediumRisk / stats.totalEscalations) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Low</span>
                  <span className="font-medium text-emerald-600">{stats.lowRisk}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${(stats.lowRisk / stats.totalEscalations) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by ID, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2B4F]/20 focus:border-[#0B2B4F] transition-all"
                />
              </div>
            </div>

            {/* Risk Level Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2B4F]/20 focus:border-[#0B2B4F] transition-all"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadEscalations}
              disabled={loading}
              className="flex-1 md:flex-none bg-gradient-to-r from-[#0B2B4F] to-[#1A3A5F] hover:from-[#1A3A5F] hover:to-[#2A4A6F] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0B2B4F]/25 hover:shadow-xl disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || riskFilter !== 'all') && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-slate-500">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0B2B4F]/10 text-[#0B2B4F] border border-[#0B2B4F]/20">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-[#0B2B4F] font-bold">×</button>
                </span>
              )}
              {riskFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#0B2B4F]/10 text-[#0B2B4F] border border-[#0B2B4F]/20">
                  Risk: {riskFilter}
                  <button onClick={() => setRiskFilter("all")} className="ml-1 hover:text-[#0B2B4F] font-bold">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Escalations Table */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Contact
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
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('risk_level')}
                  >
                    <div className="flex items-center gap-2">
                      Risk Level
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === 'risk_level' ? (
                          <span className="text-[#0B2B4F]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : (
                          <span className="text-slate-400">↕️</span>
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2B4F]"></div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Loading escalations...</p>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0B2B4F] to-[#1A3A5F] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {row.name?.charAt(0)?.toUpperCase() || row.student_id?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            {row.risk_level?.toLowerCase() === 'critical' && (
                              <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500"></span>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-slate-800">
                              {row.name || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {row.student_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${row.email}`} className="hover:text-[#0B2B4F] transition-colors">
                              {row.email || 'N/A'}
                            </a>
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${row.mobile}`} className="hover:text-[#0B2B4F] transition-colors">
                              {row.mobile || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Week {row.week}
                        </div>
                        {row.created_at && (
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(row.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getRiskColor(row.risk_level)}`}>
                          {getRiskBadge(row.risk_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleContact(row)}
                            className="p-2 bg-[#0B2B4F] hover:bg-[#1A3A5F] text-white rounded-lg transition-colors shadow-sm"
                            title="Contact Student"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleResolve(row.id)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                            title="Mark as Resolved"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors shadow-sm"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-slate-700 text-lg font-medium">No escalations found</p>
                        <p className="text-slate-400 text-sm mt-1">All clear! No students require human intervention at this time.</p>
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
                  <span className="font-semibold text-slate-800">{data.length}</span> escalations
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {new Date().toLocaleString()}
                  </div>
                  <span className="text-xs bg-[#0B2B4F]/10 text-[#0B2B4F] px-2 py-1 rounded-full border border-[#0B2B4F]/20">
                    Urgent: {stats.criticalRisk + stats.highRisk}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Panel - Only show if there are escalations */}
        {stats.totalEscalations > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 hover:shadow-md transition-all hover:border-[#0B2B4F]/20 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0B2B4F]/10 rounded-xl">
                  <svg className="w-6 h-6 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold">Contact High-Risk</h3>
                  <p className="text-sm text-slate-500">{stats.criticalRisk + stats.highRisk} students need attention</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 hover:shadow-md transition-all hover:border-[#0B2B4F]/20 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0B2B4F]/10 rounded-xl">
                  <svg className="w-6 h-6 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold">Generate Report</h3>
                  <p className="text-sm text-slate-500">Export escalation summary</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 hover:shadow-md transition-all hover:border-[#0B2B4F]/20 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0B2B4F]/10 rounded-xl">
                  <svg className="w-6 h-6 text-[#0B2B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold">View Analytics</h3>
                  <p className="text-sm text-slate-500">Trends and insights</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
