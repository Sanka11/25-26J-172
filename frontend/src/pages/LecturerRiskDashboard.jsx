import { useState, useEffect } from "react";
import { getBulkRisk, updateStudentMarks } from "../services/api/mlApi";

const CURRENT_YEAR = 2025;
const YEARS = [2025, 2024, 2023];
const SEMESTERS = ["Semester 1", "Semester 2"];

// ── Before/After Risk Change Badge ──
function RiskChangeBadge({ before, after }) {
  if (!before || !after) return null;
  const diff = after.risk_percentage - before.risk_percentage;
  const levelChanged = before.risk_level !== after.risk_level;
  const improved = diff < 0;
  const worsened = diff > 0;

  const levelColor = (lvl) =>
    lvl === "High"
      ? "text-red-600"
      : lvl === "Medium"
        ? "text-amber-600"
        : "text-green-600";
  const levelBadge = (lvl) =>
    lvl === "High"
      ? "bg-red-100 text-red-700"
      : lvl === "Medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-green-100 text-green-700";

  return (
    <div
      className={`rounded-xl p-4 border-2 ${
        improved
          ? "bg-green-50 border-green-300"
          : worsened
            ? "bg-red-50 border-red-300"
            : "bg-gray-50 border-gray-200"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 text-center">
        ⚡ Risk Recalculation Result
      </p>
      <div className="flex items-center justify-center gap-6">
        {/* Before */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Before</p>
          <div
            className={`text-3xl font-black ${levelColor(before.risk_level)}`}
          >
            {before.risk_percentage}%
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelBadge(before.risk_level)}`}
          >
            {before.risk_level}
          </span>
        </div>

        {/* Arrow + diff */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`text-4xl font-black leading-none ${
              improved
                ? "text-green-500"
                : worsened
                  ? "text-red-500"
                  : "text-gray-400"
            }`}
          >
            {improved ? "↓" : worsened ? "↑" : "→"}
          </div>
          <div
            className={`text-sm font-bold ${
              improved
                ? "text-green-600"
                : worsened
                  ? "text-red-600"
                  : "text-gray-500"
            }`}
          >
            {diff === 0 ? "No change" : `${improved ? "" : "+"}${diff}%`}
          </div>
        </div>

        {/* After */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">After</p>
          <div
            className={`text-3xl font-black ${levelColor(after.risk_level)}`}
          >
            {after.risk_percentage}%
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelBadge(after.risk_level)}`}
          >
            {after.risk_level}
          </span>
        </div>
      </div>

      {levelChanged && (
        <div
          className={`mt-3 text-center text-xs font-semibold px-3 py-1.5 rounded-lg ${
            improved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {improved
            ? `🎉 Risk level improved: ${before.risk_level} → ${after.risk_level}`
            : `⚠️ Risk level worsened: ${before.risk_level} → ${after.risk_level}`}
        </div>
      )}

      {!levelChanged && diff !== 0 && (
        <div className="mt-3 text-center text-xs text-gray-500">
          Risk level unchanged ({after.risk_level}), but score{" "}
          {improved ? "decreased" : "increased"} by {Math.abs(diff)}%
        </div>
      )}
    </div>
  );
}

