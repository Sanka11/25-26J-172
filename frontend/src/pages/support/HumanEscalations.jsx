import { useEffect, useState } from "react";
import { getHumanEscalations } from "../../services/humanEscalationService";

export default function HumanEscalations() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "week", direction: "desc" });
  const [expandedRow, setExpandedRow] = useState(null);
  const [stats, setStats] = useState({
    totalEscalations: 0,
    criticalRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
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

  const calculateStats = (rows) => {
    setStats({
      totalEscalations: rows.length,
      criticalRisk: rows.filter(r => r.risk_level?.toLowerCase() === "critical").length,
      highRisk: rows.filter(r => r.risk_level?.toLowerCase() === "high").length,
      mediumRisk: rows.filter(r => r.risk_level?.toLowerCase() === "medium").length,
      lowRisk: rows.filter(r => r.risk_level?.toLowerCase() === "low").length,
    });
  };

  const filterData = () => {
    let filtered = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.student_id?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.mobile?.toLowerCase().includes(q) ||
        item.department?.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "all") {
      filtered = filtered.filter(item => item.risk_level?.toLowerCase() === riskFilter);
    }
    filtered.sort((a, b) => {
      if (sortConfig.key === "week") {
        return sortConfig.direction === "asc" ? a.week - b.week : b.week - a.week;
      }
      if (sortConfig.key === "risk_level") {
        const w = { critical: 3, high: 2, medium: 1, low: 0 };
        const wA = w[a.risk_level?.toLowerCase()] ?? 0;
        const wB = w[b.risk_level?.toLowerCase()] ?? 0;
        return sortConfig.direction === "asc" ? wA - wB : wB - wA;
      }
      return 0;
    });
    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    const riskWeight = { critical: 3, high: 2, medium: 1, low: 0 };
    const sorted = [...filteredData].sort((a, b) => {
      if (key === "week") return direction === "asc" ? a.week - b.week : b.week - a.week;
      if (key === "risk_level") {
        const wA = riskWeight[a.risk_level?.toLowerCase()] ?? 0;
        const wB = riskWeight[b.risk_level?.toLowerCase()] ?? 0;
        return direction === "asc" ? wA - wB : wB - wA;
      }
      return 0;
    });
    setFilteredData(sorted);
  };

  const getRiskStyle = (level) => {
    switch (level?.toLowerCase()) {
      case "critical": return "bg-red-50 text-red-700 border-red-200";
      case "high": return "bg-orange-50 text-orange-700 border-orange-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend?.toUpperCase()) {
      case "WORSENING": return (
        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Worsening
        </span>
      );
      case "IMPROVING": return (
        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0V15m0-8l-8 8-4-4-6 6" />
          </svg>
          Improving
        </span>
      );
      default: return (
        <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
          Stable
        </span>
      );
    }
  };

  const SortIcon = ({ colKey }) => (
    <span className="ml-1 inline-block text-slate-400">
      {sortConfig.key === colKey
        ? (sortConfig.direction === "asc" ? "↑" : "↓")
        : "↕"}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gradient-to-r from-[#0B2B4F] via-[#1A3A5F] to-[#2A4A6F] h-1.5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#0B2B4F] to-[#1A3A5F] rounded-2xl p-3 shadow-lg shadow-[#0B2B4F]/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Human Support Escalations</h1>
              <p className="text-sm text-slate-500 mt-0.5">Students flagged for direct human intervention</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B2B4F] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B2B4F]" />
            </span>
            <span className="text-sm font-medium text-slate-600">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Escalations", value: stats.totalEscalations, color: "text-slate-800", bg: "from-[#0B2B4F]/8 to-[#1A3A5F]/8" },
            { label: "Critical Risk", value: stats.criticalRisk, color: "text-red-600", bg: "from-red-50 to-rose-50" },
            { label: "High Risk", value: stats.highRisk, color: "text-orange-600", bg: "from-orange-50 to-amber-50" },
            { label: "Medium / Low", value: stats.mediumRisk + stats.lowRisk, color: "text-slate-600", bg: "from-slate-50 to-slate-100" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Risk Distribution Bar */}
        {stats.totalEscalations > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-8 border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk Distribution</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Critical", count: stats.criticalRisk, bar: "bg-red-500" },
                { label: "High", count: stats.highRisk, bar: "bg-orange-500" },
                { label: "Medium", count: stats.mediumRisk, bar: "bg-amber-500" },
                { label: "Low", count: stats.lowRisk, bar: "bg-emerald-500" },
              ].map(({ label, count, bar }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar} transition-all duration-500`}
                      style={{ width: stats.totalEscalations > 0 ? `${(count / stats.totalEscalations) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by ID, name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2B4F]/20 focus:border-[#0B2B4F] transition-all"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2B4F]/20 focus:border-[#0B2B4F] transition-all"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={loadEscalations}
              disabled={loading}
              className="bg-gradient-to-r from-[#0B2B4F] to-[#1A3A5F] hover:from-[#1A3A5F] hover:to-[#2A4A6F] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-md disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          {(searchTerm || riskFilter !== "all") && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#0B2B4F]/10 text-[#0B2B4F] border border-[#0B2B4F]/20">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="ml-0.5 font-bold hover:text-[#0B2B4F]">×</button>
                </span>
              )}
              {riskFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#0B2B4F]/10 text-[#0B2B4F] border border-[#0B2B4F]/20">
                  Risk: {riskFilter}
                  <button onClick={() => setRiskFilter("all")} className="ml-0.5 font-bold hover:text-[#0B2B4F]">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => handleSort("week")}
                  >
                    Week <SortIcon colKey="week" />
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => handleSort("risk_level")}
                  >
                    Risk <SortIcon colKey="risk_level" />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0B2B4F]" />
                        <p className="text-slate-500 text-sm">Loading escalations...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <>
                      <tr
                        key={row.id || index}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0B2B4F] to-[#1A3A5F] flex items-center justify-center text-white font-semibold text-sm">
                                {row.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              {row.risk_level?.toLowerCase() === "critical" && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{row.name || "N/A"}</p>
                              <p className="text-xs text-slate-400">{row.student_id}</p>
                              {row.department && (
                                <p className="text-xs text-slate-400">{row.department}{row.year ? ` · Yr ${row.year}` : ""}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {row.email ? (
                              <a
                                href={`mailto:${row.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0B2B4F] transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {row.email}
                              </a>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No email</p>
                            )}
                            {row.mobile ? (
                              <a
                                href={`tel:${row.mobile}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0B2B4F] transition-colors"
                              >
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {row.mobile}
                              </a>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No mobile</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            Week {row.week}
                          </span>
                          {row.run_date && (
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(row.run_date?.seconds ? row.run_date.seconds * 1000 : row.run_date).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskStyle(row.risk_level)}`}>
                              {row.risk_level?.toLowerCase() === "critical" && (
                                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                </span>
                              )}
                              {row.risk_level ? row.risk_level.charAt(0).toUpperCase() + row.risk_level.slice(1).toLowerCase() : "Unknown"}
                            </span>
                            {getTrendIcon(row.risk_trend)}
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          {row.decision_reason ? (
                            <p className="text-xs text-slate-600 line-clamp-2">{row.decision_reason}</p>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No reason recorded</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {row.email && (
                              <a
                                href={`mailto:${row.email}?subject=Academic Support - AcademyGuard`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-[#0B2B4F] hover:bg-[#1A3A5F] text-white rounded-lg transition-colors shadow-sm"
                                title="Send Email"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </a>
                            )}
                            {row.mobile && (
                              <a
                                href={`tel:${row.mobile}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                                title="Call Student"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === index ? null : index); }}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <svg className={`w-3.5 h-3.5 transition-transform ${expandedRow === index ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === index && (
                        <tr key={`${index}-expanded`} className="bg-slate-50/80">
                          <td colSpan="6" className="px-5 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Department</p>
                                <p className="text-slate-700">{row.department || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Year</p>
                                <p className="text-slate-700">{row.year || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Reconstruction Error</p>
                                <p className="text-slate-700">{row.reconstruction_error !== null ? Number(row.reconstruction_error).toFixed(4) : "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Risk Trend</p>
                                <p className="text-slate-700">{row.risk_trend || "STABLE"}</p>
                              </div>
                              {row.decision_reason && (
                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Full Decision Reason</p>
                                  <p className="text-slate-700">{row.decision_reason}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-slate-50 rounded-full p-4">
                          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-slate-700 font-medium">No escalations found</p>
                        <p className="text-sm text-slate-400">No students require human intervention at this time.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredData.length > 0 && (
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filteredData.length}</span> of{" "}
                <span className="font-semibold text-slate-800">{data.length}</span> escalations
              </p>
              <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                Urgent: {stats.criticalRisk + stats.highRisk}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
