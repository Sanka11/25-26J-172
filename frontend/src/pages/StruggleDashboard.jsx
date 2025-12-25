export default function StruggleDashboard() {
  const data = JSON.parse(localStorage.getItem("struggle_result"));

  if (!data) {
    return <p className="p-6">No struggle data available.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Struggling Skills</h2>

      {data.struggling_skills.length === 0 ? (
        <p className="text-green-600">No struggling skills 🎉</p>
      ) : (
        data.struggling_skills.map((s, i) => (
          <div key={i} className="border p-3 mb-2">
            <p>
              <b>Skill:</b> {s.skill_name}
            </p>
            <p>
              <b>Level:</b> {s.level}
            </p>
            <p>
              <b>Score:</b> {s.struggle_score}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
