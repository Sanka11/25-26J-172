import { useState } from "react";
import {
  startAllRisksJob,
  getAllRisksJobResult,
} from "../services/riskApi";

export default function AllRisks() {
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const badgeColor = {
    LOW: "bg-green-500",
    NORMAL: "bg-yellow-500",
    HIGH: "bg-red-500",
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setStudents([]);
      setStatus("starting");

      // 1️⃣ Start async job
      const startRes = await startAllRisksJob();
      const jobId = startRes.job_id;

      setStatus(startRes.status); // processing

      // 2️⃣ Poll for result
      const interval = setInterval(async () => {
        try {
          const res = await getAllRisksJobResult(jobId);
          setStatus(res.status);

          if (res.status === "completed") {
            setStudents(res.students || []);
            setLoading(false);
            clearInterval(interval);
          }

          if (res.status === "failed") {
            console.error("ML failed:", res.error);
            setLoading(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
          setLoading(false);
          clearInterval(interval);
        }
      }, 3000); // poll every 3 seconds
    } catch (err) {
      console.error("Start job error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Student Risks</h1>

      {/* ACTION BUTTON */}
      <button
        onClick={runAnalysis}
        disabled={loading}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {loading ? "Analyzing..." : "Run Risk Analysis"}
      </button>

      {/* STATUS */}
      {status && (
        <p className="mb-4 text-gray-600">
          Status: <b>{status}</b>
        </p>
      )}

      {/* EMPTY STATE */}
      {!loading && !students.length && (
        <p className="text-gray-500">
          No student risk data available.
        </p>
      )}

      {/* RESULTS TABLE */}
      {students.length > 0 && (
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Student ID</th>
              <th className="p-2 border">Reconstruction Error</th>
              <th className="p-2 border">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.student_id}>
                <td className="p-2 border">{s.student_id}</td>
                <td className="p-2 border">
                  {Number(s.error).toFixed(4)}
                </td>
                <td className="p-2 border">
                  <span
                    className={`px-2 py-1 text-white rounded ${
                      badgeColor[s.risk] || "bg-gray-500"
                    }`}
                  >
                    {s.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
