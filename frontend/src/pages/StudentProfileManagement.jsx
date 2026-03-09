import { useState, useRef } from "react";
import {
  createStudentProfile,
  bulkCreateStudentProfiles,
  checkStudentIdExists,
} from "../services/api/mlApi";

// ── Options ──
const DEPARTMENTS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Medicine",
  "Arts",
  "Law",
  "Science",
];
const GENDERS = ["Male", "Female", "Other"];
const INCOME = ["Low", "Medium", "High"];
const EDU_LEVELS = ["High School", "Bachelor", "Master's", "PhD"];
const YES_NO = ["Yes", "No"];
const YEARS = [1, 2, 3, 4];
const SEMESTERS = ["Semester 1", "Semester 2"];

const EMPTY_FORM = {
  student_id: "",
  first_name: "",
  last_name: "",
  email: "",
  gender: "Male",
  age: "",
  department: "Computer Science",
  current_year: 1,
  current_semester: "Semester 1",
  extracurricular_activities: "No",
  internet_access_at_home: "Yes",
  parent_education_level: "Bachelor",
  family_income_level: "Medium",
  // Academic scores — only used when NOT Year 1 Semester 1
  assignments_avg: "",
  attendance_pct: "",
  midterm_score: "",
  projects_score: "",
  quizzes_avg: "",
};

// Year 1 Semester 1 = brand new student, no scores yet
const isNewStudent = (year, semester) =>
  Number(year) === 1 && semester === "Semester 1";

const CSV_HEADERS = [
  "student_id",
  "first_name",
  "last_name",
  "email",
  "gender",
  "age",
  "department",
  "current_year",
  "current_semester",
  "extracurricular_activities",
  "internet_access_at_home",
  "parent_education_level",
  "family_income_level",
  "assignments_avg",
  "attendance_pct",
  "midterm_score",
  "projects_score",
  "quizzes_avg",
];

function parseCSV(text) {
  const lines = text
    .trim()
    .split("\n")
    .filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines
    .slice(1)
    .map((line, i) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj = {};
      headers.forEach((h, j) => (obj[h] = values[j] || ""));
      obj._row = i + 2;
      return obj;
    })
    .filter((r) => r.student_id);
}

