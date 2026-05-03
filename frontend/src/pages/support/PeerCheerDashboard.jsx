import { useEffect, useState } from "react";
import { getPeerCheerStudents } from "../../services/peerCheerService";

export default function PeerCheerDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "week", direction: "desc" });
  const [expandedRow, setExpandedRow] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPeerAssignments: 0,
    avgPeersPerStudent: 0,
    uniquePeers: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getPeerCheerStudents();
      setData(result);
      setFilteredData(result);
      calculateStats(result);
    } catch (error) {
      console.error("Error loading peer cheer data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, riskFilter, data]);

  const calculateStats = (rows) => {
    const allPeerIds = rows.flatMap(r => r.peers || []);
    const uniquePeers = new Set(allPeerIds).size;
    const total = allPeerIds.length;
    setStats({
      totalStudents: rows.length,
      totalPeerAssignments: total,
      avgPeersPerStudent: rows.length > 0 ? (total / rows.length).toFixed(1) : 0,
      uniquePeers,
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
        item.department?.toLowerCase().includes(q) ||
        item.peer_details?.some(p =>
          p.peer_name?.toLowerCase().includes(q) ||
          p.peer_id?.toLowerCase().includes(q) ||
          p.peer_email?.toLowerCase().includes(q)
        )
      );
    }
    if (riskFilter !== "all") {
      filtered = filtered.filter(item => item.risk_level?.toLowerCase() === riskFilter);
    }
    filtered.sort((a, b) => {
      if (sortConfig.key === "week") {
        return sortConfig.direction === "asc" ? a.week - b.week : b.week - a.week;
      }
      if (sortConfig.key === "peers") {
        const cA = a.peer_details?.length || a.peers?.length || 0;
        const cB = b.peer_details?.length || b.peers?.length || 0;
        return sortConfig.direction === "asc" ? cA - cB : cB - cA;
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
      if (key === "peers") {
        const cA = a.peer_details?.length || a.peers?.length || 0;
        const cB = b.peer_details?.length || b.peers?.length || 0;
        return direction === "asc" ? cA - cB : cB - cA;
      }
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
        <span className="inline-flex items-center gap-1 text-red-500 text-xs">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Worsening
        </span>
      );
      case "IMPROVING": return (
        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0V15m0-8l-8 8-4-4-6 6" />
          </svg>
          Improving
        </span>
      );
      default: return (
        <span className="text-slate-400 text-xs">Stable</span>
      );
    }
  };

  const SortIcon = ({ colKey }) => (
    <span className="ml-1 text-slate-400">
      {sortConfig.key === colKey ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-1.5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3 shadow-lg shadow-blue-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Peer Cheer Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Students receiving peer encouragement and support</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-slate-600">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Students Supported",
              value: stats.totalStudents,
              color: "text-slate-800",
              icon: (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
              bg: "from-blue-50 to-indigo-50",
            },
            {
              label: "Peer Assignments",
              value: stats.totalPeerAssignments,
              color: "text-slate-800",
              icon: (
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              ),
              bg: "from-purple-50 to-pink-50",
            },
            {
              label: "Avg Peers / Student",
              value: stats.avgPeersPerStudent,
              color: "text-slate-800",
              icon: (
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              bg: "from-amber-50 to-orange-50",
            },
            {
              label: "Unique Peers",
              value: stats.uniquePeers,
              color: "text-slate-800",
              icon: (
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ),
              bg: "from-emerald-50 to-teal-50",
            },
          ].map(({ label, value, color, icon, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </div>
                <div className={`bg-gradient-to-br ${bg} rounded-xl p-2.5`}>{icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by student, peer name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-md disabled:opacity-50"
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
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm("")} className="ml-0.5 font-bold hover:text-blue-900">×</button>
                </span>
              )}
              {riskFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Risk: {riskFilter}
                  <button onClick={() => setRiskFilter("all")} className="ml-0.5 font-bold hover:text-blue-900">×</button>
                </span>
              )}
              <span className="text-xs text-slate-500 self-center">{filteredData.length} result{filteredData.length !== 1 ? "s" : ""}</span>
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
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                    onClick={() => handleSort("peers")}
                  >
                    Assigned Peers <SortIcon colKey="peers" />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                        <p className="text-slate-500 text-sm">Loading peer cheer data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => {
                    const peerCount = row.peer_details?.length || row.peers?.length || 0;
                    return (
                      <>
                        <tr
                          key={index}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                {row.name?.charAt(0)?.toUpperCase() || "?"}
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
                                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors"
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
                                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors"
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
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskStyle(row.risk_level)}`}>
                                {row.risk_level ? row.risk_level.charAt(0).toUpperCase() + row.risk_level.slice(1).toLowerCase() : "Unknown"}
                              </span>
                              {getTrendIcon(row.risk_trend)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {row.peer_details && row.peer_details.length > 0 ? (
                                row.peer_details.map((peer, pIdx) => (
                                  <span
                                    key={`${row.student_id}-${peer.peer_id}-${pIdx}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                    {peer.peer_name || peer.peer_id}
                                  </span>
                                ))
                              ) : row.peers && row.peers.length > 0 ? (
                                row.peers.map((peer, pIdx) => (
                                  <span
                                    key={`${row.student_id}-${peer}-${pIdx}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    {peer}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">No peers assigned</span>
                              )}
                            </div>
                            {peerCount > 0 && (
                              <p className="text-xs text-slate-400 mt-1.5">{peerCount} peer{peerCount !== 1 ? "s" : ""}</p>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {row.email && (
                                <a
                                  href={`mailto:${row.email}?subject=Peer Support Check-in - AcademyGuard`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                                  title="Email Student"
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
                                title="View Peer Details"
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
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assigned Peer Details</p>
                              {row.peer_details && row.peer_details.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {row.peer_details.map((peer, pIdx) => (
                                    <div
                                      key={`${row.student_id}-detail-${peer.peer_id}-${pIdx}`}
                                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
                                    >
                                      <div className="flex items-center gap-2.5 mb-3">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                                          {(peer.peer_name || peer.peer_id)?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-slate-800">{peer.peer_name || peer.peer_id}</p>
                                          <p className="text-xs text-slate-400">{peer.peer_id}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        {peer.peer_email ? (
                                          <a
                                            href={`mailto:${peer.peer_email}`}
                                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                                          >
                                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {peer.peer_email}
                                          </a>
                                        ) : (
                                          <p className="text-xs text-slate-400 italic">No email</p>
                                        )}
                                        {peer.peer_mobile ? (
                                          <a
                                            href={`tel:${peer.peer_mobile}`}
                                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                                          >
                                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {peer.peer_mobile}
                                          </a>
                                        ) : (
                                          <p className="text-xs text-slate-400 italic">No mobile</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 italic">No detailed peer information available.</p>
                              )}
                              {row.decision_reason && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Decision Reason</p>
                                  <p className="text-sm text-slate-600">{row.decision_reason}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-slate-50 rounded-full p-4">
                          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-slate-700 font-medium">No students found</p>
                        <p className="text-sm text-slate-400">Try adjusting your search or filter criteria.</p>
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
                <span className="font-semibold text-slate-800">{data.length}</span> students
              </p>
              <span className="text-xs text-slate-400">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
