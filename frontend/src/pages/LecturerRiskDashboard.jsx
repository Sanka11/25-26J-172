import { useState, useEffect } from "react";
import { getBulkRisk, updateStudentMarks } from "../services/api/mlApi";

// ── Update Marks Modal ──
function UpdateMarksModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({
    Attendance_pct: student?.Attendance_pct || 75,
    Midterm_Score: student?.Midterm_Score || 60,
    Final_Score: student?.Final_Score || 60,
    Assignments_Avg: student?.Assignments_Avg || 60,
    Projects_Score: student?.Projects_Score || 60,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleSave() {
    setSaving(true);
    try {
      await updateStudentMarks(student.student_id, form);
      setToast({
        type: "success",
        msg: "Marks updated and risk recalculated!",
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setToast({ type: "error", msg: "Failed to update marks. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 mb-4">
          Update Marks — {student.student_id}
        </h3>

        {toast && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {toast.msg}
          </div>
        )}

        {Object.entries(form).map(([key, val]) => (
          <div key={key} className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{key.replace(/_/g, " ")}</span>
              <span className="font-semibold">{val}</span>
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
          </div>
        ))}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Recalculate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LecturerRiskDashboard() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getBulkRisk();
      setStudents(data.students || []);
      setFiltered(data.students || []);
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
    if (search)
      result = result.filter((s) =>
        s.student_id?.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(result);
  }, [search, filter, students]);

  const counts = {
    High: students.filter((s) => s.risk_level === "High").length,
    Medium: students.filter((s) => s.risk_level === "Medium").length,
    Low: students.filter((s) => s.risk_level === "Low").length,
  };

  const rowColor = {
    High: "border-l-4 border-red-500 bg-red-50",
    Medium: "border-l-4 border-amber-500 bg-amber-50",
    Low: "border-l-4 border-green-500 bg-green-50",
  };
  const badgeColor = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Student Risk Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor and manage student academic risk levels.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {toast.msg}
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
            },
            {
              label: "Medium Risk",
              count: counts.Medium,
              color: "bg-amber-100 border-amber-300 text-amber-700",
              key: "Medium",
            },
            {
              label: "Low Risk",
              count: counts.Low,
              color: "bg-green-100 border-green-300 text-green-700",
              key: "Low",
            },
          ].map((card) => (
            <button
              key={card.key}
              onClick={() => setFilter(filter === card.key ? "All" : card.key)}
              className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${card.color} ${filter === card.key ? "ring-2 ring-offset-2 ring-blue-400" : ""}`}
            >
              <div className="text-3xl font-bold">{card.count}</div>
              <div className="text-sm font-medium mt-1">{card.label}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow p-4 mb-4">
          <input
            type="text"
            placeholder="Search by Student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
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
                    Student ID
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
                    s.explanation?.risk_factors?.[0]?.display_name ||
                    s.explanation?.key_factors?.[0] ||
                    "—";
                  const pct =
                    s.risk_percentage ?? Math.round((s.risk_score || 0) * 100);
                  return (
                    <tr
                      key={s.student_id}
                      className={rowColor[s.risk_level] || ""}
                    >
                      <td className="px-4 py-3 font-mono font-medium">
                        {s.student_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${s.risk_level === "High" ? "bg-red-500" : s.risk_level === "Medium" ? "bg-amber-500" : "bg-green-500"}`}
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
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
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

        {/* Footer note */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          For personalised recommendations, refer to the{" "}
          <strong>Recommendation Module</strong>.
        </div>
      </div>

      {/* Update Marks Modal */}
      {selectedStudent && (
        <UpdateMarksModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSuccess={() => {
            loadData();
            setToast({
              type: "success",
              msg: "Risk recalculated successfully!",
            });
          }}
        />
      )}
    </div>
  );
}