function downloadTemplate() {
  const samples = [
    // Year 1 Sem 1 — new student, scores left blank
    "S5000,Ashan,Perera,ashan.perera@university.edu,Male,21,Computer Science,1,Semester 1,Yes,Yes,Bachelor,Medium,,,,,",
    // Year 2+ — existing student, scores required
    "S5001,Nimasha,Silva,nimasha.silva@university.edu,Female,22,Engineering,3,Semester 2,No,Yes,Master's,High,75,80,70,65,72",
    "S5002,Kasun,Fernando,kasun.fernando@university.edu,Male,20,Business,2,Semester 1,Yes,Yes,High School,Low,60,55,65,58,62",
  ];
  const content = [CSV_HEADERS.join(","), ...samples].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student_profiles_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const inp = (err) =>
  `w-full bg-slate-800 border ${err ? "border-red-500 focus:border-red-400 focus:ring-red-500" : "border-slate-600 focus:border-blue-500 focus:ring-blue-500"} rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all`;
const sel =
  "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
        {required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ── Single Form ──
function SingleStudentForm({ onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState(null);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
    setApiError(null);
  };

  function validate() {
    const e = {};
    if (!form.student_id) e.student_id = "Required";
    else if (!/^[A-Za-z0-9]+$/.test(form.student_id))
      e.student_id = "Alphanumeric only";
    if (!form.first_name) e.first_name = "Required";
    if (!form.last_name) e.last_name = "Required";
    if (!form.email || !form.email.includes("@"))
      e.email = "Valid email required";
    if (
      !form.age ||
      isNaN(form.age) ||
      Number(form.age) < 16 ||
      Number(form.age) > 60
    )
      e.age = "Age must be 16-60";
    // Score validation — only required for non-new students
    if (!isNewStudent(form.current_year, form.current_semester)) {
      const scoreFields = [
        { key: "assignments_avg", label: "Assignments Avg" },
        { key: "attendance_pct", label: "Attendance %" },
        { key: "midterm_score", label: "Midterm Score" },
        { key: "projects_score", label: "Projects Score" },
        { key: "quizzes_avg", label: "Quizzes Avg" },
      ];
      scoreFields.forEach(({ key, label }) => {
        if (form[key] === "" || form[key] === null || form[key] === undefined)
          e[key] = `${label} is required`;
        else if (
          isNaN(form[key]) ||
          Number(form[key]) < 0 ||
          Number(form[key]) > 100
        )
          e[key] = "Must be 0–100";
      });
    }
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const exists = await checkStudentIdExists(form.student_id);
      if (exists) {
        setErrors({ student_id: `ID ${form.student_id} already exists` });
        return;
      }

      const payload = {
        ...form,
        age: Number(form.age),
        current_year: Number(form.current_year),
      };

      // Include scores only for non-new students
      if (!isNewStudent(form.current_year, form.current_semester)) {
        payload.assignments_avg = Number(form.assignments_avg);
        payload.attendance_pct = Number(form.attendance_pct);
        payload.midterm_score = Number(form.midterm_score);
        payload.projects_score = Number(form.projects_score);
        payload.quizzes_avg = Number(form.quizzes_avg);
      }

      await createStudentProfile(payload);
      setDone(true);
      onSuccess?.({ ...form, type: "single" });
      setTimeout(() => {
        setDone(false);
        setForm(EMPTY_FORM);
        setErrors({});
      }, 3000);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Student ID" required error={errors.student_id}>
          <input
            className={inp(errors.student_id)}
            placeholder="e.g. S5000"
            value={form.student_id}
            onChange={(e) => set("student_id", e.target.value)}
          />
        </Field>
        <Field label="First Name" required error={errors.first_name}>
          <input
            className={inp(errors.first_name)}
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
          />
        </Field>
        <Field label="Last Name" required error={errors.last_name}>
          <input
            className={inp(errors.last_name)}
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Email" required error={errors.email}>
          <input
            className={inp(errors.email)}
            placeholder="student@university.edu"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Age" required error={errors.age}>
          <input
            type="number"
            className={inp(errors.age)}
            placeholder="21"
            min={16}
            max={60}
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
          />
        </Field>
        <Field label="Gender">
          <select
            className={sel}
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            {GENDERS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Department">
          <select
            className={sel}
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Current Year">
          <select
            className={sel}
            value={form.current_year}
            onChange={(e) => set("current_year", Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current Semester">
          <select
            className={sel}
            value={form.current_semester}
            onChange={(e) => set("current_semester", e.target.value)}
          >
            {SEMESTERS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Field label="Extracurricular">
          <select
            className={sel}
            value={form.extracurricular_activities}
            onChange={(e) => set("extracurricular_activities", e.target.value)}
          >
            {YES_NO.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Internet at Home">
          <select
            className={sel}
            value={form.internet_access_at_home}
            onChange={(e) => set("internet_access_at_home", e.target.value)}
          >
            {YES_NO.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Family Income">
          <select
            className={sel}
            value={form.family_income_level}
            onChange={(e) => set("family_income_level", e.target.value)}
          >
            {INCOME.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent Education">
          <select
            className={sel}
            value={form.parent_education_level}
            onChange={(e) => set("parent_education_level", e.target.value)}
          >
            {EDU_LEVELS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* ── Academic Scores — shown only for non-new students ── */}
      {isNewStudent(form.current_year, form.current_semester) ? (
        <div className="flex items-center gap-3 p-4 bg-blue-950 border border-blue-800 rounded-xl">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-sm font-semibold text-blue-300">
              New Student — Year 1, Semester 1
            </p>
            <p className="text-xs text-blue-500 mt-0.5">
              Academic scores are not required. They will be added by the
              lecturer after the semester begins.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="text-sm font-bold text-slate-200">
              Academic Scores
            </span>
            <span className="text-xs bg-amber-900 text-amber-400 border border-amber-700 px-2 py-0.5 rounded-full font-semibold">
              Required for existing students
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { key: "assignments_avg", label: "Assignments Avg" },
              { key: "attendance_pct", label: "Attendance %" },
              { key: "midterm_score", label: "Midterm Score" },
              { key: "projects_score", label: "Projects Score" },
              { key: "quizzes_avg", label: "Quizzes Avg" },
            ].map(({ key, label }) => (
              <Field key={key} label={label} required error={errors[key]}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inp(errors[key])}
                  placeholder="0–100"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </Field>
            ))}
          </div>
        </div>
      )}
      {apiError && (
        <div className="p-3 bg-red-950 border border-red-700 rounded-xl text-sm text-red-400">
          {apiError}
        </div>
      )}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading || done}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : done ? (
            <>
              <span className="text-green-300">✓</span> Profile Created!
            </>
          ) : (
            "+ Create Profile"
          )}
        </button>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setErrors({});
            setApiError(null);
          }}
          className="px-4 py-3 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Bulk Upload Form ──
function BulkUploadForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  function handleFile(f) {
    if (!f?.name.endsWith(".csv")) {
      alert("Please upload a .csv file");
      return;
    }
    setFile(f);
    setResult(null);
    setProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseCSV(e.target.result));
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!rows.length) return;
    setLoading(true);
    setProgress(0);
    try {
      const interval = setInterval(
        () => setProgress((p) => Math.min(p + 4, 88)),
        120,
      );
      const res = await bulkCreateStudentProfiles(rows);
      clearInterval(interval);
      setProgress(100);
      setResult(res.summary);
      onSuccess?.({ type: "bulk", count: res.summary.created });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl">
        <div>
          <p className="text-sm font-semibold text-slate-200">CSV Template</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Download, fill in student data, then upload below
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-lg transition-all"
        >
          Download Template
        </button>
      </div>

      <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Required CSV Columns
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CSV_HEADERS.map((h) => (
            <span
              key={h}
              className="text-xs bg-slate-700 text-blue-300 px-2 py-0.5 rounded font-mono"
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-blue-400 bg-blue-950/30"
            : file
              ? "border-green-600 bg-green-950/20"
              : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="text-4xl mb-3">{file ? "📄" : "📂"}</div>
        {file ? (
          <>
            <p className="text-sm font-semibold text-green-400">{file.name}</p>
            <p className="text-xs text-slate-400 mt-1">
              {rows.length} students detected · {(file.size / 1024).toFixed(1)}{" "}
              KB · click to change
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-300">
              Drop your CSV file here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or click to browse · .csv only · max 500 students
            </p>
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Preview — first 5 rows
            </p>
            <span className="text-xs text-blue-400 bg-blue-950 border border-blue-800 px-2.5 py-1 rounded-full font-semibold">
              {rows.length} students ready
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  {[
                    "ID",
                    "Name",
                    "Email",
                    "Department",
                    "Year",
                    "Semester",
                    "Income",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-800 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/50"}`}
                  >
                    <td className="px-3 py-2.5 font-mono font-semibold text-blue-400">
                      {row.student_id}
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 whitespace-nowrap">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{row.email}</td>
                    <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                      {row.department}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      Yr {row.current_year}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                      {row.current_semester}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          row.family_income_level === "High"
                            ? "bg-green-900 text-green-400"
                            : row.family_income_level === "Low"
                              ? "bg-red-900 text-red-400"
                              : "bg-amber-900 text-amber-400"
                        }`}
                      >
                        {row.family_income_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500">
                + {rows.length - 5} more students not shown
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Uploading {rows.length} students to Firestore...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {result && !result.error && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
          <p className="text-sm font-bold text-slate-200 mb-3">
            Upload Complete
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Created",
                value: result.created,
                color: "text-green-400",
                bg: "bg-green-950 border-green-800",
              },
              {
                label: "Skipped (exists)",
                value: result.skipped,
                color: "text-amber-400",
                bg: "bg-amber-950 border-amber-800",
              },
              {
                label: "Failed",
                value: result.failed,
                color: "text-red-400",
                bg: "bg-red-950 border-red-800",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`text-center p-3 border rounded-xl ${s.bg}`}
              >
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className={`text-xs mt-0.5 ${s.color} opacity-70`}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="p-4 bg-red-950 border border-red-700 rounded-xl text-sm text-red-400">
          {result.error}
        </div>
      )}

      {rows.length > 0 && !result && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            `Upload ${rows.length} Students`
          )}
        </button>
      )}
    </div>
  );
}

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-slate-800 border border-green-600 text-green-400 px-5 py-3 rounded-2xl shadow-2xl z-50">
      <span className="font-bold">✓</span>
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-300 ml-2 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default function StudentProfileManagement() {
  const [activeTab, setActiveTab] = useState("single");
  const [toast, setToast] = useState(null);
  const [recentCreations, setRecentCreations] = useState([]);
  const [sessionCount, setSessionCount] = useState(0);

  function handleSuccess(data) {
    if (data.type === "single") {
      setToast(
        `Profile created for ${data.first_name} ${data.last_name} (${data.student_id})`,
      );
      setRecentCreations((p) => [
        { ...data, created_at: new Date().toLocaleTimeString() },
        ...p.slice(0, 4),
      ]);
      setSessionCount((p) => p + 1);
    } else {
      setToast(`${data.count} student profiles created successfully`);
      setSessionCount((p) => p + data.count);
    }
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
              AcademiGuard · Super Admin
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Student Profile Management
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Create individual profiles or bulk import via CSV. Profiles are
            saved to Firestore and immediately available for risk prediction.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Created This Session",
              value: sessionCount,
              color: "text-blue-400",
            },
            {
              label: "Max Bulk Upload",
              value: "500",
              color: "text-purple-400",
            },
            {
              label: "Collection",
              value: "student_acc",
              color: "text-green-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                {s.label}
              </p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit mb-8">
          {[
            { key: "single", label: "Single Student", icon: "👤" },
            { key: "bulk", label: "Bulk Import", icon: "📋" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          {activeTab === "single" ? (
            <>
              <div className="mb-6 pb-5 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">
                  Create Single Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in student details — saved to student_acc collection in
                  Firestore
                </p>
              </div>
              <SingleStudentForm onSuccess={handleSuccess} />
            </>
          ) : (
            <>
              <div className="mb-6 pb-5 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">
                  Bulk Import via CSV
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload CSV to create up to 500 profiles at once using
                  Firestore batch writes
                </p>
              </div>
              <BulkUploadForm onSuccess={handleSuccess} />
            </>
          )}
        </div>

        {recentCreations.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
              Recently Created This Session
            </h3>
            <div className="space-y-2">
              {recentCreations.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 px-4 bg-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-900 border border-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-blue-300">
                      {s.first_name?.[0]}
                      {s.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.email} · {s.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-blue-400 font-semibold">
                      {s.student_id}
                    </p>
                    <p className="text-xs text-slate-600">{s.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
