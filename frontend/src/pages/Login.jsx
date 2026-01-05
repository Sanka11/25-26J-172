import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");

  const handleLogin = () => {
    if (!userId) return;

    let role = "guest";

    if (userId.startsWith("S")) role = "student";
    else if (userId.startsWith("LEC")) role = "lecturer";

    login({
      id: userId,
      role,
    });

    // Auto redirect
    if (role === "student") navigate("/student-risk");
    else if (role === "lecturer") navigate("/live-risk");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow w-96">
        <h2 className="text-xl font-semibold mb-4 text-center">
          AcademiGuard Login
        </h2>

        <input
          type="text"
          placeholder="Student / Lecturer ID"
          className="w-full p-2 border rounded mb-4"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password (any)"
          className="w-full p-2 border rounded mb-4"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Demo login – password not validated
        </p>
      </div>
    </div>
  );
}
