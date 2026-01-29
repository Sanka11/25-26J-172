import React from "react";
import { enrollInternship } from "../services/api/internshipService";

const EnrollInternship = () => {
  const studentId = "S001";
  const internshipId = "intern_2026";

  const handleEnroll = async () => {
    try {
      await enrollInternship({ studentId, internshipId });
      alert("Internship enrolled successfully 🏢");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏢 Internship Module</h2>
      <p>Mon–Fri | 9 AM – 5 PM</p>

      <button onClick={handleEnroll}>Enroll Internship</button>
    </div>
  );
};

export default EnrollInternship;
