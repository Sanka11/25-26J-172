// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { motion } from "framer-motion";

// export default function Login() {
//   const { login, userData, currentUser } = useAuth();
//   const navigate = useNavigate();

//   const [email, setEmail] = useState(
//     () => localStorage.getItem("rememberedEmail") || "",
//   );
//   const [password, setPassword] = useState("");
//   const [rememberMe, setRememberMe] = useState(
//     () => !!localStorage.getItem("rememberedEmail"),
//   );
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       alert("Please enter email and password");
//       return;
//     }
//     setLoading(true);
//     try {
//       // ── Save BEFORE login, not after ──
//       if (rememberMe) {
//         localStorage.setItem("rememberedEmail", email);
//       } else {
//         localStorage.removeItem("rememberedEmail");
//       }
//       await login(email, password);
//     } catch (err) {
//       alert("Invalid email or password");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Enter") handleLogin();
//   };

//   useEffect(() => {
//     if (!currentUser || !userData) return;
//     navigate("/");
//   }, [currentUser, userData, navigate]);

//   return (
//     <div className="min-h-screen flex bg-white">
//       {/* Left Side */}
//       <div className="hidden lg:flex lg:w-1/2 relative bg-blue-50 items-center justify-center overflow-hidden">
//         <img
//           src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
//           alt="Academic Campus"
//           className="absolute inset-0 w-full h-full object-cover"
//         />
//         <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-600/90 mix-blend-multiply" />
//         <motion.div
//           initial={{ opacity: 0, x: -50 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, delay: 0.2 }}
//           className="relative z-10 text-white p-12 max-w-lg"
//         >
//           <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
//             Empowering Education.
//           </h1>
//           <p className="text-lg text-blue-100 drop-shadow-md">
//             Enter the AcademiGuard portal to securely manage student risks, live
//             monitoring, and campus announcements.
//           </p>

//           {/* Stats */}
//           <div className="mt-10 grid grid-cols-2 gap-4">
//             {[
//               { value: "97.8%", label: "Model Accuracy" },
//               { value: "99.6%", label: "ROC-AUC Score" },
//               { value: "SHAP", label: "Explainable AI" },
//               { value: "Real-Time", label: "Risk Monitoring" },
//             ].map((s) => (
//               <div
//                 key={s.label}
//                 className="bg-white/10 rounded-xl px-4 py-3 border border-white/10"
//               >
//                 <p className="text-xl font-black text-white">{s.value}</p>
//                 <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
//               </div>
//             ))}
//           </div>
//         </motion.div>
//       </div>

//       {/* Right Side: Login Form */}
//       <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-slate-100"
//         >
//           <div className="text-center mb-8">
//             <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
//               Academi<span className="text-blue-600">Guard</span>
//             </h2>
//             <p className="text-slate-500 text-sm mt-2">
//               Welcome back! Please enter your details.
//             </p>
//           </div>

//           <div className="space-y-5">
//             {/* Email */}
//             <div>
//               <label className="text-sm font-semibold text-slate-700 block mb-1">
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 placeholder="name@university.edu"
//                 className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 autoComplete="email"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="text-sm font-semibold text-slate-700 block mb-1">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 placeholder="••••••••"
//                 className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 autoComplete="current-password"
//               />
//             </div>

//             {/* Remember Me */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 id="rememberMe"
//                 checked={rememberMe}
//                 onChange={(e) => setRememberMe(e.target.checked)}
//                 className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-blue-600"
//               />
//               <label
//                 htmlFor="rememberMe"
//                 className="text-sm text-slate-600 cursor-pointer select-none"
//               >
//                 Remember me
//               </label>
//             </div>
//           </div>

//           {/* Sign In Button */}
//           <motion.button
//             whileHover={{ scale: 1.02, translateY: -2 }}
//             whileTap={{ scale: 0.98 }}
//             onClick={handleLogin}
//             disabled={loading}
//             className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all"
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </motion.button>

//           <div className="pt-6 mt-6 border-t border-slate-100 text-center">
//             <p className="text-sm text-slate-600">
//               Don't have an account?{" "}
//               <Link
//                 to="/signup"
//                 className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-colors"
//               >
//                 Sign up
//               </Link>
//             </p>
//           </div>
//         </motion.div>
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

  // Initialize email from localStorage if "Remember Me" was previously checked
  const [email, setEmail] = useState(
    () => localStorage.getItem("rememberedEmail") || "",
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem("rememberedEmail"),
  );
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      // ── Save BEFORE login, not after ──
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      await login(email, password);
    } catch (err) {
      alert("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  useEffect(() => {
    if (!currentUser || !userData) return;
    navigate("/");
  }, [currentUser, userData, navigate]);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-50 items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
          alt="Academic Campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-600/90 mix-blend-multiply" />
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

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { value: "97.8%", label: "Model Accuracy" },
              { value: "99.6%", label: "ROC-AUC Score" },
              { value: "SHAP", label: "Explainable AI" },
              { value: "Real-Time", label: "Risk Monitoring" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 rounded-xl px-4 py-3 border border-white/10"
              >
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
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
            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@university.edu"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye Slash Icon (Hide)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    // Eye Icon (Show)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-blue-600"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>
          </div>

          {/* Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>

          <div className="pt-6 mt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
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