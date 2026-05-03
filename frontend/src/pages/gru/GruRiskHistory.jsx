import { useEffect, useState, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const COLLECTION = "student_gru_risk_history";

const RISK_CFG = {
  high:   { badge: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500"     },
  medium: { badge: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500"   },
  low:    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

function RiskBadge({ level }) {
  const key = level?.toLowerCase();
  const c = RISK_CFG[key] || { badge: "bg-slate-50 text-slate-500 border-slate-200", dot: "bg-slate-300" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {level?.toUpperCase() || "—"}
    </span>
  );
}

function TrendPill({ trend }) {
  const map = {
    increasing: { label: "Increasing", cls: "text-red-600 border-red-200 bg-red-50",          icon: "↑" },
    decreasing: { label: "Decreasing", cls: "text-emerald-600 border-emerald-200 bg-emerald-50", icon: "↓" },
    stable:     { label: "Stable",     cls: "text-slate-500 border-slate-200 bg-slate-50",    icon: "→" },
  };
  const c = map[trend?.toLowerCase()] || { label: trend || "—", cls: "text-slate-400 border-slate-200 bg-slate-50", icon: "—" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>
      <span className="font-semibold">{c.icon}</span>{c.label}
    </span>
  );
}

function ErrorBar({ value, max }) {
  const pct = max > 0 ? Math.min((value || 0) / max, 1) * 100 : 0;
  const color = pct > 75 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : pct > 25 ? "bg-blue-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
        {value != null ? value.toFixed(4) : "—"}
      </span>
      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
      {label}
      <button onClick={onRemove} className="ml-0.5 font-bold hover:opacity-70">×</button>
    </span>
  );
}

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

function ConfirmInline({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-600 font-medium">{message}</span>
      <button
        onClick={onConfirm} disabled={loading}
        className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold rounded-md disabled:opacity-50 transition"
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
      <button
        onClick={onCancel} disabled={loading}
        className="px-3 py-1 border border-slate-300 text-slate-600 text-xs rounded-md hover:bg-slate-50 transition"
      >
        Cancel
      </button>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function GruRiskHistory() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll]       = useState(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(null);
  const [deleting, setDeleting]                       = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("GRU history fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const deleteRecord = async () => {
    if (!confirmDeleteRecord) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, COLLECTION, confirmDeleteRecord.docId));
      setData(prev => prev.filter(r => r.id !== confirmDeleteRecord.docId));
      setConfirmDeleteRecord(null);
    } catch (err) {
      console.error("Delete record error:", err);
      alert("Failed to delete record: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllForStudent = async () => {
    if (!confirmDeleteAll) return;
    setDeleting(true);
    try {
      const toDelete = data.filter(r => r.student_id === confirmDeleteAll);
      await Promise.all(toDelete.map(r => deleteDoc(doc(db, COLLECTION, r.id))));
      setData(prev => prev.filter(r => r.student_id !== confirmDeleteAll));
      if (expandedId === confirmDeleteAll) setExpandedId(null);
      setConfirmDeleteAll(null);
    } catch (err) {
      console.error("Delete all error:", err);
      alert("Failed to delete records: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const studentMap = useMemo(() => {
    const map = {};
    data.forEach(item => {
      if (!item.student_id) return;
      (map[item.student_id] = map[item.student_id] || []).push(item);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => (b.week || 0) - (a.week || 0)));
    return map;
  }, [data]);

  const students = useMemo(() =>
    Object.entries(studentMap).map(([sid, recs]) => ({
      student_id: sid,
      latest: recs[0],
      history: recs,
    }))
  , [studentMap]);

  const maxError = useMemo(() =>
    Math.max(1, ...data.map(r => r.reconstruction_error || 0))
  , [data]);

  const stats = useMemo(() => {
    const latest = students.map(s => s.latest);
    return {
      students:   students.length,
      records:    data.length,
      highRisk:   latest.filter(r => r.risk_level?.toLowerCase() === "high").length,
      mediumRisk: latest.filter(r => r.risk_level?.toLowerCase() === "medium").length,
      lowRisk:    latest.filter(r => r.risk_level?.toLowerCase() === "low").length,
    };
  }, [students, data]);

  const filtered = useMemo(() =>
    students.filter(s => {
      if (search      && !s.student_id.toLowerCase().includes(search.toLowerCase())) return false;
      if (riskFilter !== "all" && s.latest.risk_level?.toLowerCase() !== riskFilter) return false;
      return true;
    })
  , [students, search, riskFilter]);

  const toggle = (sid) => {
    setConfirmDeleteAll(null);
    setConfirmDeleteRecord(null);
    setExpandedId(p => p === sid ? null : sid);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-0.5 bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-900 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">GRU Risk History</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                GRU model risk predictions · latest snapshot per student · click to expand
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-xs font-medium text-slate-600">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Students Tracked", value: stats.students,   accent: "border-blue-700",   num: "text-blue-900"  },
            { label: "Total Records",    value: stats.records,    accent: "border-slate-300",  num: "text-slate-800" },
            { label: "High Risk",        value: stats.highRisk,   accent: "border-red-400",    num: "text-slate-800" },
            { label: "Medium Risk",      value: stats.mediumRisk, accent: "border-amber-400",  num: "text-slate-800" },
            { label: "Low Risk",         value: stats.lowRisk,    accent: "border-emerald-400",num: "text-slate-800" },
          ].map(({ label, value, accent, num }) => (
            <div key={label} className={`bg-white rounded-xl px-4 py-4 border border-slate-200 border-l-4 ${accent} shadow-sm`}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 leading-none">{label}</p>
              <p className={`text-2xl font-bold leading-none ${num}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search student ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
              />
            </div>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm disabled:opacity-50 shrink-0"
            >
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
          {(search || riskFilter !== "all") && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400">Active filters:</span>
              {search           && <Chip label={`ID: ${search}`}          onRemove={() => setSearch("")} />}
              {riskFilter !== "all" && <Chip label={`Risk: ${riskFilter}`} onRemove={() => setRiskFilter("all")} />}
            </div>
          )}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading…"
                : <><span className="font-semibold text-slate-800">{filtered.length}</span> student{filtered.length !== 1 ? "s" : ""} · <span className="font-semibold text-slate-800">{data.length}</span> total records</>
              }
            </p>
            <span className="text-xs text-slate-400">Click a row to expand</span>
          </div>

          {loading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-blue-200 border-t-blue-800" />
              <p className="text-sm text-slate-500">Loading GRU risk history…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No records found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or run a GRU prediction first</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="divide-y divide-slate-100">
              {filtered.map(({ student_id, latest, history }) => {
                const isOpen        = expandedId === student_id;
                const isDeletingAll = confirmDeleteAll === student_id;

                return (
                  <div key={student_id} className="group">

                    {/* Student row */}
                    <div className={`px-5 py-3.5 transition-colors ${isOpen ? "bg-blue-50/40" : "hover:bg-slate-50/80"}`}>
                      <div className="flex items-center gap-3">

                        <button
                          onClick={() => toggle(student_id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left flex-wrap"
                        >
                          <div className="h-9 w-9 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                            {student_id?.slice(-2) || "??"}
                          </div>

                          <div className="min-w-[90px] shrink-0">
                            <p className="font-mono font-semibold text-slate-800 text-sm leading-none">{student_id}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{history.length} week{history.length !== 1 ? "s" : ""}</p>
                          </div>

                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono shrink-0">
                            Week {latest.week ?? "—"}
                          </span>
                          <RiskBadge level={latest.risk_level} />
                          <TrendPill trend={latest.risk_trend} />

                          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                            <span>Error</span>
                            <ErrorBar value={latest.reconstruction_error} max={maxError} />
                          </div>
                        </button>

                        <div className="shrink-0 flex items-center gap-1.5 ml-auto">
                          {isDeletingAll ? (
                            <ConfirmInline
                              message={`Delete all ${history.length} records for ${student_id}?`}
                              onConfirm={deleteAllForStudent}
                              onCancel={() => setConfirmDeleteAll(null)}
                              loading={deleting}
                            />
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDeleteRecord(null); setConfirmDeleteAll(student_id); }}
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                              title="Delete all records for this student"
                            >
                              <TrashIcon /> Delete All
                            </button>
                          )}

                          <button
                            onClick={() => toggle(student_id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded panel */}
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-blue-50/20 px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Week-by-week history — {history.length} record{history.length !== 1 ? "s" : ""}
                          </p>
                          <button
                            onClick={() => toggle(student_id)}
                            className="text-xs text-slate-400 hover:text-slate-600 transition"
                          >
                            Collapse ↑
                          </button>
                        </div>

                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3 font-semibold">Week</th>
                                <th className="px-4 py-3 font-semibold">Risk Level</th>
                                <th className="px-4 py-3 font-semibold">Trend</th>
                                <th className="px-4 py-3 font-semibold">Reconstruction Error</th>
                                <th className="px-4 py-3 font-semibold">Run Date</th>
                                <th className="px-4 py-3 font-semibold w-10" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {history.map((rec, i) => {
                                const isConfirmingThis = confirmDeleteRecord?.docId === rec.id;
                                return (
                                  <tr
                                    key={rec.id || i}
                                    className={`group/row transition-colors ${i === 0 ? "bg-blue-50/40" : "hover:bg-slate-50"}`}
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-slate-700">Week {rec.week ?? "—"}</span>
                                        {i === 0 && (
                                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                                            latest
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <RiskBadge level={rec.risk_level} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <TrendPill trend={rec.risk_trend} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <ErrorBar value={rec.reconstruction_error} max={maxError} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                      {formatDate(rec.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                      {isConfirmingThis ? (
                                        <ConfirmInline
                                          message={`Delete week ${rec.week}?`}
                                          onConfirm={deleteRecord}
                                          onCancel={() => setConfirmDeleteRecord(null)}
                                          loading={deleting}
                                        />
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setConfirmDeleteAll(null);
                                            setConfirmDeleteRecord({ studentId: student_id, docId: rec.id, week: rec.week });
                                          }}
                                          className="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                          title={`Delete week ${rec.week} record`}
                                        >
                                          <TrashIcon />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""} · {data.length} total records
              </span>
              <span>Updated {new Date().toLocaleTimeString()}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
