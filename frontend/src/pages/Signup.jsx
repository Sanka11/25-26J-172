// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth, ROLES } from "../context/AuthContext";

// export default function Signup() {
//   const { signup } = useAuth();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     firstName: "",
//     lastName: "",
//     contactNo: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     role: ROLES.STUDENT,
//   });

//   const handleSignup = async () => {
//     if (form.password !== form.confirmPassword) {
//       alert("Passwords do not match");
//       return;
//     }

//     try {
//       await signup(form);
//       alert("Account Created Successfully!");
//       navigate("/login");
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-100">
//       <div className="bg-white p-6 rounded-xl shadow w-96 space-y-3">
//         <h2 className="text-xl font-semibold text-center">
//           AcademiGuard Signup
//         </h2>

//         <input
//           type="text"
//           placeholder="First Name"
//           className="w-full p-2 border rounded"
//           onChange={(e) => setForm({ ...form, firstName: e.target.value })}
//         />

//         <input
//           type="text"
//           placeholder="Last Name"
//           className="w-full p-2 border rounded"
//           onChange={(e) => setForm({ ...form, lastName: e.target.value })}
//         />

//         <input
//           type="text"
//           placeholder="Contact Number"
//           className="w-full p-2 border rounded"
//           onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
//         />

//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full p-2 border rounded"
//           onChange={(e) => setForm({ ...form, email: e.target.value })}
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full p-2 border rounded"
//           onChange={(e) => setForm({ ...form, password: e.target.value })}
//         />

//         <input
//           type="password"
//           placeholder="Re-enter Password"
//           className="w-full p-2 border rounded"
//           onChange={(e) =>
//             setForm({ ...form, confirmPassword: e.target.value })
//           }
//         />

//         <select
//           className="w-full p-2 border rounded"
//           onChange={(e) => setForm({ ...form, role: e.target.value })}
//         >
//           <option value={ROLES.STUDENT}>Student</option>
//           <option value={ROLES.LECTURER}>Lecturer</option>
//           <option value={ROLES.STAFF}>Staff</option>
//           <option value={ROLES.ADMIN}>Admin</option>
//           <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
//         </select>

//         <button
//           onClick={handleSignup}
//           className="w-full bg-green-600 text-white py-2 rounded"
//         >
//           Create Account
//         </button>
//       </div>
//     </div>
//   );
// }
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, ROLES } from "../context/AuthContext";
import { motion } from "framer-motion";

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

  // Helper for shared input styling
  const inputClasses =
    "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner";
  const labelClasses =
    "text-xs font-semibold text-slate-700 block mb-1 uppercase tracking-wide";

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: 3D Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-50 items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
          alt="University Library"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/90 to-blue-600/80 mix-blend-multiply"></div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 text-white p-12 max-w-lg"
        >
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            Join the Future.
          </h1>
          <p className="text-lg text-blue-100 drop-shadow-md">
            Create your AcademiGuard account to connect with your campus, access
            live resources, and stay secure.
          </p>
        </motion.div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-slate-100 my-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Create <span className="text-blue-600">Account</span>
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Sign up to get started with AcademiGuard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className={labelClasses}>First Name</label>
              <input
                type="text"
                placeholder="John"
                className={inputClasses}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>

            {/* Last Name */}
            <div>
              <label className={labelClasses}>Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                className={inputClasses}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

            {/* Email (Full Width) */}
            <div className="sm:col-span-2">
              <label className={labelClasses}>Email Address</label>
              <input
                type="email"
                placeholder="name@university.edu"
                className={inputClasses}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Contact No */}
            <div>
              <label className={labelClasses}>Contact Number</label>
              <input
                type="text"
                placeholder="076 6565 45"
                className={inputClasses}
                onChange={(e) =>
                  setForm({ ...form, contactNo: e.target.value })
                }
              />
            </div>

            {/* Role Select */}
            <div>
              <label className={labelClasses}>Account Role</label>
              <select
                className={`${inputClasses} appearance-none cursor-pointer`}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                value={form.role}
              >
                <option value={ROLES.STUDENT}>Student</option>
                <option value={ROLES.LECTURER}>Lecturer</option>
                <option value={ROLES.STAFF}>Staff</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className={labelClasses}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClasses}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClasses}>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClasses}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignup}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all"
          >
            Create Account
          </motion.button>

          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}