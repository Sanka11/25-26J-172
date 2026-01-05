import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

/* ================= Pages ================= */
import RiskDemo from "./pages/RiskDemo";
import RecommendationDemo from "./pages/RecommendationDemo";
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import Levels from "./pages/Levels";
import PdfUpload from "./pages/PdfUpload";
import Chat from "./pages/Chat";
import LiveRiskDashboard from "./pages/LiveRiskDashboard";
import UserAnnouncements from "./pages/UserAnnouncements";
import AdminAnnouncements from "./pages/AdminAnnouncements";

/* ================= GRU + RL ================= */
import GRUMain from "./pages/GRUMain";
import SearchRisk from "./pages/SearchRisk";
import AllRisks from "./pages/AllRisks";
import RLDecision from "./pages/RLDecision";
import RLDemo from "./pages/RLDemo";

/* ================= Components ================= */
import NavigationBar from "./componets/Navigationbar";
import GlobalReminders from "./componets/GlobalReminders";

/* ======================================================
   APP LAYOUT (Sidebar + Chat)
   ====================================================== */
function AppLayout() {
  const [view, setView] = useState("risk");
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-100 border-r border-slate-800">
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-sm font-semibold">AcademiGuard</h1>
        </div>

        <nav className="p-4 space-y-2 text-sm">
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

          <button
            onClick={() => (window.location.href = "/live-risk")}
            className="w-full px-3 py-2 rounded bg-slate-800 text-white"
          >
            Live Risk
          </button>
        </nav>
      </aside>

      {/* Main content */}
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
        <div className="fixed bottom-5 right-5 w-[90vw] max-w-md">
          <Chat onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
}

/* ======================================================
   MAIN SHELL (Navbar + Reminders)
   ====================================================== */
function MainShell() {
  const navigate = useNavigate();

  return (
    <>
      <NavigationBar />
      <GlobalReminders onReminderClick={() => navigate("/announcements")} />

      <Routes>
        <Route path="/" element={<AppLayout />} />
        <Route path="/risk" element={<RiskDemo />} />
        <Route path="/live-risk" element={<LiveRiskDashboard />} />
        <Route path="/recommendation" element={<RecommendationDemo />} />

        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/levels" element={<Levels currentLevel={1} />} />
        <Route path="/quiz/:level" element={<TakeQuiz />} />

        <Route path="/upload" element={<PdfUpload />} />
        <Route path="/chat" element={<Chat />} />

        <Route path="/announcements" element={<UserAnnouncements />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold">404</h1>
                <Link to="/" className="text-blue-600 underline">
                  Go Home
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

/* ======================================================
   ROOT APP
   ====================================================== */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone ML routes */}
        <Route path="/gru" element={<GRUMain />} />
        <Route path="/gru/search" element={<SearchRisk />} />
        <Route path="/gru/all" element={<AllRisks />} />
        <Route path="/rl" element={<RLDecision />} />
        <Route path="/rl/demo" element={<RLDemo />} />

        {/* Main app */}
        <Route path="/*" element={<MainShell />} />
      </Routes>
    </BrowserRouter>
  );
}
