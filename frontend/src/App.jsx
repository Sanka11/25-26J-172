import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RiskDemo from "./pages/RiskDemo";
import RecommendationDemo from "./pages/RecommendationDemo";

function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/risk">Risk Demo</Link>
        <Link to="/recommendation">Recommendation Demo</Link>
      </nav>

      <Routes>
        <Route path="/risk" element={<RiskDemo />} />
        <Route path="/recommendation" element={<RecommendationDemo />} />

        {/* Default: go to risk page */}
        <Route path="/" element={<RiskDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
