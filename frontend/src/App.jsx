import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RiskDemo from "./pages/RiskDemo";
import RecommendationDemo from "./pages/RecommendationDemo";

import CreateQuiz from "./pages/CreateQuiz";
import QuizList from "./pages/QuizList";
import TakeQuiz from "./pages/TakeQuiz";
import Levels from "./pages/Levels";

function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/risk">Risk Demo</Link>
        <Link to="/recommendation">Recommendation Demo</Link>
        <Link to="/create-quiz">Create Quiz</Link>
        <Link to="/quizzes">Quizzes</Link>
        
      </nav>

      <Routes>
        <Route path="/risk" element={<RiskDemo />} />
        <Route path="/recommendation" element={<RecommendationDemo />} />

        <Route path="/" element={<Levels currentLevel={1} />} />
        <Route path="/levels" element={<Levels currentLevel={1} />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quiz/:level" element={<TakeQuiz />} />
        
        

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;

