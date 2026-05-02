import { useEffect, useState } from "react";
import { getPeerCheerStudents } from "../../services/peerCheerService";

export default function PeerCheerDashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'week', direction: 'desc' });
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPeers: 0,
    avgPeersPerStudent: 0,
    uniquePeers: 0
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
  }, [searchTerm, data]);

  const calculateStats = (data) => {
    const allPeers = data.flatMap(item => item.peers || []);
    const uniquePeers = new Set(allPeers).size;
    const totalPeers = allPeers.length;
    
    setStats({
      totalStudents: data.length,
      totalPeers: totalPeers,
      avgPeersPerStudent: data.length > 0 ? (totalPeers / data.length).toFixed(1) : 0,
      uniquePeers: uniquePeers
    });
  };

  const filterData = () => {
    if (!searchTerm) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item => 
      item.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.peer_details?.some(peer =>
        peer.peer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peer.peer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peer.peer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peer.peer_mobile?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      item.peers?.some(peer => peer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    const sorted = [...filteredData].sort((a, b) => {
      if (key === 'week') {
        return direction === 'asc' ? a.week - b.week : b.week - a.week;
      }
      if (key === 'peers') {
        const countA = a.peers?.length || 0;
        const countB = b.peers?.length || 0;
        return direction === 'asc' ? countA - countB : countB - countA;
      }
      return 0;
    });

    setFilteredData(sorted);
    setSortConfig({ key, direction });
  };

  // Get gradient based on peer count
  const getPeerCountGradient = (count, max) => {
    const percentage = (count / max) * 100;
    if (percentage > 75) return 'from-emerald-500 to-teal-500';
    if (percentage > 50) return 'from-blue-500 to-indigo-500';
    if (percentage > 25) return 'from-amber-500 to-orange-500';
    return 'from-slate-400 to-slate-500';
  };

  const maxPeerCount = Math.max(
    1,
    ...data.map(item => item.peer_details?.length || item.peers?.length || 0)
  );

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Peer Cheer Dashboard
              </h1>
              <p className="text-slate-500 mt-1 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                Track peer encouragement and support networks
              </p>
            </div>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-600">Live</span>
          </div>
        </div>

        {/* Stats Cards with Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalStudents}</p>
                <p className="text-xs text-slate-400 mt-1">Active participants</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Peer Connections</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalPeers}</p>
                <p className="text-xs text-slate-400 mt-1">Total interactions</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg per Student</p>
                <p className="text-3xl font-bold text-slate-800">{stats.avgPeersPerStudent}</p>
                <p className="text-xs text-slate-400 mt-1">Connections/student</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Unique Peers</p>
                <p className="text-3xl font-bold text-slate-800">{stats.uniquePeers}</p>
                <p className="text-xs text-slate-400 mt-1">Distinct individuals</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 group-hover:from-emerald-100 group-hover:to-teal-100 rounded-xl p-3 transition-colors">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section with Advanced Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by ID, name, email, or peer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              onClick={loadData}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>

          {searchTerm && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filteredData.length} results
              </span>
              <span className="text-slate-500">found for "{searchTerm}"</span>
            </div>
          )}
        </div>

        {/* Data Table with Modern Design */}
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
                          <span className="text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : (
                          <span className="text-slate-400">↕️</span>
                        )}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('peers')}
                  >
                    <div className="flex items-center gap-2">
                      Peer Connections
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === 'peers' ? (
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
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Loading peer cheer data...</p>
                        <p className="text-sm text-slate-400">Please wait a moment</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {row.name?.charAt(0)?.toUpperCase() || row.student_id?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="absolute -bottom-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-emerald-400"></span>
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
                            <a href={`mailto:${row.email}`} className="hover:text-blue-600 transition-colors">
                              {row.email || 'N/A'}
                            </a>
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${row.mobile}`} className="hover:text-blue-600 transition-colors">
                              {row.mobile || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          Week {row.week}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {row.peer_details && row.peer_details.length > 0 ? (
                            row.peer_details.map((peer, peerIndex) => (
                              <div
                                key={`${row.student_id}-${peer.peer_id}-${peerIndex}`}
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all cursor-default"
                              >
                                <div className="flex flex-col">
                                  <span className="font-semibold">{peer.peer_name || peer.peer_id}</span>
                                  <span className="text-slate-400 text-[10px]">{peer.peer_email || "No email"}</span>
                                  <span className="text-slate-400 text-[10px]">{peer.peer_mobile || "No mobile"}</span>
                                </div>
                              </div>
                            ))
                          ) : row.peers && row.peers.length > 0 ? (
                            // Fallback to old peers array if peer_details not available
                            row.peers.map((peer, peerIndex) => (
                              <span
                                key={`${row.student_id}-${peer}-${peerIndex}`}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all cursor-default"
                              >
                                {peer}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm italic">No peers assigned</span>
                          )}
                        </div>
                        {row.peer_details && row.peer_details.length > 0 && (
                          <div className="mt-2">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${getPeerCountGradient(row.peer_details.length, maxPeerCount)}`}
                                style={{ width: `${(row.peer_details.length / maxPeerCount) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-50 rounded-full p-4 mb-3">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-slate-700 text-lg font-medium">No students found</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          
          {!loading && filteredData.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-800">{filteredData.length}</span> of{' '}
                  <span className="font-semibold text-slate-800">{data.length}</span> students
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
