import { useState } from "react";

const BASE_URL =
  "http://127.0.0.1:5001/demiguard-3b4e8/us-central1/api/api";

export default function StudentBehaviourDemo() {
  const [studentId, setStudentId] = useState("");
  const [pattern, setPattern] = useState("LOW");
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    login_count: 0,
    avg_session_duration_min: 0,
    total_active_time_min: 0,
    days_since_last_login: 0,
    page_views: 0,
    assignments_submitted: 0,
    on_time_submissions: 0,
    late_submissions: 0,
    alerts_responded: 0,
    response_rate: 0,
  });

  const rand = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  /* ===============================
     Behaviour Pattern Generator
     =============================== */

  const generatePattern = (type) => {
    let data = {};

    if (type === "LOW") {
      data = {
        login_count: rand(9, 14),
        avg_session_duration_min: rand(40, 60),
        total_active_time_min: rand(400, 650),
        days_since_last_login: 0,
        page_views: rand(45, 70),
        assignments_submitted: rand(3, 4),
        on_time_submissions: rand(3, 4),
        late_submissions: 0,
        alerts_responded: 1,
        response_rate: 1,
      };
    }

    if (type === "NORMAL") {
      data = {
        login_count: rand(5, 8),
        avg_session_duration_min: rand(20, 35),
        total_active_time_min: rand(150, 300),
        days_since_last_login: rand(0, 2),
        page_views: rand(20, 40),
        assignments_submitted: rand(1, 2),
        on_time_submissions: rand(1, 2),
        late_submissions: rand(0, 1),
        alerts_responded: rand(0, 1),
        response_rate: rand(0, 1),
      };
    }

    if (type === "HIGH") {
      data = {
        login_count: rand(0, 3),
        avg_session_duration_min: rand(1, 10),
        total_active_time_min: rand(10, 60),
        days_since_last_login: rand(5, 12),
        page_views: rand(1, 10),
        assignments_submitted: 0,
        on_time_submissions: 0,
        late_submissions: rand(1, 2),
        alerts_responded: 0,
        response_rate: 0,
      };
    }

    if (type === "INCREASING") {
      data = {
        login_count: rand(2, 6),
        avg_session_duration_min: rand(10, 25),
        total_active_time_min: rand(80, 200),
        days_since_last_login: rand(2, 5),
        page_views: rand(10, 25),
        assignments_submitted: rand(0, 1),
        on_time_submissions: rand(0, 1),
        late_submissions: rand(1, 2),
        alerts_responded: rand(0, 1),
        response_rate: rand(0, 1),
      };
    }

    if (type === "DECREASING") {
      data = {
        login_count: rand(7, 12),
        avg_session_duration_min: rand(35, 55),
        total_active_time_min: rand(300, 600),
        days_since_last_login: rand(0, 1),
        page_views: rand(40, 65),
        assignments_submitted: rand(2, 4),
        on_time_submissions: rand(2, 4),
        late_submissions: rand(0, 1),
        alerts_responded: 1,
        response_rate: 1,
      };
    }

    setFormData(data);
  };

  /* ===============================
     Form Edit
     =============================== */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: Number(e.target.value),
    });
  };

  /* ===============================
     Add Single Week
     =============================== */

  const addWeek = async () => {
    const res = await fetch(`${BASE_URL}/student/add-week`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        ...formData,
      }),
    });

    const data = await res.json();
    setResult(data);
  };

  /* ===============================
     Generate 10 Weeks Pattern
     =============================== */

  const add10Weeks = async () => {
    const weeks = [];

    for (let i = 0; i < 10; i++) {
      let data = { ...formData };

      Object.keys(data).forEach((k) => {
        data[k] = Math.max(0, data[k] + rand(-2, 2));
      });

      weeks.push(data);
    }

    const res = await fetch(`${BASE_URL}/student/add-10-weeks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        weeks,
      }),
    });

    const data = await res.json();
    setResult(data);
  };

  /* ===============================
     Get Last 10 Weeks
     =============================== */

  const getLast10Weeks = async () => {
    const res = await fetch(
      `${BASE_URL}/test-gru-reader/${studentId}`
    );

    const data = await res.json();
    setResult(data);
  };

  /* ===============================
     Run GRU
     =============================== */

  const runGru = async () => {
    const res = await fetch(`${BASE_URL}/gru/run/${studentId}`);
    const data = await res.json();
    setResult(data);
  };

  /* ===============================
     Run RL
     =============================== */

  const runRl = async () => {
    const res = await fetch(`${BASE_URL}/rl/run/${studentId}`);
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-4">
        Student Behaviour Simulation
      </h2>

      {/* STUDENT ID */}

      <input
        type="text"
        placeholder="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="border p-2 mr-4"
      />

      {/* PATTERN SELECT */}

      <select
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        className="border p-2"
      >
        <option value="LOW">Low Risk</option>
        <option value="NORMAL">Normal</option>
        <option value="HIGH">High Risk</option>
        <option value="INCREASING">Increasing Risk</option>
        <option value="DECREASING">Decreasing Risk</option>
      </select>

      <button
        onClick={() => generatePattern(pattern)}
        className="ml-3 bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Generate Pattern
      </button>

      {/* FORM */}

      <div className="grid grid-cols-2 gap-3 mt-5">

        {Object.keys(formData).map((key) => (
          <input
            key={key}
            name={key}
            type="number"
            value={formData[key]}
            onChange={handleChange}
            className="border p-2"
            placeholder={key}
          />
        ))}

      </div>

      {/* ACTION BUTTONS */}

      <div className="mt-6 space-x-3">

        <button
          onClick={addWeek}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add 1 Week
        </button>

        <button
          onClick={add10Weeks}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Generate 10 Weeks
        </button>

        <button
          onClick={getLast10Weeks}
          className="bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Get Last 10 Weeks
        </button>

        <button
          onClick={runGru}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Run GRU
        </button>

        <button
          onClick={runRl}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Run RL
        </button>

      </div>

      {/* RESULT */}

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

    </div>
  );
}