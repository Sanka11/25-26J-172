import { useState } from "react";
import { getRiskById } from "../services/riskApi";

export default function SearchRisk() {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const search = async () => {
    if (!studentId.trim()) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setResult(null);

      const data = await getRiskById(studentId.trim());

      // ✅ FIX: ML returns the student object directly
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Student not found or ML error");
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = {
    LOW: "bg-green-500",
    NORMAL: "bg-yellow-500",
    HIGH: "bg-red-500",
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Search Student Risk</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 rounded w-full"
          placeholder="Enter Student ID (e.g. S0001)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <button
          onClick={search}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      {result && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <p>
            <b>Student ID:</b> {result.student_id}
          </p>

          <p>
            <b>Reconstruction Error:</b>{" "}
            {result.reconstruction_error.toFixed(4)}
          </p>

          <span
            className={`inline-block mt-2 px-3 py-1 text-white rounded ${
              badgeColor[result.risk] || "bg-gray-500"
            }`}
          >
            {result.risk}
          </span>

          {/* Reasons from ML */}
          {result.reasons && result.reasons.length > 0 && (
            <div className="mt-3 text-sm text-gray-700">
              <p className="font-semibold">Risk Reasons:</p>
              <ul className="list-disc ml-5">
                {result.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