// ── Update Marks Modal ──
function UpdateMarksModal({ student, onClose, onSuccess }) {
  const isNewSem1 = student?.current_year === 1 && student?.current_semester === "Semester 1";
  const [year, setYear] = useState(CURRENT_YEAR);
  const [semester, setSemester] = useState(student?.current_semester ?? "Semester 1");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [riskBefore] = useState({
    risk_percentage: student?.risk_percentage ?? 0,
    risk_level: student?.risk_level ?? "Low",
  });
  const [riskAfter, setRiskAfter] = useState(null);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    Attendance_pct: student?.Attendance_pct ?? 75,
    Midterm_Score: student?.Midterm_Score ?? 60,
    Final_Score: student?.Final_Score ?? 60,
    Assignments_Avg: student?.Assignments_Avg ?? 60,
    Quizzes_Avg: student?.Quizzes_Avg ?? 60,
    Participation_Score: student?.Participation_Score ?? 60,
    Projects_Score: student?.Projects_Score ?? 60,
  });

  async function handleSave() {
    setSaving(true);
    try {
      const fullPayload = {
        year,
        semester,
        ...form,
        Age: student?.age ?? student?.Age ?? 21,
        Study_Hours_per_Week: student?.Study_Hours_per_Week ?? 20,
        Stress_Level:
          student?.Stress_Level ?? student?.["Stress_Level_1-10"] ?? 5,
        Sleep_Hours_per_Night: student?.Sleep_Hours_per_Night ?? 7,
        Gender: student?.gender ?? student?.Gender ?? "Male",
        Department: student?.department ?? student?.Department ?? "CS",
        Extracurricular_Activities:
          student?.extracurricular_activities ??
          student?.Extracurricular_Activities ??
          "No",
        Internet_Access_at_Home:
          student?.internet_access_at_home ??
          student?.Internet_Access_at_Home ??
          "Yes",
        Parent_Education_Level:
          student?.parent_education_level ??
          student?.Parent_Education_Level ??
          "Bachelor",
        Family_Income_Level:
          student?.family_income_level ??
          student?.Family_Income_Level ??
          "Middle",
      };

      const result = await updateStudentMarks(student.student_id, fullPayload);

      const newRisk = result?.new_risk || result;
      if (newRisk?.risk_percentage != null) {
        setRiskAfter({
          risk_percentage: newRisk.risk_percentage,
          risk_level: newRisk.risk_level,
        });
      }

      setDone(true);
      setToast({
        type: "success",
        msg: `Marks saved for ${semester} ${year}.`,
      });
      onSuccess();
    } catch {
      setToast({ type: "error", msg: "Failed to update marks. Try again." });
    } finally {
      setSaving(false);
    }
  }

  const sliderColor = (val) =>
    val >= 75
      ? "text-green-600"
      : val >= 50
        ? "text-amber-600"
        : "text-red-600";

  const fieldLabels = {
    Attendance_pct: "Attendance %",
    Midterm_Score: "Midterm Score",
    Final_Score: "Final Exam Score",
    Assignments_Avg: "Assignments Average",
    Quizzes_Avg: "Quizzes Average",
    Participation_Score: "Class Participation",
    Projects_Score: "Project Score",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                Update Marks — {student.student_id}
              </h3>
              {(student.first_name || student.last_name) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {student.first_name} {student.last_name}
                  {student.department ? ` · ${student.department}` : ""}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>

          {toast && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                toast.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {toast.msg}
            </div>
          )}

          {/* Before/After shown after save */}
          {done && (
            <div className="mb-4">
              <RiskChangeBadge before={riskBefore} after={riskAfter} />
            </div>
          )}

          {!done && (
            <>
              {/* Year & Semester */}
              {isNewSem1 ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-xs text-blue-700 font-semibold">
                  Adding marks for: Year 1, Semester 1 (current semester)
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Academic Year
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        {SEMESTERS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-4 p-2 bg-blue-50 rounded-lg text-center text-xs text-blue-700 font-semibold">
                    Updating: {year} — {semester}
                  </div>
                </>
              )}

              {/* Current risk indicator */}
              <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Current Risk:</span>
                <span
                  className={`text-sm font-bold ${
                    student.risk_level === "High"
                      ? "text-red-600"
                      : student.risk_level === "Medium"
                        ? "text-amber-600"
                        : "text-green-600"
                  }`}
                >
                  {student.risk_percentage}% — {student.risk_level}
                </span>
                <span className="text-xs text-gray-400 ml-auto italic">
                  recalculates on save
                </span>
              </div>

              {/* Sliders */}
              {Object.entries(form).map(([key, val]) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{fieldLabels[key]}</span>
                    <span className={`font-bold ${sliderColor(val)}`}>
                      {val}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={val}
                    onChange={(e) =>
                      setForm({ ...form, [key]: Number(e.target.value) })
                    }
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              ))}

              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                ℹ️ Profile fields (Age, Gender, Department etc.) are pulled
                automatically for risk calculation.
              </div>
            </>
          )}

          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              {done ? "Close" : "Cancel"}
            </button>
            {!done && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {saving ? "Saving & Calculating..." : "Save & Recalculate Risk"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──
export default function LecturerRiskDashboard() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getBulkRisk();
      setStudents(data.students || []);
    } catch {
      setToast({ type: "error", msg: "Failed to load student risk data." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = students;
    if (filter !== "All")
      result = result.filter((s) => s.risk_level === filter);
    if (semesterFilter !== "All")
      result = result.filter((s) => s.current_semester === semesterFilter);
    if (search)
      result = result.filter(
        (s) =>
          s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
          `${s.first_name} ${s.last_name}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      );
    setFiltered(result);
  }, [search, filter, semesterFilter, students]);

  const counts = {
    High: students.filter((s) => s.risk_level === "High").length,
    Medium: students.filter((s) => s.risk_level === "Medium").length,
    Low: students.filter((s) => s.risk_level === "Low").length,
  };

  const rowColor = {
    High: "border-l-4 border-red-400 bg-red-50 hover:bg-red-100 transition-colors",
    Medium:
      "border-l-4 border-amber-400 bg-amber-50 hover:bg-amber-100 transition-colors",
    Low: "border-l-4 border-green-400 bg-green-50 hover:bg-green-100 transition-colors",
  };
  const badgeColor = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Student Risk Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor and manage student academic risk levels. Update marks to
            recalculate risk instantly.
          </p>
        </div>

        {toast && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between ${
              toast.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-3 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "High Risk",
              count: counts.High,
              color: "bg-red-100 border-red-300 text-red-700",
              key: "High",
              icon: "🔴",
              desc: "Immediate attention",
            },
            {
              label: "Medium Risk",
              count: counts.Medium,
              color: "bg-amber-100 border-amber-300 text-amber-700",
              key: "Medium",
              icon: "🟡",
              desc: "Monitor closely",
            },
            {
              label: "Low Risk",
              count: counts.Low,
              color: "bg-green-100 border-green-300 text-green-700",
              key: "Low",
              icon: "🟢",
              desc: "On track",
            },
          ].map((card) => (
            <button
              key={card.key}
              onClick={() => setFilter(filter === card.key ? "All" : card.key)}
              className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${card.color} ${
                filter === card.key
                  ? "ring-2 ring-offset-2 ring-blue-400 scale-105"
                  : ""
              }`}
            >
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-3xl font-bold">{card.count}</div>
              <div className="text-sm font-medium mt-0.5">{card.label}</div>
              <div className="text-xs opacity-60 mt-0.5">{card.desc}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by Student ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="All">All Semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading student data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">
              No students found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">
                    Risk Score
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">
                    Top Risk Factor
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => {
                  const topFactor =
                    s.explanation?.risk_factors?.[0]?.display_name || "—";
                  const pct =
                    s.risk_percentage ?? Math.round((s.risk_score || 0) * 100);
                  return (
                    <tr
                      key={s.student_id}
                      className={rowColor[s.risk_level] || ""}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-gray-800">
                          {s.student_id}
                        </div>
                        {(s.first_name || s.last_name) && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {s.first_name} {s.last_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {s.current_semester
                          ? `${s.current_year || ""} ${s.current_semester}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                s.risk_level === "High"
                                  ? "bg-red-500"
                                  : s.risk_level === "Medium"
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor[s.risk_level]}`}
                        >
                          {s.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {topFactor}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Update Marks
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          For personalised recommendations, refer to the{" "}
          <strong>Recommendation Module</strong>.
        </div>
      </div>

      {selectedStudent && (
        <UpdateMarksModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSuccess={() => {
            loadData();
            setToast({
              type: "success",
              msg: "Marks updated and risk recalculated successfully!",
            });
          }}
        />
      )}
    </div>
  );
}
