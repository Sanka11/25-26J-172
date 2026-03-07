// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function Login() {
//   const { login, userData, currentUser } = useAuth();
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = async () => {
//     try {
//       await login(email, password);
//     } catch (err) {
//       alert("Invalid email or password");
//     }
//   };

//   // Redirect after successful login
//   useEffect(() => {
//     if (!currentUser || !userData) return;

//     if (userData.role === "student") navigate("/student-risk");
//     else if (userData.role === "lecturer") navigate("/live-risk");
//     else if (userData.role === "staff") navigate("/upload");
//     else if (userData.role === "admin") navigate("/admin/announcements");
//     else if (userData.role === "super_admin") navigate("/gru");
//   }, [currentUser, userData, navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-100">
//       <div className="bg-white p-6 rounded-xl shadow w-96 space-y-4">
//         <h2 className="text-xl font-semibold text-center">
//           AcademiGuard Login
//         </h2>

//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full p-2 border rounded"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           className="w-full p-2 border rounded"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         <button
//           onClick={handleLogin}
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//         >
//           Login
//         </button>

//         {/* 🔥 Signup Link Added Here */}
//         <p className="text-sm text-center mt-3">
//           Don’t have an account?{" "}
//           <Link
//             to="/signup"
//             className="text-blue-600 font-semibold hover:underline"
//           >
//             Sign up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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

  useEffect(() => {
    if (!currentUser || !userData) return;
    const routes = {
      student: "/student-risk",
      lecturer: "/live-risk",
      staff: "/upload",
      admin: "/admin/announcements",
      super_admin: "/gru",
    };
    if (routes[userData.role]) navigate(routes[userData.role]);
  }, [currentUser, userData, navigate]);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: 3D Image & Branding (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-50 items-center justify-center overflow-hidden">
        {/* Placeholder for a 3D academic/tech image */}
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
          alt="Academic Campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Blue Gradient Overlay to maintain theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-600/90 mix-blend-multiply"></div>

        {/* Floating Graphic/Text over the image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 text-white p-12 max-w-lg"
        >
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            Empowering Education.
          </h1>
          <p className="text-lg text-blue-100 drop-shadow-md">
            Enter the AcademiGuard portal to securely manage student risks, live
            monitoring, and campus announcements.
          </p>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-slate-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Academi<span className="text-blue-600">Guard</span>
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Welcome back! Please enter your details.
            </p>
          </div>

          <div className="space-y-5">
            <div className="group">
              <label className="text-sm font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@university.edu"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="text-sm font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all"
          >
            Sign In
          </motion.button>

          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}