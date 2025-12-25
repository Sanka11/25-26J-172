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

function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/risk">Risk Demo</Link>
        <Link to="/recommendation">Recommendation Demo</Link>
        <Link to="/create-quiz">Create Quiz</Link>
        <Link to="/quizzes">Quizzes</Link>
        <Link to="/struggles">My Struggles</Link>
      </nav>

      <Routes>
        <Route path="/risk" element={<RiskDemo />} />
        <Route path="/recommendation" element={<RecommendationDemo />} />

        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quiz/:id" element={<TakeQuiz />} />
        <Route path="/struggles" element={<StruggleDashboard />} />

        <Route path="/" element={<RiskDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

