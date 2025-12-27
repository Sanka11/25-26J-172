// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import RiskDemo from "./pages/RiskDemo";
// import RecommendationDemo from "./pages/RecommendationDemo";

// function App() {
//   return (
//     <BrowserRouter>
//       <nav className="p-4 bg-gray-200 flex gap-4">
//         <Link to="/risk">Risk Demo</Link>
//         <Link to="/recommendation">Recommendation Demo</Link>
//       </nav>

//       <Routes>
//         <Route path="/risk" element={<RiskDemo />} />
//         <Route path="/recommendation" element={<RecommendationDemo />} />

//         {/* Default: go to risk page */}
//         <Route path="/" element={<RiskDemo />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RiskDemo from "./pages/RiskDemo";
import RecommendationDemo from "./pages/RecommendationDemo";

import CreateQuiz from "./pages/CreateQuiz";
import QuizList from "./pages/QuizList";
import TakeQuiz from "./pages/TakeQuiz";
import StruggleDashboard from "./pages/StruggleDashboard";
import QuizLevels from "./pages/QuizLevels";
import { useState } from "react";
import PdfUpload from "./pages/PdfUpload";
import RiskDemo from "./pages/RiskDemo";
import Chat from "./pages/Chat";

function App() {
  // Main content view
  const [view, setView] = useState("risk");
  // Floating chatbot widget
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950/95 text-slate-100 flex flex-col border-r border-slate-800/80">
        <div className="px-5 py-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 to-slate-900">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-500 flex items-center justify-center text-xs font-bold shadow-sm">
              AG
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">
                AcademiGuard
              </h1>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Academic integrity & risk assistant
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6 text-sm">
          <div>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Main
            </p>
            <button
              onClick={() => setView("risk")}
              className={`mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                view === "risk"
                  ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60"
                  : "text-slate-200 hover:bg-slate-800/70"
              }`}
            >
              <span>Risk Demo</span>
            </button>
          </div>

          <div>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Admin
            </p>
            <button
              onClick={() => setView("upload")}
              className={`mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                view === "upload"
                  ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60"
                  : "text-slate-200 hover:bg-slate-800/70"
              }`}
            >
              <span>Upload PDFs</span>
            </button>
          </div>
        </nav>

        <div className="px-5 py-3 border-t border-slate-800/80 text-[11px] text-slate-500/80">
          <p className="leading-snug">
            Chatbot is available on every page via the
            <span className="font-semibold text-slate-300">
              {" "}
              Ask AcademiGuard
            </span>
            &nbsp;button.
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col relative bg-slate-100/90">
        <header className="bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {view === "risk" && "Student risk analytics"}
                {view === "upload" && "Knowledge base / PDF ingestion"}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {view === "risk" &&
                  "Demo how AcademiGuard scores academic risk per student."}
                {view === "upload" &&
                  "Manage the documents used by the chatbot for answers."}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                ● Online
              </span>
              <span className="text-slate-400">ML service</span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">
          {view === "upload" && <PdfUpload />}
          {view === "risk" && <RiskDemo />}
        </main>

        {/* Floating chatbot button & panel */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold">
              AI
            </span>
            <span>Ask AcademiGuard</span>
          </button>
        )}

        {isChatOpen && (
          <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-[92vw] max-w-md">
            <Chat onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
