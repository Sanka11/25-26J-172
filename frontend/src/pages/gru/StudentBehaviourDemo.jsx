import { useState } from "react";
import { db } from "../../config/firebase";
import {
  collection, query, where, getDocs,
  setDoc, doc, deleteDoc, serverTimestamp,
} from "firebase/firestore";

const BASE_URL = "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

// ─── Week ID helpers (match backend format) ──────────────────────────────────
function parseWeekNum(weekStr) {
  const m = String(weekStr || "").match(/W(\d+)/);
  return m ? parseInt(m[1]) : 0;
}
function formatWeekStr(n) {
  const year = new Date().getFullYear();
  return `${year}-W${String(n).padStart(2, "0")}`;
}
function weeklyDocId(studentId, weekStr) {
  const yy = new Date().getFullYear().toString().slice(-2);
  const wp = String(weekStr).split("-")[1] || "W01";
  return `${studentId}-${yy}-${wp}`;
}
function gruRlDocId(studentId, weekStr) {
  const wp = String(weekStr).split("-")[1] || "W01";
  return `${studentId}-${wp}`;
}
function extractWeekFields(w) {
  return {
    login_count:              Number(w.login_count)              || 0,
    avg_session_duration_min: Number(w.avg_session_duration_min) || 0,
    total_active_time_min:    Number(w.total_active_time_min)    || 0,
    days_since_last_login:    Number(w.days_since_last_login)    || 0,
    page_views:               Number(w.page_views)               || 0,
    assignments_submitted:    Number(w.assignments_submitted)    || 0,
    on_time_submissions:      Number(w.on_time_submissions)      || 0,
    late_submissions:         Number(w.late_submissions)         || 0,
    alerts_responded:         Number(w.alerts_responded)         || 0,
    response_rate:            Number(w.response_rate)            || 0,
  };
}

