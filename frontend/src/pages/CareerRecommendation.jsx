import { useState } from "react";
import { getCareerRecommendation } from "../services/api/recommendationService";

const CareerRecommendation = () => {
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState(null);

  const handleClick = async () => {
    const result = await getCareerRecommendation(studentId);
    setData(result);
  };

  return (
    <div>
      <h2>Career-Based Course Recommendation</h2>

      <input
        placeholder="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />

      <button onClick={handleClick}>Get Recommendation</button>

      {data?.recommendedCourses?.map((c, i) => (
        <div key={i}>
          <strong>{c.course}</strong>
          <p>Skill: {c.skill}</p>
          <a href={c.link} target="_blank" rel="noreferrer">
            Open Course
          </a>
        </div>
      ))}
    </div>
  );
};

export default CareerRecommendation;
