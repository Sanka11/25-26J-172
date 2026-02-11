import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contactNo: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ROLES.STUDENT,
  });

  const handleSignup = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await signup(form);
      alert("Account Created Successfully!");
      navigate("/login");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow w-96 space-y-3">
        <h2 className="text-xl font-semibold text-center">
          AcademiGuard Signup
        </h2>

        <input
          type="text"
          placeholder="First Name"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />

        <input
          type="text"
          placeholder="Last Name"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />

        <input
          type="text"
          placeholder="Contact Number"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <input
          type="password"
          placeholder="Re-enter Password"
          className="w-full p-2 border rounded"
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
        />

        <select
          className="w-full p-2 border rounded"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value={ROLES.STUDENT}>Student</option>
          <option value={ROLES.LECTURER}>Lecturer</option>
          <option value={ROLES.STAFF}>Staff</option>
          <option value={ROLES.ADMIN}>Admin</option>
          <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
        </select>

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
