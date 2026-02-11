import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, userData, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err) {
      alert("Invalid email or password");
    }
  };

  // Redirect after successful login
  useEffect(() => {
    if (!currentUser || !userData) return;

    if (userData.role === "student") navigate("/student-risk");
    else if (userData.role === "lecturer") navigate("/live-risk");
    else if (userData.role === "staff") navigate("/upload");
    else if (userData.role === "admin") navigate("/admin/announcements");
    else if (userData.role === "super_admin") navigate("/gru");
  }, [currentUser, userData, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow w-96 space-y-4">
        <h2 className="text-xl font-semibold text-center">
          AcademiGuard Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        {/* 🔥 Signup Link Added Here */}
        <p className="text-sm text-center mt-3">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
