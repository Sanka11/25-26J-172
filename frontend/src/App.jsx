import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

/* ================= EXISTING PAGES ================= */

import RiskDemo from "./pages/RiskDemo";
import RecommendationDemo from "./pages/RecommendationDemo";
import CreateQuiz from "./pages/CreateQuiz";
import QuizList from "./pages/QuizList";
import TakeQuiz from "./pages/TakeQuiz";
import Levels from "./pages/Levels";
import PdfUpload from "./pages/PdfUpload";
import Chat from "./pages/Chat";

/* ================= GRU + RL MODULE PAGES ================= */

import GRUMain from "./pages/GRUMain";
import SearchRisk from "./pages/SearchRisk";
import AllRisks from "./pages/AllRisks";
import RLDecision from "./pages/RLDecision";
import RLDemo from "./pages/RLDemo";

/* =========================================================
   Route-aware layout
   - Isolates GRU & RL pages
   - Preserves existing application UI
   ========================================================= */
function AppLayout() {
  const location = useLocation();

  // Existing state-based navigation
  const [view, setView] = useState("risk");
  const [isChatOpen, setIsChatOpen] = useState(false);

  /* ---------------- Standalone ML routes ---------------- */
  const standaloneRoutes = [
    "/gru",
    "/gru/search",
    "/gru/all",
    "/rl",
    "/rl/demo", // ✅ added correctly
  ];

  if (standaloneRoutes.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/gru" element={<GRUMain />} />
        <Route path="/gru/search" element={<SearchRisk />} />
        <Route path="/gru/all" element={<AllRisks />} />
        <Route path="/rl" element={<RLDecision />} />
        <Route path="/rl/demo" element={<RLDemo />} />
      </Routes>
    );
  }

  /* ---------------- Main application layout ---------------- */
  return (
    <>
      {/* Top Navigation */}
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/risk">Risk Demo</Link>
        <Link to="/recommendation">Recommendation Demo</Link>
        <Link to="/create-quiz">Create Quiz</Link>
        <Link to="/quizzes">Quizzes</Link>
      </nav>

      {/* App Routes */}
      <Routes>
        <Route path="/risk" element={<RiskDemo />} />
        <Route path="/recommendation" element={<RecommendationDemo />} />
        <Route path="/" element={<Levels currentLevel={1} />} />
        <Route path="/levels" element={<Levels currentLevel={1} />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quiz/:level" element={<TakeQuiz />} />
      </Routes>

      {/* Layout */}
      <div className="min-h-screen bg-slate-900 flex text-slate-900">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-950/95 text-slate-100 flex flex-col border-r border-slate-800/80">
          <div className="px-5 py-4 border-b border-slate-800/80">
            <h1 className="text-sm font-semibold">AcademiGuard</h1>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-4 text-sm">
            <button
              onClick={() => setView("risk")}
              className="w-full px-3 py-2 rounded bg-slate-800 text-white"
            >
              Risk Demo
            </button>
            <button
              onClick={() => setView("upload")}
              className="w-full px-3 py-2 rounded bg-slate-800 text-white"
            >
              Upload PDFs
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 bg-slate-100 p-6">
          {view === "risk" && <RiskDemo />}
          {view === "upload" && <PdfUpload />}
        </div>

        {/* Chat */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-full"
          >
            Ask AcademiGuard
          </button>
        )}

        {isChatOpen && (
          <div className="fixed bottom-5 right-5 w-[92vw] max-w-md">
            <Chat onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}

/* ================= ROOT ================= */
function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