// ─── Preset 10-week datasets verified against V3 GRU model ───────────────────
const PRESET_WEEKS = {
  LOW: [
    { login_count: 7, avg_session_duration_min: 38, total_active_time_min: 280, days_since_last_login: 0, page_views: 120, assignments_submitted: 3, on_time_submissions: 3, late_submissions: 0, alerts_responded: 2, response_rate: 0.90 },
    { login_count: 6, avg_session_duration_min: 35, total_active_time_min: 260, days_since_last_login: 1, page_views: 110, assignments_submitted: 2, on_time_submissions: 2, late_submissions: 0, alerts_responded: 1, response_rate: 0.85 },
    { login_count: 8, avg_session_duration_min: 40, total_active_time_min: 300, days_since_last_login: 0, page_views: 130, assignments_submitted: 3, on_time_submissions: 3, late_submissions: 0, alerts_responded: 2, response_rate: 0.92 },
    { login_count: 7, avg_session_duration_min: 36, total_active_time_min: 270, days_since_last_login: 1, page_views: 115, assignments_submitted: 2, on_time_submissions: 2, late_submissions: 0, alerts_responded: 1, response_rate: 0.88 },
    { login_count: 6, avg_session_duration_min: 33, total_active_time_min: 250, days_since_last_login: 0, page_views: 105, assignments_submitted: 3, on_time_submissions: 3, late_submissions: 0, alerts_responded: 2, response_rate: 0.87 },
    { login_count: 7, avg_session_duration_min: 39, total_active_time_min: 285, days_since_last_login: 1, page_views: 125, assignments_submitted: 2, on_time_submissions: 2, late_submissions: 0, alerts_responded: 1, response_rate: 0.91 },
    { login_count: 8, avg_session_duration_min: 41, total_active_time_min: 310, days_since_last_login: 0, page_views: 135, assignments_submitted: 3, on_time_submissions: 3, late_submissions: 0, alerts_responded: 2, response_rate: 0.93 },
    { login_count: 6, avg_session_duration_min: 37, total_active_time_min: 265, days_since_last_login: 1, page_views: 112, assignments_submitted: 2, on_time_submissions: 2, late_submissions: 0, alerts_responded: 1, response_rate: 0.86 },
    { login_count: 7, avg_session_duration_min: 38, total_active_time_min: 275, days_since_last_login: 0, page_views: 118, assignments_submitted: 3, on_time_submissions: 3, late_submissions: 0, alerts_responded: 2, response_rate: 0.89 },
    { login_count: 8, avg_session_duration_min: 42, total_active_time_min: 320, days_since_last_login: 1, page_views: 140, assignments_submitted: 3, on_time_submissions: 3, late_submissions: 0, alerts_responded: 2, response_rate: 0.94 },
  ],
  NORMAL: [
    { login_count: 3, avg_session_duration_min: 18, total_active_time_min: 130, days_since_last_login: 2, page_views: 55,  assignments_submitted: 1, on_time_submissions: 1, late_submissions: 0, alerts_responded: 1, response_rate: 0.55 },
    { login_count: 2, avg_session_duration_min: 12, total_active_time_min: 90,  days_since_last_login: 3, page_views: 35,  assignments_submitted: 1, on_time_submissions: 0, late_submissions: 1, alerts_responded: 0, response_rate: 0.35 },
    { login_count: 4, avg_session_duration_min: 20, total_active_time_min: 150, days_since_last_login: 1, page_views: 65,  assignments_submitted: 2, on_time_submissions: 1, late_submissions: 0, alerts_responded: 1, response_rate: 0.60 },
    { login_count: 2, avg_session_duration_min: 10, total_active_time_min: 85,  days_since_last_login: 3, page_views: 30,  assignments_submitted: 1, on_time_submissions: 1, late_submissions: 0, alerts_responded: 0, response_rate: 0.32 },
    { login_count: 3, avg_session_duration_min: 17, total_active_time_min: 120, days_since_last_login: 2, page_views: 50,  assignments_submitted: 1, on_time_submissions: 1, late_submissions: 0, alerts_responded: 0, response_rate: 0.50 },
    { login_count: 4, avg_session_duration_min: 22, total_active_time_min: 160, days_since_last_login: 1, page_views: 70,  assignments_submitted: 2, on_time_submissions: 2, late_submissions: 0, alerts_responded: 1, response_rate: 0.65 },
    { login_count: 2, avg_session_duration_min: 11, total_active_time_min: 88,  days_since_last_login: 3, page_views: 32,  assignments_submitted: 1, on_time_submissions: 0, late_submissions: 1, alerts_responded: 0, response_rate: 0.33 },
    { login_count: 3, avg_session_duration_min: 16, total_active_time_min: 115, days_since_last_login: 2, page_views: 48,  assignments_submitted: 1, on_time_submissions: 1, late_submissions: 0, alerts_responded: 0, response_rate: 0.48 },
    { login_count: 4, avg_session_duration_min: 21, total_active_time_min: 145, days_since_last_login: 1, page_views: 62,  assignments_submitted: 2, on_time_submissions: 1, late_submissions: 0, alerts_responded: 1, response_rate: 0.58 },
    { login_count: 2, avg_session_duration_min: 13, total_active_time_min: 95,  days_since_last_login: 3, page_views: 38,  assignments_submitted: 1, on_time_submissions: 1, late_submissions: 0, alerts_responded: 0, response_rate: 0.40 },
  ],
  HIGH: [
    { login_count: 0, avg_session_duration_min: 3,  total_active_time_min: 20,  days_since_last_login: 6, page_views: 8,   assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.05 },
    { login_count: 1, avg_session_duration_min: 5,  total_active_time_min: 35,  days_since_last_login: 4, page_views: 12,  assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.08 },
    { login_count: 0, avg_session_duration_min: 2,  total_active_time_min: 15,  days_since_last_login: 7, page_views: 5,   assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.03 },
    { login_count: 0, avg_session_duration_min: 4,  total_active_time_min: 25,  days_since_last_login: 5, page_views: 10,  assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.06 },
    { login_count: 1, avg_session_duration_min: 6,  total_active_time_min: 40,  days_since_last_login: 4, page_views: 14,  assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.10 },
    { login_count: 0, avg_session_duration_min: 3,  total_active_time_min: 18,  days_since_last_login: 7, page_views: 7,   assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.04 },
    { login_count: 0, avg_session_duration_min: 2,  total_active_time_min: 12,  days_since_last_login: 8, page_views: 4,   assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.02 },
    { login_count: 1, avg_session_duration_min: 5,  total_active_time_min: 30,  days_since_last_login: 5, page_views: 11,  assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.07 },
    { login_count: 0, avg_session_duration_min: 3,  total_active_time_min: 20,  days_since_last_login: 6, page_views: 8,   assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.05 },
    { login_count: 0, avg_session_duration_min: 2,  total_active_time_min: 10,  days_since_last_login: 9, page_views: 3,   assignments_submitted: 0, on_time_submissions: 0, late_submissions: 0, alerts_responded: 0, response_rate: 0.01 },
  ],
};

