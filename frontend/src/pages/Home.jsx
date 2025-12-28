import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">
        Student Disengagement Risk System
      </h1>

      <p className="text-gray-600 mb-8">
        Choose how you want to analyze student risk
      </p>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => navigate("/search")}
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Single Student Risk
        </button>

        <button
          onClick={() => navigate("/all")}
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          All Students Risk
        </button>
      </div>
    </div>
  );
}
