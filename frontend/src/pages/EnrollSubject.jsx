import React, { useState } from "react";
import { enrollSubject } from "../services/api/enrollmentService";

const EnrollSubject = () => {
  const [subjectId, setSubjectId] = useState("");
  const [password, setPassword] = useState("");

  const studentId = "S001"; // later from auth

  const handleEnroll = async () => {
    try {
      await enrollSubject({ studentId, subjectId, password });
      alert("Subject enrolled successfully ✅");
      setSubjectId("");
      setPassword("");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>📘 Enroll Subject</h2>

      <input
        placeholder="Subject Code (CS101)"
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
      />

      <input
        type="password"
        placeholder="Subject Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleEnroll} style={{ marginTop: "10px" }}>
        Enroll
      </button>
    </div>
  );
};

export default EnrollSubject;
