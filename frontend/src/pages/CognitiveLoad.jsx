import { useState } from "react";
import { fetchCognitiveLoad } from "../services/api/cognitiveLoadService";

const CognitiveLoad = () => {
  const [subjects, setSubjects] = useState([
    {
      subject: "Data Structures",
      lessons: ["Tree traversal", "Graph algorithms"],
    },
    {
      subject: "Software Engineering",
      lessons: ["System architecture", "Design patterns"],
    },
  ]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await fetchCognitiveLoad({ subjects });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Cognitive Load Analysis</h1>

      <button
        onClick={analyze}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        {loading ? "Analyzing..." : "Analyze Cognitive Load"}
      </button>

      {result && (
        <div className="mt-6 space-y-6">
          {result.skill_clusters.map((cluster, i) => (
            <div key={i} className="border rounded-lg p-4 bg-indigo-50">
              <h3 className="font-semibold text-indigo-800">
                🧠 Shared Skill: {cluster.shared_skill}
              </h3>

              <p className="text-sm text-gray-700 mt-1">{cluster.why_shared}</p>

              <ul className="list-disc ml-6 mt-3 text-sm">
                {cluster.lessons.map((l, idx) => (
                  <li key={idx}>
                    {l.subject} → {l.lesson}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CognitiveLoad;
