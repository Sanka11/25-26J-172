import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

/* ================= AUTH ================= */
import ProtectedRoute from "./componets/ProtectedRoute";
import { ROLES } from "./context/AuthContext";

/* ================= Pages ================= */
import RiskDemo from "./pages/RiskDemo";

//savindi
import WorkloadDashboard from "./pages/StudentDashboard";
import Recommendation from "./componets/RecommendationDashboard";
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import Levels from "./pages/Levels";
import CareerReadiness from "./pages/CareerReadiness";
//

import PdfUpload from "./pages/PdfUpload";
import Chat from "./pages/Chat";
import LiveRiskDashboard from "./pages/LiveRiskDashboard";
import StudentRiskTimeline from "./pages/StudentRiskTimeline";
import UserAnnouncements from "./pages/UserAnnouncements";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

/* ================= GRU + RL ================= */
import GRUMain from "./pages/GRUMain";
import SearchRisk from "./pages/SearchRisk";
import AllRisks from "./pages/AllRisks";
import RLDecision from "./pages/RLDecision";
import RLDemo from "./pages/RLDemo";
import PeerStudentDashboard from "./pages/PeerDashBoard";
import HighRiskInterventionDashboard from "./pages/HumanSupport";
import DisengagementPage from "./pages/DisengagementPage";
import GruBatchRun from "./pages/gru/GruBatchRun";
import GruSingleStudent from "./pages/gru/GruSingleStudent";
import RlBatchRun from "./pages/rl/RlBatchRun";
import RlHistory from "./pages/rl/RlHistory";
import DisengagementHub from "./pages/DisengagementHub";

/* ================= Components ================= */
import NavigationBar from "./componets/Navigationbar";
import GlobalReminders from "./componets/GlobalReminders";

/* ======================================================
   APP LAYOUT (Sidebar + Chat)
   ====================================================== */
function AppLayout() {
  const [view, setView] = useState("risk");

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className="w-64 bg-slate-950 text-slate-100 border-r border-slate-800">
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-sm font-semibold">AcademiGuard</h1>
        </div>

        <nav className="p-4 space-y-2 text-sm">
          <button
            onClick={() => setView("upload")}
            className="w-full px-3 py-2 rounded bg-slate-800"
          >
            Upload PDFs
          </button>

          <Link
            to="/live-risk"
            className="block text-center px-3 py-2 rounded bg-slate-800"
          >
            Live Risk
          </Link>

          <Link
            to="/student-risk"
            className="block text-center px-3 py-2 rounded bg-slate-800"
          >
            My Risk Timeline
          </Link>
          <Link
          to="/admin/disengagementhub"
          className="block text-center px-3 py-2 rounded bg-slate-800"
        >
          Disengagement Center
        </Link>
        </nav>
      </aside>

      <div className="flex-1 bg-slate-100 p-6">
        {view === "risk" && <RiskDemo />}
        {view === "upload" && <PdfUpload />}
      </div>
    </div>
  );
}

/* ======================================================
   MAIN SHELL
   ====================================================== */
function MainShell() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <NavigationBar />
      <GlobalReminders onReminderClick={() => navigate("/announcements")} />

      <Routes>
        <Route path="/" element={<AppLayout />} />

        {/* STUDENT + LECTURER */}
        <Route
          path="/student-risk"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.LECTURER]}>
              <div className="p-6 bg-slate-100 min-h-screen">
                <StudentRiskTimeline studentId="S1000" />
              </div>
            </ProtectedRoute>
          }
        />

        {/* STUDENT + LECTURER */}
        <Route
          path="/live-risk"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.LECTURER]}>
              <LiveRiskDashboard />
            </ProtectedRoute>
          }
        />

        {/* STAFF */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
              <PdfUpload />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-quiz"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <CreateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendation"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <Recommendation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/WorkloadDashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <WorkloadDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disengagementhub"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <DisengagementHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gru/batch"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <GruBatchRun />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gru/history"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <GruSingleStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rl/batch"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <RlBatchRun />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rl/history"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <RlHistory />
            </ProtectedRoute>
          }
        />
        <Route
        path="admin/disengagementhub"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <DisengagementHub />
          </ProtectedRoute>
        }
      />
                {/* SHARED ROUTES */}
        <Route path="/risk" element={<RiskDemo />} />

        <Route path="/levels" element={<Levels currentLevel={1} />} />
        <Route path="/quiz/:level" element={<TakeQuiz />} />
        <Route path="/careerReadiness" element={<CareerReadiness />} />

        <Route path="/chat" element={<Chat />} />
        <Route path="/announcements" element={<UserAnnouncements />} />

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

      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-50 rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
        >
          Ask AcademiGuard
        </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-md">
          <Chat onClose={() => setIsChatOpen(false)} />
        </div>
      )}
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
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* SUPER ADMIN ONLY ML ROUTES */}
        <Route
          path="/gru"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <GRUMain />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gru/search"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <SearchRisk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gru/all"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <AllRisks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rl"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <RLDecision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rl/demo"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <RLDemo />
            </ProtectedRoute>
          }
        />

        {/* Lecturer */}
        <Route
          path="/peer"
          element={
            <ProtectedRoute allowedRoles={[ROLES.LECTURER]}>
              <PeerStudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/support"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <HighRiskInterventionDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Main Application */}
        <Route
          path="/*"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.STUDENT,
                ROLES.LECTURER,
                ROLES.STAFF,
                ROLES.ADMIN,
                ROLES.SUPER_ADMIN,
              ]}
            >
              <MainShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