const FIELD_LABELS = {
  login_count:              "Login Count",
  avg_session_duration_min: "Avg Session (min)",
  total_active_time_min:    "Total Active (min)",
  days_since_last_login:    "Days Inactive",
  page_views:               "Page Views",
  assignments_submitted:    "Assignments",
  on_time_submissions:      "On-Time Submits",
  late_submissions:         "Late Submits",
  alerts_responded:         "Alerts Responded",
  response_rate:            "Response Rate",
};

const PATTERN_CONFIG = {
  LOW:    { label: "Low Risk",    color: "green",  dot: "bg-green-500",  badge: "bg-green-100 text-green-800 border-green-200",  desc: "Active, consistent student"      },
  NORMAL: { label: "Normal Risk", color: "yellow", dot: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-800 border-yellow-200", desc: "Inconsistent student"            },
  HIGH:   { label: "High Risk",   color: "red",    dot: "bg-red-500",    badge: "bg-red-100 text-red-800 border-red-200",          desc: "Disengaged / at-risk student"   },
};

const RISK_CONFIG = {
  LOW:    { badge: "bg-green-100 text-green-800 border-green-300",  label: "LOW",    icon: "🟢" },
  NORMAL: { badge: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "NORMAL", icon: "🟡" },
  HIGH:   { badge: "bg-red-100 text-red-800 border-red-300",        label: "HIGH",   icon: "🔴" },
};

const ACTION_CONFIG = {
  SOFT_NUDGE:       { badge: "bg-blue-100 text-blue-800",   label: "Soft Nudge" },
  REMINDER:         { badge: "bg-indigo-100 text-indigo-800", label: "Reminder"   },
  PEER_CHEER:       { badge: "bg-purple-100 text-purple-800", label: "Peer Cheer" },
  HUMAN_ESCALATION: { badge: "bg-red-100 text-red-800",     label: "Escalate"   },
  DO_NOTHING:       { badge: "bg-gray-100 text-gray-700",   label: "No Action"  },
};

// ─── Small reusable components ────────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || { badge: "bg-gray-100 text-gray-700 border-gray-300", label: level || "—", icon: "⚪" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${cfg.badge}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { badge: "bg-gray-100 text-gray-700", label: action || "—" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

function TrendBadge({ trend }) {
  const map = { INCREASING: "📈 Increasing", DECREASING: "📉 Decreasing", STABLE: "➡️ Stable", UNKNOWN: "❓ Unknown" };
  return <span className="text-sm font-medium">{map[trend] || trend || "—"}</span>;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-indigo-600 text-indigo-700"
          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function FieldInput({ name, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{FIELD_LABELS[name]}</label>
      <input
        type="number"
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentBehaviourDemo() {
  const [studentId, setStudentId]       = useState("");
  const [idError, setIdError]           = useState("");
  const [studentData, setStudentData]   = useState(null); // null = not searched yet
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [activeTab, setActiveTab] = useState("data");

  // Add-week form
  const [weekForm, setWeekForm]     = useState({ ...PRESET_WEEKS.LOW[0] });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg]         = useState(null); // { type, text }

  // Initialize 10 weeks
  const [initPattern, setInitPattern]   = useState("LOW");
  const [initLoading, setInitLoading]   = useState(false);

  // GRU / RL
  const [gruResult, setGruResult]   = useState(null);
  const [rlResult, setRlResult]     = useState(null);
  const [gruLoading, setGruLoading] = useState(false);
  const [rlLoading, setRlLoading]   = useState(false);
  const [gruError, setGruError]     = useState(null);
  const [rlError, setRlError]       = useState(null);

  // Clear confirmation
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const validateId = (id) => /^\d{4}$/.test(id);

  const handleIdChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setStudentId(val);
    setIdError(val && !validateId(val) ? "Must be exactly 4 digits" : "");
  };

  const resetResults = () => {
    setGruResult(null);
    setRlResult(null);
    setGruError(null);
    setRlError(null);
  };

  // ─── Firestore helpers ──────────────────────────────────────────────────────
  const getStudentWeeks = async (sid) => {
    const snap = await getDocs(
      query(collection(db, "student_weekly_records"), where("student_id", "==", sid))
    );
    return snap.docs
      .map(d => d.data())
      .sort((a, b) => parseWeekNum(a.week) - parseWeekNum(b.week));
  };

  // ─── API calls ──────────────────────────────────────────────────────────────
  const loadStudent = async (id) => {
    const sid = id || studentId;
    setLoadingStudent(true);
    setStudentData(null);
    resetResults();
    setAddMsg(null);
    try {
      const weeks = await getStudentWeeks(sid);
      setStudentData({ weeks, weeksFetched: weeks.length });
      setActiveTab(weeks.length === 0 ? "add" : "data");
    } catch {
      setStudentData({ error: true });
    } finally {
      setLoadingStudent(false);
    }
  };

  const initializeStudent = async () => {
    setInitLoading(true);
    try {
      const existing = await getStudentWeeks(studentId);
      const maxWeek  = existing.length > 0 ? Math.max(...existing.map(w => parseWeekNum(w.week))) : 0;
      const weekData = PRESET_WEEKS[initPattern];

      await Promise.all(
        weekData.map((row, i) => {
          const weekStr = formatWeekStr(maxWeek + i + 1);
          return setDoc(doc(db, "student_weekly_records", weeklyDocId(studentId, weekStr)), {
            student_id: studentId,
            week: weekStr,
            ...row,
            updatedAt: serverTimestamp(),
          });
        })
      );

      await loadStudent(studentId);
      setActiveTab("data");
    } catch (e) {
      alert("Failed to initialize: " + e.message);
    } finally {
      setInitLoading(false);
    }
  };

  const addSingleWeek = async () => {
    setAddLoading(true);
    setAddMsg(null);
    try {
      const existing = await getStudentWeeks(studentId);
      const maxWeek  = existing.length > 0 ? Math.max(...existing.map(w => parseWeekNum(w.week))) : 0;
      const weekStr  = formatWeekStr(maxWeek + 1);
      const numeric  = Object.fromEntries(Object.entries(weekForm).map(([k, v]) => [k, Number(v)]));

      await setDoc(doc(db, "student_weekly_records", weeklyDocId(studentId, weekStr)), {
        student_id: studentId,
        week: weekStr,
        ...numeric,
        updatedAt: serverTimestamp(),
      });

      setAddMsg({ type: "ok", text: `Week ${weekStr} added successfully.` });
      await loadStudent(studentId);
    } catch (e) {
      setAddMsg({ type: "err", text: e.message });
    } finally {
      setAddLoading(false);
    }
  };

  const runGru = async () => {
    setGruLoading(true);
    setGruResult(null);
    setGruError(null);
    try {
      // 1. Read last 10 weeks from real Firestore
      const allWeeks  = await getStudentWeeks(studentId);
      if (allWeeks.length < 10) throw new Error("Need at least 10 weeks of data");
      const last10    = allWeeks.slice(-10);
      const latestWeek = last10[last10.length - 1].week;
      const weeks     = last10.map(extractWeekFields);

      // 2. Read previous GRU result for trend calculation
      const prevSnap  = await getDocs(
        query(collection(db, "student_gru_risk_history"), where("student_id", "==", studentId))
      );
      const prevDocs  = prevSnap.docs.map(d => d.data()).sort((a, b) => parseWeekNum(a.week) - parseWeekNum(b.week));
      const prevError = prevDocs.length > 0 ? prevDocs[prevDocs.length - 1].reconstruction_error : null;

      // 3. Call backend for ML computation only (no Firestore in backend)
      const res = await fetch(`${BASE_URL}/gru/compute-only`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks, previous_error: prevError }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GRU failed");

      // 4. Save result directly to real Firestore
      const record = {
        student_id: studentId,
        week: latestWeek,
        reconstruction_error: data.reconstruction_error,
        risk_level: data.risk_level,
        risk_trend: data.risk_trend,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "student_gru_risk_history", gruRlDocId(studentId, latestWeek)), record);

      setGruResult(record);
    } catch (e) {
      setGruError(e.message);
    } finally {
      setGruLoading(false);
    }
  };

  const runRl = async () => {
    setRlLoading(true);
    setRlResult(null);
    setRlError(null);
    try {
      // 1. Read last 10 weeks from real Firestore
      const allWeeks = await getStudentWeeks(studentId);
      if (allWeeks.length < 10) throw new Error("Need at least 10 weeks of data");
      const weeks    = allWeeks.slice(-10).map(extractWeekFields);

      // 2. Read latest GRU result from real Firestore
      const gruSnap  = await getDocs(
        query(collection(db, "student_gru_risk_history"), where("student_id", "==", studentId))
      );
      if (gruSnap.empty) throw new Error("No GRU result found. Run GRU first.");
      const gruDocs  = gruSnap.docs.map(d => d.data()).sort((a, b) => parseWeekNum(a.week) - parseWeekNum(b.week));
      const latestGru = gruDocs[gruDocs.length - 1];

      // 3. Read previous RL record for streak/fatigue tracking
      const rlSnap   = await getDocs(
        query(collection(db, "student_rl_intervention_history"), where("student_id", "==", studentId))
      );
      let last_action = "SOFT_NUDGE", no_response_streak = 0, fatigue_level = 0;
      if (!rlSnap.empty) {
        const prev = rlSnap.docs.map(d => d.data()).sort((a, b) => parseWeekNum(a.week) - parseWeekNum(b.week)).pop();
        last_action        = prev.action || "SOFT_NUDGE";
        no_response_streak = prev.no_response_streak || 0;
        fatigue_level      = prev.fatigue_level || 0;
        if (latestGru.risk_trend === "INCREASING")  no_response_streak += 1;
        if (latestGru.risk_trend === "DECREASING")  no_response_streak  = 0;
        if (last_action === "REMINDER" || last_action === "PEER_CHEER") fatigue_level += 1;
        if (last_action === "HUMAN_ESCALATION")     fatigue_level = 0;
      }

      // 4. Call backend for RL computation only (no Firestore in backend)
      const res = await fetch(`${BASE_URL}/rl/compute-only`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks, risk_trend: latestGru.risk_trend, last_action, no_response_streak, fatigue_level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "RL failed");

      // 5. Save result directly to real Firestore
      const record = {
        student_id: studentId,
        week: latestGru.week,
        risk_level: data.risk_level || latestGru.risk_level,
        risk_trend: data.risk_trend || latestGru.risk_trend,
        action: data.action,
        decision_reason: data.decision_reason,
        last_action,
        no_response_streak,
        fatigue_level,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "student_rl_intervention_history", gruRlDocId(studentId, latestGru.week)), record);

      setRlResult(record);
    } catch (e) {
      setRlError(e.message);
    } finally {
      setRlLoading(false);
    }
  };

  const clearWeeks = async () => {
    setClearLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "student_weekly_records"), where("student_id", "==", studentId))
      );
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      setConfirmClear(false);
      resetResults();
      await loadStudent(studentId);
    } catch (e) {
      alert("Failed to clear: " + e.message);
    } finally {
      setClearLoading(false);
    }
  };

  const fillForm = (pattern) => {
    const weeks = PRESET_WEEKS[pattern];
    const pick  = weeks[Math.floor(Math.random() * weeks.length)];
    setWeekForm({ ...pick });
  };

  const handleFormChange = (e) => {
    setWeekForm({ ...weekForm, [e.target.name]: e.target.value });
  };

  // ─── Derived values ──────────────────────────────────────────────────────────
  const weekCount   = studentData?.weeksFetched ?? 0;
  const weeks       = studentData?.weeks ?? [];
  const hasEnough   = weekCount >= 10;
  const hasStudent  = studentData && !studentData.error;
  const gruRan      = !!gruResult;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold">Student Disengagement Analyzer</h1>
          <p className="text-indigo-300 text-sm mt-1">GRU + RL model — V3</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Student Lookup ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Select Student</h2>
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <input
                type="text"
                placeholder="4-digit ID (e.g. 0001)"
                value={studentId}
                onChange={handleIdChange}
                onKeyDown={(e) => e.key === "Enter" && validateId(studentId) && loadStudent()}
                maxLength={4}
                className={`w-44 px-4 py-2 border rounded-lg font-mono text-center text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  idError ? "border-red-400" : "border-slate-300"
                }`}
              />
              {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
            </div>
            <button
              onClick={() => loadStudent()}
              disabled={!validateId(studentId) || loadingStudent}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {loadingStudent ? "Loading…" : "Load Student"}
            </button>
          </div>
        </div>

        {/* ── Status bar ── */}
        {hasStudent && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="font-mono font-semibold text-lg text-slate-900">{studentId}</span>
              <span className={`font-medium ${weekCount === 0 ? "text-slate-400" : "text-slate-700"}`}>
                {weekCount === 0 ? "No records yet" : `${weekCount} week${weekCount > 1 ? "s" : ""} on record`}
              </span>
              {weekCount > 0 && (
                <span className="text-slate-500">
                  Latest: <span className="font-medium text-slate-700">{weeks[weeks.length - 1]?.week || "—"}</span>
                </span>
              )}
              {hasEnough ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Ready for prediction</span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Need {10 - weekCount} more week{10 - weekCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Clear button */}
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                🗑️ Clear Records
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium">Delete all {weekCount} records?</span>
                <button
                  onClick={clearWeeks}
                  disabled={clearLoading}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {clearLoading ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Error loading student ── */}
        {studentData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
            Could not load student data. Check that the backend is running.
          </div>
        )}

        {/* ── Main content (tabs) ── */}
        {hasStudent && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200 px-4 overflow-x-auto">
              <TabButton active={activeTab === "data"} onClick={() => setActiveTab("data")}>
                📊 Weekly Records {weekCount > 0 && `(${weekCount})`}
              </TabButton>
              <TabButton active={activeTab === "add"} onClick={() => setActiveTab("add")}>
                ➕ Add Data
              </TabButton>
              <TabButton active={activeTab === "predict"} onClick={() => setActiveTab("predict")}>
                🧠 Predict Risk
              </TabButton>
            </div>

            {/* ── TAB: Weekly Records ── */}
            {activeTab === "data" && (
              <div className="p-6">
                {weekCount === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="font-medium text-slate-600">No records found for student {studentId}</p>
                    <p className="text-sm mt-1">Go to <strong>Add Data</strong> to initialize this student.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">Week</th>
                          {Object.keys(FIELD_LABELS).map((k) => (
                            <th key={k} className="px-3 py-2 text-right font-semibold text-slate-600 whitespace-nowrap">
                              {FIELD_LABELS[k]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {weeks.map((w, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                            <td className="px-3 py-2 font-mono text-slate-700 whitespace-nowrap">{w.week || `W${i + 1}`}</td>
                            {Object.keys(FIELD_LABELS).map((k) => (
                              <td key={k} className="px-3 py-2 text-right font-mono text-slate-700">
                                {k === "response_rate"
                                  ? Number(w[k]).toFixed(2)
                                  : w[k] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: Add Data ── */}
            {activeTab === "add" && (
              <div className="p-6 space-y-8">

                {/* Initialize section — shown when no records */}
                {weekCount === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-6">
                    <h3 className="text-base font-semibold text-indigo-900 mb-1">Initialize Student</h3>
                    <p className="text-sm text-indigo-600 mb-5">
                      This student has no records. Choose a risk pattern to load 10 pre-built weeks.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                      {Object.entries(PATTERN_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => setInitPattern(key)}
                          className={`relative p-4 rounded-xl border-2 text-left transition ${
                            initPattern === key
                              ? `border-${cfg.color}-500 bg-${cfg.color}-50`
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                            <span className="font-semibold text-sm text-slate-800">{cfg.label}</span>
                          </div>
                          <p className="text-xs text-slate-500">{cfg.desc}</p>
                          {initPattern === key && (
                            <span className="absolute top-2 right-2 text-xs font-bold text-indigo-600">✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Preview of first week */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Preview — Week 1 of 10
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {Object.entries(FIELD_LABELS).map(([k, label]) => (
                          <div key={k} className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-slate-800">
                              {k === "response_rate"
                                ? PRESET_WEEKS[initPattern][0][k].toFixed(2)
                                : PRESET_WEEKS[initPattern][0][k]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={initializeStudent}
                      disabled={initLoading}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
                    >
                      {initLoading ? "Saving…" : `Initialize with 10 ${PATTERN_CONFIG[initPattern].label} Weeks →`}
                    </button>
                  </div>
                )}

                {/* Add single week */}
                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">Add Single Week</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Quick-fill from a pattern, then adjust values and save.
                  </p>

                  {/* Quick fill buttons */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs font-medium text-slate-500 self-center mr-1">Quick fill:</span>
                    {Object.entries(PATTERN_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => fillForm(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition
                          ${key === "LOW"    ? "border-green-300  bg-green-50  text-green-700  hover:bg-green-100"  : ""}
                          ${key === "NORMAL" ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : ""}
                          ${key === "HIGH"   ? "border-red-300    bg-red-50    text-red-700    hover:bg-red-100"    : ""}
                        `}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    ))}
                  </div>

                  {/* Form grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                    {Object.keys(FIELD_LABELS).map((k) => (
                      <FieldInput
                        key={k}
                        name={k}
                        value={weekForm[k]}
                        onChange={handleFormChange}
                      />
                    ))}
                  </div>

                  {addMsg && (
                    <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                      addMsg.type === "ok"
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                      {addMsg.type === "ok" ? "✅" : "❌"} {addMsg.text}
                    </div>
                  )}

                  <button
                    onClick={addSingleWeek}
                    disabled={addLoading}
                    className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 font-semibold transition"
                  >
                    {addLoading ? "Saving…" : "Add This Week →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: Predict Risk ── */}
            {activeTab === "predict" && (
              <div className="p-6 space-y-8">

                {/* Requirements notice */}
                {!hasEnough && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    ⚠️ GRU prediction needs <strong>at least 10 weeks</strong> of data.
                    This student has <strong>{weekCount}</strong>. Go to <strong>Add Data</strong> to add more.
                  </div>
                )}

                {/* GRU section */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
                    <div>
                      <h3 className="font-semibold text-indigo-900">🧠 GRU Model</h3>
                      <p className="text-xs text-indigo-600 mt-0.5">Reads last 10 weeks → computes reconstruction error → classifies risk</p>
                    </div>
                    <button
                      onClick={runGru}
                      disabled={!hasEnough || gruLoading}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-semibold transition"
                    >
                      {gruLoading ? "Running…" : "Run GRU"}
                    </button>
                  </div>

                  <div className="p-5">
                    {gruLoading && (
                      <div className="flex items-center gap-3 text-indigo-600 text-sm">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                        Analyzing 10 weeks of behavior data…
                      </div>
                    )}

                    {gruError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        ❌ {gruError}
                      </div>
                    )}

                    {gruResult && !gruLoading && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-2">Risk Level</p>
                            <RiskBadge level={gruResult.risk_level} />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Reconstruction Error</p>
                            <p className="text-xl font-bold font-mono text-slate-800">
                              {gruResult.reconstruction_error?.toFixed(6)}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Risk Trend</p>
                            <TrendBadge trend={gruResult.risk_trend} />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Week</p>
                            <p className="font-mono font-semibold text-slate-800">{gruResult.week || "—"}</p>
                          </div>
                        </div>

                        {/* Error threshold visual */}
                        <div className="bg-slate-50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            V3 Threshold Scale
                          </p>
                          <div className="relative h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-300 rounded-full">
                            {/* Threshold markers */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-green-600" style={{ left: "37%" }} />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-600" style={{ left: "48%" }} />
                            {/* Current position */}
                            {(() => {
                              const err   = gruResult.reconstruction_error || 0;
                              const maxE  = 0.06;
                              const pct   = Math.min((err / maxE) * 100, 100);
                              return (
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow"
                                  style={{ left: `calc(${pct}% - 8px)` }}
                                />
                              );
                            })()}
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                            <span>LOW ≤ 0.0208</span>
                            <span>NORMAL ≤ 0.0272</span>
                            <span>HIGH &gt; 0.0272</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!gruResult && !gruLoading && !gruError && (
                      <p className="text-sm text-slate-400">Click "Run GRU" to analyze this student's risk level.</p>
                    )}
                  </div>
                </div>

                {/* RL section */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-purple-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
                    <div>
                      <h3 className="font-semibold text-purple-900">🤖 RL Agent</h3>
                      <p className="text-xs text-purple-600 mt-0.5">Uses GRU risk output → decides best intervention action</p>
                    </div>
                    <button
                      onClick={runRl}
                      disabled={!gruRan || rlLoading}
                      className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold transition"
                    >
                      {rlLoading ? "Running…" : "Run RL"}
                    </button>
                  </div>

                  <div className="p-5">
                    {!gruRan && (
                      <p className="text-sm text-slate-400">Run the GRU model first — RL uses its output.</p>
                    )}

                    {rlLoading && (
                      <div className="flex items-center gap-3 text-purple-600 text-sm">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                        Deciding intervention…
                      </div>
                    )}

                    {rlError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        ❌ {rlError}
                      </div>
                    )}

                    {rlResult && !rlLoading && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-xs text-purple-600 mb-2">Recommended Action</p>
                            <ActionBadge action={rlResult.action} />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                            <RiskBadge level={rlResult.risk_level} />
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">No-Response Streak</p>
                            <p className="text-xl font-bold text-slate-800">{rlResult.no_response_streak ?? 0}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-1">Fatigue Level</p>
                            <p className="text-xl font-bold text-slate-800">{rlResult.fatigue_level ?? 0}</p>
                          </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-purple-700 mb-1">Decision Reason</p>
                          <p className="text-sm text-purple-900">{rlResult.decision_reason || "—"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Empty state (not searched yet) ── */}
        {!studentData && !loadingStudent && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-lg font-medium text-slate-600">Enter a 4-digit student ID above</p>
            <p className="text-sm mt-1">Then click Load Student to view records and run predictions.</p>
          </div>
        )}

      </div>
    </div>
  );
}
