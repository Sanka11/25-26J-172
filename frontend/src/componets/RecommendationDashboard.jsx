import React, { useState, useEffect } from "react";

import { fetchStudentRecommendations } from "../services/api/recommendation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

const db = getFirestore();
const auth = getAuth();

const RecommendationDashboard = () => {
  // 1. STATE: Auth & Firestore Data
  const [currentUser, setCurrentUser] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // 2. STATE: Student Check-in Data
  const [checkInData, setCheckInData] = useState({
    study_hours_per_week: 10,
    stress_level: 6,
    sleep_hours: 6.5,
  });

  // 3. STATE: Course Context
  const [courseContext, setCourseContext] = useState({
    subject: "OOP",
    week_number: 1,
  });

  // 4. STATE: UI and AI Results
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);

  // --- EFFECT 1: Listen for Firebase Login ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
      setCurrentUser(user),
    );
    return () => unsubscribe();
  }, []);

  // --- EFFECT 2: Fetch DB Data when User is Logged In ---
  useEffect(() => {
    if (!currentUser) return;

    const loadStudentData = async () => {
      try {
        const studentId = currentUser.uid;
        const docRef = doc(db, "students", studentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAcademicData({ student_id: studentId, ...docSnap.data() });
        } else {
          // Fallback mock data if DB isn't fully populated yet
          setAcademicData({
            student_id: studentId,
            attendance_pct: 72.0,
            midterm_score: 65.0,
            assignments_avg: 75.0,
            quizzes_avg: 70.0,
            projects_score: 80.0,
          });
        }

        const historyRef = collection(db, `students/${studentId}/history`);
        const q = query(historyRef, orderBy("timestamp", "asc"));
        const historySnap = await getDocs(q);

        const chartData = [];
        historySnap.forEach((doc) => {
          const data = doc.data();
          chartData.push({
            date: data.timestamp
              ? new Date(data.timestamp.toDate()).toLocaleDateString()
              : "Unknown",
            Recommendation_Index: Math.round(data.recommendation_index * 100),
          });
        });
        setHistoryData(chartData);
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      }
    };
    loadStudentData();
  }, [currentUser]);

  // --- API CALL ---
  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      // The payload structure matching the Python backend
      const payload = {
        subject: courseContext.subject,
        week_number: parseInt(courseContext.week_number, 10),
        students: [{ ...academicData, ...checkInData }],
      };

      const data = await fetchStudentRecommendations(payload);
      const studentResult = data.student_recommendations[0];
      setResult(studentResult);

      // Reset checkboxes based on the number of action items
      const actionItemsCount =
        studentResult?.ai_insights?.action_items?.length || 0;
      setCheckedItems(new Array(actionItemsCount).fill(false));
    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to connect to the AI Engine.");
    } finally {
      setLoading(false);
    }
  };

  // --- EVENT HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckInData((prev) => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleContextChange = (e) => {
    const { name, value } = e.target;
    setCourseContext((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCheckbox = (index) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  // 🚦 3-Tier Traffic Light Colors 🚦
  const getStatusColor = (status) => {
    if (status === "ON TRACK") return "#10b981";
    if (status === "NEEDS ATTENTION") return "#f59e0b";
    return "#ef4444";
  };

  // --- RENDER CHECKS ---
  if (!currentUser)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your personalized dashboard.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl">
            Sign In
          </button>
        </div>
      </div>
    );

  if (!academicData)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your academic records...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Student Success Portal
              </h1>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSimulatorMode}
                onChange={() => setIsSimulatorMode(!isSimulatorMode)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                <span className="mr-1">🤖</span> Simulator Mode
              </span>
            </label>
          </div>
        </div>

        {/* COURSE CONTEXT SELECTORS */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 mb-6 border border-green-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">
                📚 Select Subject
              </label>
              <select
                name="subject"
                value={courseContext.subject}
                onChange={handleContextChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white"
              >
                <option value="OOP">Object-Oriented Programming (OOP)</option>
                <option value="SOFTWARE_ARCHITECTURE">
                  Software Architecture
                </option>
                <option value="DATABASE_MANAGEMENT">Database Management</option>
                <option value="DATA_STRUCTURES">
                  Data Structures & Algorithms
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-green-800 mb-2">
                📅 Current Week
              </label>
              <select
                name="week_number"
                value={courseContext.week_number}
                onChange={handleContextChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                  (week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT - TWO COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Data Sources */}
          <div className="space-y-6">
            {/* Verified Academic Records */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Verified Academic Records
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Attendance</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {academicData.attendance_pct}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${academicData.attendance_pct}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Midterm Score</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {academicData.midterm_score}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${academicData.midterm_score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Assignments Avg</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {academicData.assignments_avg}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${academicData.assignments_avg}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Quizzes Avg</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {academicData.quizzes_avg}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${academicData.quizzes_avg}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Wellness Check-In */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Weekly Wellness Check-In
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Study Hours/Week
                    </label>
                    <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                      {checkInData.study_hours_per_week}h
                    </span>
                  </div>
                  <input
                    type="range"
                    name="study_hours_per_week"
                    min="0"
                    max="40"
                    value={checkInData.study_hours_per_week}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Stress Level (1-10)
                    </label>
                    <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">
                      {checkInData.stress_level}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    name="stress_level"
                    min="1"
                    max="10"
                    value={checkInData.stress_level}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Sleep Hours/Night
                    </label>
                    <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">
                      {checkInData.sleep_hours}h
                    </span>
                  </div>
                  <input
                    type="range"
                    name="sleep_hours"
                    min="0"
                    max="12"
                    step="0.5"
                    value={checkInData.sleep_hours}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <button
                  onClick={fetchAIInsights}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Consulting AI Tutor...
                    </span>
                  ) : (
                    "Analyze & Get Recommendations"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Results */}
          <div className="lg:sticky lg:top-6 h-fit">
            {result ? (
              <div
                className="bg-white rounded-2xl shadow-lg p-6 border-2"
                style={{ borderColor: getStatusColor(result?.status) }}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: getStatusColor(result?.status) }}
                      >
                        {result?.status || "Status unavailable"}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Support Index</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {result?.recommendation_index
                        ? (result.recommendation_index * 100).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                </div>

                {/* AI Summary */}
                {result?.ai_insights?.summary && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">🤖</span>
                      <h4 className="font-semibold text-gray-700">
                        LLaMA AI Analysis
                      </h4>
                    </div>
                    <p className="text-gray-600 italic leading-relaxed">
                      "{result.ai_insights.summary}"
                    </p>
                  </div>
                )}

                {/* COMPACT POINT-WISE ACTION PLAN */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-xl mr-2">📍</span>
                    Active Plan Points
                  </h4>

                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-medium text-gray-600">Progress</span>
                    <span className="font-semibold text-blue-600">
                      {checkedItems.filter(Boolean).length}/
                      {result.ai_insights?.action_items?.length || 0} completed
                    </span>
                  </div>

                  {/* Points List */}
                  <ul className="space-y-2">
                    {result.ai_insights?.action_items &&
                    result.ai_insights.action_items.length > 0 ? (
                      result.ai_insights.action_items.map((task, index) => {
                        // Safe splitting with fallback
                        const parts = task?.split(" - ") || [];
                        const stepTitle = parts[0] || "Task";
                        const stepDescription =
                          parts.slice(1).join(" - ") ||
                          "No description available";

                        return (
                          <li
                            key={index}
                            className={`flex items-start p-3 rounded-lg transition-all duration-200 ${
                              checkedItems[index]
                                ? "bg-gray-50"
                                : "bg-white hover:bg-blue-50 border border-gray-100"
                            }`}
                          >
                            <div className="flex-shrink-0 mr-3">
                              {checkedItems[index] ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {index + 1}
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5
                                  className={`font-medium ${
                                    checkedItems[index]
                                      ? "text-gray-400 line-through"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {stepTitle}
                                </h5>

                                {/* Priority Dots */}
                                {!checkedItems[index] && (
                                  <div className="flex items-center space-x-1">
                                    {index === 0 && (
                                      <span
                                        className="w-2 h-2 bg-red-500 rounded-full"
                                        title="High Priority"
                                      ></span>
                                    )}
                                    {index === 1 && (
                                      <span
                                        className="w-2 h-2 bg-yellow-500 rounded-full"
                                        title="Medium Priority"
                                      ></span>
                                    )}
                                    {index >= 2 && (
                                      <span
                                        className="w-2 h-2 bg-green-500 rounded-full"
                                        title="Normal Priority"
                                      ></span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <p
                                className={`text-sm ${
                                  checkedItems[index]
                                    ? "text-gray-400 line-through"
                                    : "text-gray-600"
                                }`}
                              >
                                {stepDescription}
                              </p>
                            </div>

                            <label className="ml-3 flex-shrink-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checkedItems[index] || false}
                                onChange={() => toggleCheckbox(index)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded border-2 transition-colors duration-200 ${
                                  checkedItems[index]
                                    ? "bg-green-500 border-green-500"
                                    : "border-gray-300 hover:border-blue-500"
                                }`}
                              >
                                {checkedItems[index] && (
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </label>
                          </li>
                        );
                      })
                    ) : (
                      // Show a placeholder when no action items are available
                      <li className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">
                          No action items available
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Click Analyze to generate your personalized plan
                        </p>
                      </li>
                    )}
                  </ul>

                  {/* Quick Stats */}
                  {result.ai_insights?.action_items &&
                    result.ai_insights.action_items.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <span className="font-semibold text-blue-600 block">
                            {result.ai_insights.action_items.length}
                          </span>
                          <span className="text-gray-500">Total Tasks</span>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <span className="font-semibold text-green-600 block">
                            {checkedItems.filter(Boolean).length}
                          </span>
                          <span className="text-gray-500">Completed</span>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2">
                          <span className="font-semibold text-yellow-600 block">
                            {result.ai_insights.action_items.length -
                              checkedItems.filter(Boolean).length}
                          </span>
                          <span className="text-gray-500">Remaining</span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Tips Grid */}
                {(result?.ai_insights?.academic_tip ||
                  result?.ai_insights?.wellness_tip) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result?.ai_insights?.academic_tip && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                          <span className="text-xl mr-2">📚</span>
                          Academic Strategy
                        </h5>
                        <p className="text-sm text-green-700">
                          {result.ai_insights.academic_tip}
                        </p>
                      </div>
                    )}
                    {result?.ai_insights?.wellness_tip && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <h5 className="font-semibold text-purple-800 mb-2 flex items-center">
                          <span className="text-xl mr-2">🧘</span>
                          Wellness Focus
                        </h5>
                        <p className="text-sm text-purple-700">
                          {result.ai_insights.wellness_tip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-dashed border-gray-300 h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-gray-600 max-w-sm">
                  Select a subject, adjust your wellness sliders, and click
                  analyze to generate your personalized AI study plan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* HISTORICAL CHART */}
        {historyData.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Your Progress Over Time
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <LineChart
                  data={historyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    label={{
                      value: "Support Index (%)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#6b7280", fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value) => [`${value}%`, "Need for Support"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="Recommendation_Index"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: "#4f46e5", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, fill: "#4f46e5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationDashboard;
