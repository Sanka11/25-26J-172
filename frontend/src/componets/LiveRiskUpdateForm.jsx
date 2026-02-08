import { useState } from "react";
import { updateStudentMetrics } from "../services/api/realtimeRiskApi";

export default function LiveRiskUpdateForm({ studentId, onSuccess }) {
  const [form, setForm] = useState({
    gpa: "",
    attendance_rate: "",
    assignments_completed: "",
    semester: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      await updateStudentMetrics({
        student_id: studentId,
        ...form,
      });

      setMessage("✅ Real-time academic data sent to ML model");
      onSuccess?.(); // refresh timeline
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to send real-time update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">
        Real-Time Academic Metrics Simulation
      </h3>

      <p className="text-xs text-slate-600">
        Enter current academic indicators manually. These values are sent
        directly to the machine learning model for real-time risk prediction.
      </p>

      {/* ================= INPUTS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {/* GPA */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            GPA (Grade Point Average)
          </label>
          <input
            type="number"
            step="0.1"
            name="gpa"
            value={form.gpa}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 2.8"
          />
        </div>

        {/* Attendance */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Attendance Rate (%)
          </label>
          <input
            type="number"
            name="attendance_rate"
            value={form.attendance_rate}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 75"
          />
        </div>

        {/* Assignments */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Assignments Completed
          </label>
          <input
            type="number"
            name="assignments_completed"
            value={form.assignments_completed}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 6"
          />
        </div>

        {/* Semester */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Semester Number
          </label>
          <input
            type="number"
            name="semester"
            value={form.semester}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 2"
          />
        </div>
      </div>

      {/* ================= SUBMIT ================= */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Updating ML Model…" : "Send Real-Time Update"}
      </button>

      {message && (
        <p className="text-xs text-slate-600 text-center">{message}</p>
      )}
    </div>
  );
}
