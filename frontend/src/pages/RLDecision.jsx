import { useState } from "react";

/**
 * RL Decision Page
 * - Calls the FastAPI RL service directly
 * - Displays recommended adaptive intervention
 */
export default function RLDecision() {
  const [studentId, setStudentId] = useState("S0971");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDecision = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ IMPORTANT: call FastAPI RL service directly
      const response = await fetch(
        `http://127.0.0.1:8000/rl/decide/${studentId}`
      );

      if (!response.ok) {
        throw new Error("RL service returned an error");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to fetch RL decision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h1 className="text-lg font-semibold mb-4">
          Reinforcement Learning Decision
        </h1>

        <label className="block text-sm font-medium mb-1">
          Student ID
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />

        <button
          onClick={fetchDecision}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Get RL Decision"}
        </button>

        {/* ================= RESULT ================= */}
        {result && (
          <div className="mt-4 p-3 border rounded bg-slate-50 text-sm">
            <p>
              <strong>Student ID:</strong> {result.student_id}
            </p>
            <p>
              <strong>GRU Risk:</strong> {result.gru_risk}
            </p>
            <p>
              <strong>Recommended Action:</strong>{" "}
              <span className="font-semibold text-blue-600">
                {result.recommended_action}
              </span>
            </p>
          </div>
        )}

        {/* ================= ERROR ================= */}
        {error && (
          <div className="mt-4 p-3 border border-red-300 bg-red-50 text-sm text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
