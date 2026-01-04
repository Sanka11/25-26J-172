// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import RiskDemo from "./pages/RiskDemo";
import { BrowserRouter } from "react-router-dom";
import Layout from "./Layout";

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
//         <Route path="/recommendation" element={<RecommendationDemo />} />
