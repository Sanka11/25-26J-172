import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import RiskDemo from "./pages/RiskDemo";
import RecommendationDemo from "./pages/RecommendationDemo";
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import Levels from "./pages/Levels";
import PdfUpload from "./pages/PdfUpload";
import Chat from "./pages/Chat";
import NavigationBar from "./componets/Navigationbar";
import LiveRiskDashboard from "./pages/LiveRiskDashboard";
import GlobalReminders from "./componets/GlobalReminders";
import UserAnnouncements from "./pages/UserAnnouncements";
import AdminAnnouncements from "./pages/AdminAnnouncements";

/* ================= GRU + RL MODULE PAGES ================= */
import GRUMain from "./pages/GRUMain";
import SearchRisk from "./pages/SearchRisk";
import AllRisks from "./pages/AllRisks";
import RLDecision from "./pages/RLDecision";
import RLDemo from "./pages/RLDemo";
import PeerStudentDashboard  from "./pages/PeerDashBoard";
import HighRiskInterventionDashboard from "./pages/HumanSupport";


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
    "/rl/demo", 
    "/peer",
    "/support",
  ];

  if (standaloneRoutes.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/gru" element={<GRUMain />} />
        <Route path="/gru/search" element={<SearchRisk />} />
        <Route path="/gru/all" element={<AllRisks />} />
        <Route path="/rl" element={<RLDecision />} />
        <Route path="/rl/demo" element={<RLDemo />} />
        <Route path="/peer" element={<PeerStudentDashboard />} />
        <Route path="/support" element={<HighRiskInterventionDashboard />} />
      </Routes>
    );
  }

  /* ---------------- Main application layout ---------------- */
  return (
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
            onClick={() => (window.location.href = "/live-risk")}
            className="w-full px-3 py-2 rounded bg-slate-800 text-white"
          >
            Live Risk (Real-time)
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
  );
}

/* ================= ROOT ================= */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone ML routes without NavigationBar */}
        <Route
          path="/gru/*"
          element={
            <Routes>
              <Route path="/" element={<GRUMain />} />
              <Route path="/search" element={<SearchRisk />} />
              <Route path="/all" element={<AllRisks />} />
            </Routes>
          }
        />
        <Route path="/rl" element={<RLDecision />} />
        <Route path="/rl/demo" element={<RLDemo />} />
        <Route path="/peer" element={<PeerStudentDashboard />} />
        <Route path="/support" element={<HighRiskInterventionDashboard />} />

        {/* All other routes go through the main shell */}
        <Route path="/*" element={<MainShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainShell() {
  const navigate = useNavigate();

  return (
    <>
      <NavigationBar />
      <GlobalReminders onReminderClick={() => navigate("/announcements")} />
      <Routes>
        {/* Dashboard/Home */}
        <Route path="/" element={<AppLayout />} />

        {/* Demo Routes */}
        <Route
          path="/risk"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">
                  Risk Analysis Demo
                </h1>
                <RiskDemo />
              </div>
            </div>
          }
        />

        <Route
          path="/recommendation"
          element={
            <>
              <NavigationBar />
              <Routes>
                {/* Dashboard/Home */}
                <Route path="/" element={<AppLayout />} />

                {/* Demo Routes */}
                <Route
                  path="/risk"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6">
                          Risk Analysis Demo
                        </h1>
                        <RiskDemo />
                      </div>
                    </div>
                  }
                />

                <Route
                  path="/live-risk"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6">
                          Live Student Risk & Explainable AI
                        </h1>
                        <LiveRiskDashboard />
                      </div>
                    </div>
                  }
                />

                <Route
                  path="/recommendation"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6">
                          Recommendation Demo
                        </h1>
                        <RecommendationDemo />
                      </div>
                    </div>
                  }
                />

                {/* Quiz Routes */}
                <Route
                  path="/create-quiz"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <CreateQuiz />
                      </div>
                    </div>
                  }
                />

                <Route
                  path="/levels"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <Levels currentLevel={1} />
                      </div>
                    </div>
                  }
                />

                <Route
                  path="/quiz/:level"
                  element={
                    <div className="min-h-screen bg-slate-100">
                      <TakeQuiz />
                    </div>
                  }
                />

                {/* Additional Routes */}
                <Route
                  path="/upload"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6">
                          PDF Upload
                        </h1>
                        <PdfUpload />
                      </div>
                    </div>
                  }
                />

                <Route
                  path="/chat"
                  element={
                    <div className="min-h-screen bg-slate-100 p-6">
                      <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6">
                          Chat Assistant
                        </h1>
                        <Chat />
                      </div>
                    </div>
                  }
                />

                {/* Fallback */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-slate-800 mb-4">
                          404 - Page Not Found
                        </h1>
                        <p className="text-slate-600 mb-8">
                          The page you're looking for doesn't exist.
                        </p>
                        <Link
                          to="/"
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Return to Dashboard
                        </Link>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </>
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">
                  Recommendation Demo
                </h1>
                <RecommendationDemo />
              </div>
            </div>
          }
        />

        {/* Quiz Routes */}
        <Route
          path="/create-quiz"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <CreateQuiz />
              </div>
            </div>
          }
        />

        <Route
          path="/levels"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <Levels currentLevel={1} />
              </div>
            </div>
          }
        />

        <Route
          path="/quiz/:level"
          element={
            <div className="min-h-screen bg-slate-100">
              <TakeQuiz />
            </div>
          }
        />

        {/* Upload PDFs */}
        <Route
          path="/upload"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">
                  PDF Upload
                </h1>
                <PdfUpload />
              </div>
            </div>
          }
        />

        {/* Chat */}
        <Route
          path="/chat"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">
                  Chat Assistant
                </h1>
                <Chat />
              </div>
            </div>
          }
        />

        {/* Announcements (student view) */}
        <Route
          path="/announcements"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <UserAnnouncements />
              </div>
            </div>
          }
        />

        {/* Announcements (admin view) */}
        <Route
          path="/admin/announcements"
          element={
            <div className="min-h-screen bg-slate-100 p-6">
              <div className="max-w-7xl mx-auto">
                <AdminAnnouncements />
              </div>
            </div>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">
                  404 - Page Not Found
                </h1>
                <p className="text-slate-600 mb-8">
                  The page you're looking for doesn't exist.
                </p>
                <Link
                  to="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
