import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  getStudentProfile,
  getStudentRiskHistory,
  updateStudentMarks,
  updateStudentLifestyle,
} from "../services/api/studentProfileApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function riskBadge(level) {
  if (!level) return { bg: "bg-gray-100", text: "text-gray-500", label: "Unknown" };
  const l = level.toLowerCase();
  if (l === "high")   return { bg: "bg-red-50",    text: "text-red-600",    label: "High Risk" };
  if (l === "medium") return { bg: "bg-amber-50",  text: "text-amber-600",  label: "Medium Risk" };
  return               { bg: "bg-green-50",  text: "text-green-600",  label: "Low Risk" };
}

function riskBarColor(level) {
  const l = (level || "").toLowerCase();
  if (l === "high")   return "bg-red-500";
  if (l === "medium") return "bg-amber-400";
  return "bg-green-500";
}

function MiniBar({ label, value, max = 100, suffix = "" }) {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100));
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-12 text-right">
        {value != null ? `${value}${suffix}` : "—"}
      </span>
    </div>
  );
}

function MarkBar({ label, value, max = 100, suffix = "" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-800 font-semibold">
          {value != null ? `${value}${suffix}` : "—"}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-800 text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

// ── Semester label parser ──────────────────────────────────────────────────
// Handles: "Year 1 – Semester 1", "Year 1 - Semester 2", etc.
function parseSemesterLabel(label) {
  if (!label) return { year: 0, sem: 0 };
  const m = label.match(/Year\s+(\d+)\s*[–\-]\s*Semester\s+(\d+)/i);
  return m ? { year: parseInt(m[1]), sem: parseInt(m[2]) } : { year: 0, sem: 0 };
}

function nextSemesterLabel(profile) {
  // current_year must be academic year 1–4; values > 4 are bad data (calendar year stored by mistake)
  const rawYear = Number(profile?.current_year ?? 1);
  const year = rawYear >= 1 && rawYear <= 4 ? rawYear : 1;
  const sem  = (profile?.current_semester ?? "Semester 1").includes("2") ? 2 : 1;
  if (sem === 1) return `Year ${year} – Semester 2`;
  if (year < 4)  return `Year ${year + 1} – Semester 1`;
  return null; // completed all semesters (Year 4 Sem 2)
}

function groupBySemester(history) {
  const years = {};
  history.forEach((h) => {
    const { year, sem } = parseSemesterLabel(h.semester_label);
    if (!year || !sem) return;
    if (!years[year]) years[year] = {};
    years[year][sem] = h;
  });
  return years;
}

// ── Semester Card ──────────────────────────────────────────────────────────
function SemesterCard({ semLabel, data }) {
  if (!data) {
    return (
      <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[140px]">
        <p className="text-slate-400 text-sm font-medium">{semLabel}</p>
        <p className="text-slate-300 text-xs mt-1">No data recorded</p>
      </div>
    );
  }

  const badge  = riskBadge(data.risk_level);
  const barClr = riskBarColor(data.risk_level);
  const pct    = data.risk_percentage ?? Math.round((data.risk_probability ?? 0) * 100);
  const m      = data.marks_snapshot ?? {};

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-700 text-sm">{semLabel}</h4>
        {data.risk_level && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Risk bar */}
      {pct > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Risk Score</span>
            <span className="font-bold text-slate-700">{pct}%</span>
          </div>
          <div className="h-2 bg-white border border-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barClr}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Academic marks */}
      {Object.keys(m).length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Marks</p>
          <MiniBar label="Attendance"   value={m.Attendance_pct}    max={100} suffix="%" />
          <MiniBar label="Midterm"      value={m.Midterm_Score}      max={100} />
          <MiniBar label="Final"        value={m.Final_Score}        max={100} />
          <MiniBar label="Assignments"  value={m.Assignments_Avg}    max={100} />
          <MiniBar label="Quizzes"      value={m.Quizzes_Avg}        max={100} />
          <MiniBar label="Participation" value={m.Participation_Score} max={100} />
          <MiniBar label="Projects"     value={m.Projects_Score}     max={100} />
        </div>
      )}

      {/* Lifestyle */}
      {(m.Study_Hours_per_Week != null || m.Stress_Level != null) && (
        <div className="space-y-1.5 pt-1 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lifestyle</p>
          <MiniBar label="Study Hrs/Wk" value={m.Study_Hours_per_Week}  max={40}  suffix=" hrs" />
          <MiniBar label="Stress Level" value={m.Stress_Level}           max={10}  />
          <MiniBar label="Sleep Hrs"    value={m.Sleep_Hours_per_Night}  max={10}  suffix=" hrs" />
        </div>
      )}

      {data.risk_trend && (
        <p className="text-xs text-slate-400">Trend: <span className="font-medium">{data.risk_trend}</span></p>
      )}
    </div>
  );
}

// ── Update Marks Form ───────────────────────────────────────────────────────
function UpdateMarksForm({ studentId, profile, onSuccess }) {
  const nextSem = nextSemesterLabel(profile);
  const [form, setForm] = useState({
    semester_label:      nextSem ?? "",
    Attendance_pct:      "",
    Midterm_Score:       "",
    Final_Score:         "",
    Assignments_Avg:     "",
    Quizzes_Avg:         "",
    Participation_Score: "",
    Projects_Score:      "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const field = (key, label, min = 0, max = 100, step = 1) => (
    <div key={key}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type="number" min={min} max={max} step={step}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { semester_label: form.semester_label };
      // Only send fields that have a value — empty fields stay as existing in the backend
      Object.keys(form).forEach((k) => {
        if (k !== "semester_label" && form[k] !== "") {
          payload[k] = Number(form[k]);
        }
      });
      const result = await updateStudentMarks(studentId, payload);
      onSuccess(result);
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.details ?? err.message ?? "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
        {nextSem ? (
          <select
            value={form.semester_label}
            onChange={(e) => setForm((f) => ({ ...f, semester_label: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={nextSem}>{nextSem}</option>
          </select>
        ) : (
          <p className="text-sm text-slate-400 italic">Student has completed all semesters.</p>
        )}
      </div>

      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Academic Marks</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {field("Attendance_pct",      "Attendance (%)",   0, 100)}
        {field("Midterm_Score",       "Midterm Score",    0, 100)}
        {field("Final_Score",         "Final Score",      0, 100)}
        {field("Assignments_Avg",     "Assignments Avg",  0, 100)}
        {field("Quizzes_Avg",         "Quizzes Avg",      0, 100)}
        {field("Participation_Score", "Participation",    0, 100)}
        {field("Projects_Score",      "Projects Score",   0, 100)}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
      >
        {saving ? "Calculating risk & saving…" : "Save Marks & Recalculate Risk"}
      </button>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

const MARK_FIELDS = [
  { key: "Attendance_pct",    label: "Attendance",       max: 100, suffix: "%" },
  { key: "Midterm_Score",     label: "Midterm Score",    max: 100, suffix: "" },
  { key: "Final_Score",       label: "Final Score",      max: 100, suffix: "" },
  { key: "Assignments_Avg",   label: "Assignments Avg",  max: 100, suffix: "" },
  { key: "Quizzes_Avg",       label: "Quizzes Avg",      max: 100, suffix: "" },
  { key: "Participation_Score", label: "Participation",  max: 100, suffix: "" },
  { key: "Projects_Score",    label: "Projects Score",   max: 100, suffix: "" },
];

const LIFESTYLE_FIELDS = [
  { key: "Study_Hours_per_Week",  label: "Study Hours / Week", max: 40, suffix: " hrs" },
  { key: "Stress_Level",          label: "Stress Level (1–10)", max: 10, suffix: "" },
  { key: "Sleep_Hours_per_Night", label: "Sleep Hours / Night", max: 10, suffix: " hrs" },
];

export default function StudentProfile() {
  const { userData } = useAuth();
  const { studentId: paramId } = useParams();
  const navigate = useNavigate();

  const isStudent = userData?.role === ROLES.STUDENT;
  const canEdit   = [ROLES.LECTURER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(userData?.role);

  const [searchId,   setSearchId]   = useState(paramId ?? (isStudent ? userData?.student_id : ""));
  const [loadedId,   setLoadedId]   = useState(isStudent ? userData?.student_id : (paramId ?? ""));
  const [profile,    setProfile]    = useState(null);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [showForm,      setShowForm]      = useState(false);
  const [lastResult,    setLastResult]    = useState(null);
  const [showLifestyle, setShowLifestyle] = useState(false);
  const [lifestyleForm, setLifestyleForm] = useState({ Study_Hours_per_Week: "", Stress_Level: "", Sleep_Hours_per_Night: "" });
  const [lifestyleSaving,  setLifestyleSaving]  = useState(false);
  const [lifestyleError,   setLifestyleError]   = useState("");
  const [lifestyleDone,    setLifestyleDone]    = useState(false);
  const [lifestyleRisk,    setLifestyleRisk]    = useState(null);

  const loadProfile = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    setProfile(null);
    setHistory([]);
    setLastResult(null);
    try {
      const [prof, hist] = await Promise.all([
        getStudentProfile(id),
        getStudentRiskHistory(id),
      ]);
      setProfile(prof);
      setHistory(hist.history ?? []);
      setLoadedId(id);
      setLifestyleForm({
        Study_Hours_per_Week:  prof.Study_Hours_per_Week  ?? "",
        Stress_Level:          prof.Stress_Level          ?? "",
        Sleep_Hours_per_Night: prof.Sleep_Hours_per_Night ?? "",
      });
    } catch (err) {
      setError(err?.response?.data?.error ?? "Student not found or profile not yet created.");
    } finally {
      setLoading(false);
    }
  };

  // Re-run when auth context finishes loading
  useEffect(() => {
    if (isStudent && userData?.student_id) loadProfile(userData.student_id);
    else if (!isStudent && paramId) loadProfile(paramId);
  }, [userData?.student_id, userData?.role, paramId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => loadProfile(searchId.trim());

  const handleMarksSuccess = (result) => {
    setLastResult(result);
    setShowForm(false);
    loadProfile(loadedId);
  };

  const handleLifestyleSubmit = async () => {
    setLifestyleSaving(true);
    setLifestyleError("");
    setLifestyleDone(false);
    try {
      const payload = {};
      if (lifestyleForm.Study_Hours_per_Week  !== "") payload.Study_Hours_per_Week  = Number(lifestyleForm.Study_Hours_per_Week);
      if (lifestyleForm.Stress_Level          !== "") payload.Stress_Level          = Number(lifestyleForm.Stress_Level);
      if (lifestyleForm.Sleep_Hours_per_Night !== "") payload.Sleep_Hours_per_Night = Number(lifestyleForm.Sleep_Hours_per_Night);
      const result = await updateStudentLifestyle(loadedId, payload);
      setLifestyleDone(true);
      setLifestyleRisk(result?.risk_recalculated ? result : null);
      setShowLifestyle(false);
      loadProfile(loadedId);
    } catch (err) {
      setLifestyleError(err?.response?.data?.error ?? err.message ?? "Failed to update lifestyle");
    } finally {
      setLifestyleSaving(false);
    }
  };

  // ── Chart data (risk trend over semesters) ────────────────────────────────
  const chartData = history.map((h, i) => ({
    name: h.semester_label ?? `Sem ${i + 1}`,
    risk: h.risk_percentage ?? Math.round((h.risk_probability ?? 0) * 100),
    level: h.risk_level ?? "",
  }));

  // ── Year-wise grouping ────────────────────────────────────────────────────
  const yearGroups = groupBySemester(history);
  const sortedYears = Object.keys(yearGroups).map(Number).sort((a, b) => a - b);

  const badge  = riskBadge(profile?.risk_label);
  const barClr = riskBarColor(profile?.risk_label);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-blue-600 transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Student Profile</h1>
        </div>

        {/* ── Search (non-students only) ── */}
        {!isStudent && (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Student ID (e.g. IT22001234)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all"
            >
              {loading ? "Loading…" : "Load Profile"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-slate-400">Loading profile…</div>
        )}

        {/* ── Success banner after marks update ── */}
        {lastResult && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${riskBadge(lastResult.risk_level).bg} ${riskBadge(lastResult.risk_level).text} border-current/20`}>
            ✅ Marks saved for {lastResult.semester_label} — Risk: {lastResult.risk_percentage}% ({lastResult.risk_level})
          </div>
        )}

        {profile && (
          <>
            {/* ── Row 1: Personal info + Current risk ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Personal Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Personal Info</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {(profile.first_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{profile.first_name} {profile.last_name}</p>
                    <p className="text-sm text-slate-500">{profile.student_id}</p>
                  </div>
                </div>
                <InfoRow label="Email"      value={profile.email} />
                <InfoRow label="Department" value={profile.department} />
                <InfoRow label="Year"       value={profile.current_year ? `Year ${profile.current_year}` : null} />
                <InfoRow label="Current Semester" value={profile.current_semester?.match(/Semester\s+\d+/i)?.[0] ?? profile.current_semester} />
                <InfoRow label="Gender"     value={profile.gender} />
                <InfoRow label="Age"        value={profile.age} />
              </div>

              {/* Current Risk Status */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Current Risk Status</h2>
                {profile.risk_label ? (
                  <>
                    <div className="mb-5">
                      <div className="flex justify-between mb-1">
                        <span className={`text-sm font-bold ${badge.text}`}>{badge.label}</span>
                        <span className="text-2xl font-black text-slate-800">
                          {profile.risk_percentage ?? Math.round((profile.risk_score ?? 0) * 100)}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barClr}`}
                          style={{ width: `${profile.risk_percentage ?? Math.round((profile.risk_score ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {profile.shap_explanation?.risk_factors?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top Risk Factors</p>
                        <div className="space-y-1.5">
                          {profile.shap_explanation.risk_factors.slice(0, 3).map((f) => (
                            <div key={f.feature} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-1.5">
                              <span className="text-sm text-red-700">{f.display_name}</span>
                              <span className="text-xs font-bold text-red-500">+{(f.impact * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.shap_explanation?.protective_factors?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Protective Factors</p>
                        <div className="space-y-1.5">
                          {profile.shap_explanation.protective_factors.slice(0, 2).map((f) => (
                            <div key={f.feature} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-1.5">
                              <span className="text-sm text-green-700">{f.display_name}</span>
                              <span className="text-xs font-bold text-green-500">{(f.impact * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.risk_predicted_at?.seconds && (
                      <p className="text-xs text-slate-400 mt-3">
                        Last calculated: {new Date(profile.risk_predicted_at.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">No risk prediction yet. Add marks to calculate.</p>
                )}
              </div>
            </div>

            {/* ── Row 2: Risk trend chart (only when 2+ semesters recorded) ── */}
            {chartData.length >= 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Risk Trend</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: "#94a3b8" }} width={35} />
                    <Tooltip formatter={(v) => [`${v}%`, "Risk"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "High", fill: "#ef4444", fontSize: 9 }} />
                    <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "Medium", fill: "#f59e0b", fontSize: 9 }} />
                    <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Row 3: Year-wise academic history ── */}
            {sortedYears.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide px-1">
                  Academic History by Year
                </h2>
                {sortedYears.map((year) => (
                  <div key={year} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{year}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-700">Year {year}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SemesterCard semLabel="Semester 1" data={yearGroups[year]?.[1] ?? null} />
                      <SemesterCard semLabel="Semester 2" data={yearGroups[year]?.[2] ?? null} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback: current marks from student_acc when no history yet */
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Current Academic Marks</h2>
                <p className="text-xs text-slate-400 mb-5">No semester history recorded yet. Showing latest data.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                  {MARK_FIELDS.map(({ key, label, max, suffix }) => (
                    <MarkBar key={key} label={label} value={profile[key]} max={max} suffix={suffix} />
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-6 pt-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Lifestyle Metrics</h3>
                  {LIFESTYLE_FIELDS.every(({ key }) => profile[key] == null) ? (
                    <p className="text-sm text-slate-400 italic">
                      Not set yet — student can update these from their profile page.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-4">
                      {LIFESTYLE_FIELDS.map(({ key, label, max, suffix }) => (
                        <MarkBar key={key} label={label} value={profile[key]} max={max} suffix={suffix} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Row 4: Lifestyle (student only) ── */}
            {isStudent && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <button
                  onClick={() => setShowLifestyle((v) => !v)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">My Lifestyle</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Study hours, stress level, sleep — used in risk calculation</p>
                  </div>
                  <span className="text-slate-400 text-lg">{showLifestyle ? "▲" : "▼"}</span>
                </button>

                {lifestyleDone && !showLifestyle && (
                  <p className="text-sm text-green-600 mt-3">
                    {lifestyleRisk
                      ? `Lifestyle saved & risk updated — ${lifestyleRisk.risk_percentage}% (${lifestyleRisk.risk_level})`
                      : "Lifestyle saved. Start the XAI service to recalculate risk."}
                  </p>
                )}

                {showLifestyle && (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: "Study_Hours_per_Week",  label: "Study Hours / Week",  min: 0,  max: 40,  step: 1 },
                        { key: "Stress_Level",          label: "Stress Level (1–10)", min: 1,  max: 10,  step: 1 },
                        { key: "Sleep_Hours_per_Night", label: "Sleep Hours / Night", min: 0,  max: 12,  step: 0.5 },
                      ].map(({ key, label, min, max, step }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                          <input
                            type="number" min={min} max={max} step={step}
                            value={lifestyleForm[key]}
                            onChange={(e) => setLifestyleForm((f) => ({ ...f, [key]: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                    {lifestyleError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{lifestyleError}</p>
                    )}
                    <button
                      onClick={handleLifestyleSubmit}
                      disabled={lifestyleSaving}
                      className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
                    >
                      {lifestyleSaving ? "Saving & recalculating risk…" : "Save & Recalculate Risk"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Row 5: Update Marks (lecturer / admin only) ── */}
            {canEdit && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    Update Marks & Recalculate Risk
                  </h2>
                  <span className="text-slate-400 text-lg">{showForm ? "▲" : "▼"}</span>
                </button>

                {showForm && (
                  <div className="mt-5">
                    <UpdateMarksForm studentId={loadedId} profile={profile} onSuccess={handleMarksSuccess} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
