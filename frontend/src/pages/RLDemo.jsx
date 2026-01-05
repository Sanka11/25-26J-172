import { useState, useEffect } from "react";

/* ================= MOCKED SYSTEM LOGIC ================= */
// Generate 1000 mock students
const generateMockStudents = () => {
  const departments = ["Computer Science", "Mathematics", "Physics", "Engineering", "Biology", "Chemistry"];
  const names = ["Alex", "Maria", "David", "Sarah", "James", "Emma", "Michael", "Sophia", "William", "Olivia"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
  
  const students = [];
  
  for (let i = 1; i <= 1000; i++) {
    const riskScore = Math.min(0.95, Math.max(0.1, Math.random() * 0.9));
    const riskLevel = riskScore > 0.6 ? "HIGH" : riskScore > 0.3 ? "MEDIUM" : "LOW";
    const engagementScore = Math.min(3.0, Math.max(0.5, 1 + Math.random() * 2));
    
    const history = [
      Math.max(0.1, riskScore - Math.random() * 0.3),
      Math.max(0.1, riskScore - Math.random() * 0.2),
      Math.max(0.1, riskScore - Math.random() * 0.1),
      riskScore
    ];
    
    const engagementHistory = [
      Math.max(0.5, engagementScore - Math.random() * 0.8),
      Math.max(0.5, engagementScore - Math.random() * 0.6),
      Math.max(0.5, engagementScore - Math.random() * 0.4),
      engagementScore
    ];
    
    const previousActions = ["NONE", "NONE", "NONE"];
    const week = Math.floor(Math.random() * 12) + 1;
    
    students.push({
      studentId: `S${i.toString().padStart(4, '0')}`,
      name: `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      week: week,
      gru: {
        riskScore: riskScore,
        riskLevel: riskLevel,
        reconstructionError: Math.max(0.01, Math.min(0.1, Math.random() * 0.09)),
        history: history,
      },
      engagementScore: engagementScore,
      engagementHistory: engagementHistory,
      previousAction: "NONE",
      previousActions: previousActions,
      department: departments[Math.floor(Math.random() * departments.length)],
      lastActive: `${Math.floor(Math.random() * 7)} days ago`,
      rlAction: null
    });
  }
  
  return students;
};

const initialStudents = generateMockStudents();

const actionDescriptions = {
  "IN_APP_REMINDER": {
    title: "In-App Reminder",
    description: "Send gentle reminder within the learning platform",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "🔔"
  },
  "EMAIL_REMINDER": {
    title: "Email Reminder",
    description: "Send personalized email reminder",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "📧"
  },
  "MOTIVATIONAL_MESSAGE": {
    title: "Motivational Message",
    description: "Send encouraging message with learning tips",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "💪"
  },
  "ESCALATE_PEER_CHEER": {
    title: "Peer Support",
    description: "Engage peer mentors for additional support",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "👥"
  },
  "DO_NOTHING": {
    title: "No Action",
    description: "Student is performing well - monitor only",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "✅"
  },
  "NONE": {
    title: "No Previous Action",
    description: "No intervention has been taken yet",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "⏸️"
  }
};

function simulateNextWeek(student) {
  const riskChange = student.gru.riskScore > 0.6 ? -0.18 : 
                    student.gru.riskScore > 0.3 ? -0.12 : -0.05;
  
  const newRiskScore = Math.max(0.1, Math.min(0.95, student.gru.riskScore + riskChange + (Math.random() * 0.1 - 0.05)));
  const newEngagementScore = Math.max(0.5, Math.min(3.0, student.engagementScore + (Math.random() > 0.4 ? 0.2 : -0.1)));
  
  return {
    week: student.week + 1,
    gru: {
      riskScore: newRiskScore,
      riskLevel: newRiskScore > 0.6 ? "HIGH" : newRiskScore > 0.3 ? "MEDIUM" : "LOW",
      reconstructionError: Math.max(0.01, student.gru.reconstructionError - 0.003),
      history: [...student.gru.history.slice(1), student.gru.riskScore],
    },
    engagementScore: newEngagementScore,
    engagementHistory: [...student.engagementHistory.slice(1), student.engagementScore],
  };
}

function decideRL(riskLevel, engagement, previousAction) {
  if (riskLevel === "HIGH" && previousAction === "NONE")
    return "IN_APP_REMINDER";
  if (riskLevel === "HIGH" && engagement < 1.6)
    return "EMAIL_REMINDER";
  if (riskLevel === "MEDIUM" && engagement > 1.8)
    return "MOTIVATIONAL_MESSAGE";
  if (riskLevel === "LOW")
    return "DO_NOTHING";
  return "ESCALATE_PEER_CHEER";
}

/* ================= MAIN DEMO ================= */
export default function RLDemo() {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState(initialStudents[0]);
  const [stage, setStage] = useState("IDLE");
  const [rlAction, setRlAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchAnalysisResults, setBatchAnalysisResults] = useState([]);
  const [showBatchResults, setShowBatchResults] = useState(false);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50); // Show only first 50 for performance

  const riskLevels = {
    LOW: { color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
    MEDIUM: { color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    HIGH: { color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
  };

  const analyzeGRU = () => {
    setLoading(true);
    setStage("ANALYZING");
    
    setTimeout(() => {
      setStage("GRU_DONE");
      setLoading(false);
    }, 600);
  };

  const runRL = () => {
    setLoading(true);
    setStage("RL_ANALYZING");
    
    setTimeout(() => {
      const action = decideRL(
        selectedStudent.gru.riskLevel,
        selectedStudent.engagementScore,
        selectedStudent.previousAction
      );
      setRlAction(action);
      setStage("RL_DONE");
      setLoading(false);
      
      // Add to simulation history
      setSimulationHistory(prev => [{
        studentId: selectedStudent.studentId,
        name: selectedStudent.name,
        week: selectedStudent.week,
        action,
        riskLevel: selectedStudent.gru.riskLevel,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev.slice(0, 19)]);
    }, 800);
  };

  const addNewWeek = () => {
    setLoading(true);
    
    setTimeout(() => {
      const updatedStudent = {
        ...selectedStudent,
        ...simulateNextWeek(selectedStudent),
        previousAction: rlAction,
        previousActions: [...selectedStudent.previousActions.slice(1), rlAction],
      };
      
      // Update the students array
      setStudents(prev => 
        prev.map(s => 
          s.studentId === selectedStudent.studentId ? updatedStudent : s
        )
      );
      
      setSelectedStudent(updatedStudent);
      setRlAction(null);
      setStage("GRU_DONE");
      setLoading(false);
    }, 1000);
  };

  const runBatchAnalysis = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Select a sample of 20 students for batch analysis
      const sampleStudents = students
        .sort(() => Math.random() - 0.5)
        .slice(0, 20)
        .map(student => {
          const action = decideRL(
            student.gru.riskLevel,
            student.engagementScore,
            student.previousAction
          );
          return {
            studentId: student.studentId,
            name: student.name,
            currentRisk: student.gru.riskLevel,
            currentRiskScore: student.gru.riskScore,
            previousAction: student.previousAction,
            newAction: action,
            engagement: student.engagementScore,
            week: student.week
          };
        });
      
      setBatchAnalysisResults(sampleStudents);
      setShowBatchResults(true);
      setLoading(false);
    }, 1500);
  };

  const clearBatchResults = () => {
    setShowBatchResults(false);
    setBatchAnalysisResults([]);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStage("IDLE");
    setRlAction(null);
    setShowBatchResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 Adaptive Learning Intervention System
              </h1>
              <p className="text-gray-600 mt-2">
                GRU-based Risk Prediction & RL-driven Intervention Engine
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <button
                onClick={runBatchAnalysis}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>🧠 Batch Analyze (1000 Students)</span>
                  </>
                )}
              </button>
              {showBatchResults && (
                <button
                  onClick={clearBatchResults}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Close Results
                </button>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Total Students</div>
              <div className="text-2xl font-bold text-gray-900">{students.length.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Registered in system</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">High Risk</div>
              <div className="text-2xl font-bold text-red-600">
                {students.filter(s => s.gru.riskLevel === "HIGH").length.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Require immediate attention</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Avg Engagement</div>
              <div className="text-2xl font-bold text-emerald-600">
                {(students.reduce((acc, s) => acc + s.engagementScore, 0) / students.length).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Out of 3.0 scale</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Active Interventions</div>
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.previousAction !== "NONE" && s.previousAction !== "DO_NOTHING").length.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Ongoing actions</div>
            </div>
          </div>
        </header>

        {/* Batch Analysis Results Modal */}
        {showBatchResults && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                📊 Batch Analysis Results (Sample: 20/1000 Students)
              </h2>
              <div className="text-sm text-gray-500">
                Generated at {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchAnalysisResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            riskLevels[result.currentRisk].color
                          }`} />
                          <span className={`text-sm font-medium ${riskLevels[result.currentRisk].text}`}>
                            {result.currentRisk}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({result.currentRiskScore.toFixed(2)})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          actionDescriptions[result.previousAction]?.color || "bg-gray-100 text-gray-800"
                        }`}>
                          <span>{actionDescriptions[result.previousAction]?.icon || "⏸️"}</span>
                          <span>{actionDescriptions[result.previousAction]?.title || result.previousAction}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          actionDescriptions[result.newAction].color
                        }`}>
                          <span>{actionDescriptions[result.newAction].icon}</span>
                          <span>{actionDescriptions[result.newAction].title}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{result.engagement.toFixed(1)}</div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                result.engagement > 2.0 ? 'bg-emerald-500' :
                                result.engagement > 1.5 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(result.engagement / 3) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Week {result.week}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Summary:</span> Analyzed {batchAnalysisResults.length} students. 
                {batchAnalysisResults.filter(r => r.newAction !== "DO_NOTHING").length} require interventions.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Selection & Search */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Student Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                👥 Search & Select Student
              </h2>
              
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by Student ID or Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <div className="absolute left-3 top-3.5 text-gray-400">
                    🔍
                  </div>
                  <div className="absolute right-3 top-3.5 text-sm text-gray-500">
                    {filteredStudents.length} found
                  </div>
                </div>
                {searchTerm && (
                  <div className="text-xs text-gray-500 mt-2">
                    Showing {Math.min(filteredStudents.length, 50)} of {students.length} students
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredStudents.slice(0, 12).map(student => (
                  <div
                    key={student.studentId}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedStudent.studentId === student.studentId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.studentId}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        riskLevels[student.gru.riskLevel].bg
                      } ${riskLevels[student.gru.riskLevel].text}`}>
                        {student.gru.riskLevel}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Risk</span>
                        <span>{student.gru.riskScore.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            riskLevels[student.gru.riskLevel].color
                          }`}
                          style={{ width: `${student.gru.riskScore * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Week {student.week}</span>
                      <span>Eng: {student.engagementScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No students found matching "{searchTerm}"
                </div>
              )}
            </div>

            {/* GRU Analysis Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  🧠 GRU Risk Analysis Engine
                </h2>
                <div className="text-sm text-gray-500">
                  Week {selectedStudent.week}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Risk Level</div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        riskLevels[selectedStudent.gru.riskLevel].color
                      }`} />
                      <span className={`text-2xl font-bold ${
                        riskLevels[selectedStudent.gru.riskLevel].text
                      }`}>
                        {selectedStudent.gru.riskLevel}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Risk Score</div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {selectedStudent.gru.riskScore.toFixed(2)}
                      </span>
                      <div className="text-sm text-gray-500 mb-1">/1.0</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                      <div 
                        className={`h-3 rounded-full ${
                          selectedStudent.gru.riskLevel === "HIGH" ? 'bg-red-500' :
                          selectedStudent.gru.riskLevel === "MEDIUM" ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${selectedStudent.gru.riskScore * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">Reconstruction Error</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedStudent.gru.reconstructionError.toFixed(3)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        selectedStudent.gru.reconstructionError < 0.03 ? 'bg-emerald-100 text-emerald-800' :
                        selectedStudent.gru.reconstructionError < 0.05 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStudent.gru.reconstructionError < 0.03 ? 'High Confidence' :
                         selectedStudent.gru.reconstructionError < 0.05 ? 'Medium Confidence' : 'Low Confidence'}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(1 - selectedStudent.gru.reconstructionError / 0.1) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">Risk Trend (Last 4 Weeks)</div>
                    <div className="flex items-end h-16 gap-2">
                      {selectedStudent.gru.history.map((score, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">W{selectedStudent.week - 3 + idx}</div>
                          <div 
                            className={`w-full rounded-t ${
                              idx === 3 ? 'bg-red-400' :
                              idx === 2 ? 'bg-amber-400' :
                              idx === 1 ? 'bg-blue-400' : 'bg-gray-400'
                            }`}
                            style={{ height: `${score * 60}px` }}
                          />
                          <div className="text-xs font-medium mt-1">{score.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {stage === "IDLE" && (
                  <button
                    onClick={analyzeGRU}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Analyzing...
                      </>
                    ) : (
                      '🧠 Analyze with GRU Model'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* RL Decision Section */}
            {stage !== "IDLE" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    🤖 RL Decision Engine
                  </h2>
                  <div className="text-sm text-gray-500">
                    Real-time Policy Optimization
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Engagement Score</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {selectedStudent.engagementScore.toFixed(1)}
                        <span className="text-sm font-normal text-gray-500"> / 3.0</span>
                      </div>
                      <div className={`text-sm font-medium mt-2 ${
                        selectedStudent.engagementScore > 2.0 
                          ? 'text-emerald-600' 
                          : selectedStudent.engagementScore > 1.5
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {selectedStudent.engagementScore > 2.0 
                          ? '✓ Excellent Engagement' 
                          : selectedStudent.engagementScore > 1.5
                          ? '⚠ Moderate Engagement'
                          : '✗ Low Engagement'}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                        <div 
                          className={`h-3 rounded-full ${
                            selectedStudent.engagementScore > 2.0 ? 'bg-emerald-500' :
                            selectedStudent.engagementScore > 1.5 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(selectedStudent.engagementScore / 3) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">Previous Actions</div>
                      <div className="space-y-2">
                        {selectedStudent.previousActions.map((action, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs ${
                              actionDescriptions[action].color
                            }`}>
                              {actionDescriptions[action].icon}
                            </div>
                            <span className="text-sm">{actionDescriptions[action].title}</span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {idx === 2 ? "Latest" : `${2 - idx} week${2 - idx !== 1 ? 's' : ''} ago`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">Engagement Trend</div>
                      <div className="flex items-end h-16 gap-2">
                        {selectedStudent.engagementHistory.map((score, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            <div className="text-xs text-gray-500 mb-1">W{selectedStudent.week - 3 + idx}</div>
                            <div 
                              className={`w-full rounded-t ${
                                idx === 3 ? 'bg-emerald-400' :
                                idx === 2 ? 'bg-blue-400' :
                                idx === 1 ? 'bg-amber-400' : 'bg-gray-400'
                              }`}
                              style={{ height: `${(score / 3) * 60}px` }}
                            />
                            <div className="text-xs font-medium mt-1">{score.toFixed(1)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">Key Metrics</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-white rounded">
                          <div className="text-xs text-gray-500">Risk Threshold</div>
                          <div className="font-bold">0.60</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <div className="text-xs text-gray-500">Engagement Goal</div>
                          <div className="font-bold">1.80</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {stage === "GRU_DONE" && (
                  <button
                    onClick={runRL}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Running RL Policy...
                      </>
                    ) : (
                      '🤖 Run RL Decision Engine'
                    )}
                  </button>
                )}

                {stage === "RL_DONE" && rlAction && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="text-center mb-6">
                      <div className="text-sm text-gray-500 mb-2">Recommended Intervention</div>
                      <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border-2 ${
                        actionDescriptions[rlAction].color
                      } animate-pulse`}>
                        <span className="text-3xl">{actionDescriptions[rlAction].icon}</span>
                        <div className="text-left">
                          <div className="text-2xl font-bold">
                            {actionDescriptions[rlAction].title}
                          </div>
                          <div className="text-sm">
                            {actionDescriptions[rlAction].description}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <span className="font-semibold">Decision Logic:</span> {
                          selectedStudent.gru.riskLevel === "HIGH" && selectedStudent.previousAction === "NONE"
                            ? "High risk with no previous action → Send In-App Reminder"
                            : selectedStudent.gru.riskLevel === "HIGH" && selectedStudent.engagementScore < 1.6
                            ? "High risk with low engagement → Send Email Reminder"
                            : selectedStudent.gru.riskLevel === "MEDIUM" && selectedStudent.engagementScore > 1.8
                            ? "Medium risk with good engagement → Send Motivational Message"
                            : selectedStudent.gru.riskLevel === "LOW"
                            ? "Low risk → No action needed"
                            : "Complex case → Escalate to Peer Support"
                        }
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={addNewWeek}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Simulating Next Week...
                          </>
                        ) : (
                          '📅 Simulate Next Week & Re-Analyze'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Actions & History */}
          <div className="space-y-6">
            {/* Current Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ⚡ Recent Actions (Last 20)
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {simulationHistory.map((history, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className={`p-2 rounded ${
                      actionDescriptions[history.action].color
                    }`}>
                      {actionDescriptions[history.action].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {history.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {actionDescriptions[history.action].title} • {history.timestamp}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      riskLevels[history.riskLevel].bg
                    } ${riskLevels[history.riskLevel].text}`}>
                      {history.riskLevel}
                    </div>
                  </div>
                ))}
                {simulationHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-3xl mb-2">📋</div>
                    <div>No actions yet</div>
                    <div className="text-sm mt-1">Run RL engine to see interventions</div>
                  </div>
                )}
              </div>
            </div>

            {/* All Students Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                👨‍🎓 Risk Distribution
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-600 font-medium">High Risk</span>
                    <span>{students.filter(s => s.gru.riskLevel === "HIGH").length.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-red-500"
                      style={{ width: `${(students.filter(s => s.gru.riskLevel === "HIGH").length / students.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-600 font-medium">Medium Risk</span>
                    <span>{students.filter(s => s.gru.riskLevel === "MEDIUM").length.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-amber-500"
                      style={{ width: `${(students.filter(s => s.gru.riskLevel === "MEDIUM").length / students.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-600 font-medium">Low Risk</span>
                    <span>{students.filter(s => s.gru.riskLevel === "LOW").length.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-emerald-500"
                      style={{ width: `${(students.filter(s => s.gru.riskLevel === "LOW").length / students.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-2">Quick Stats:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-xs">Avg Week: {(students.reduce((acc, s) => acc + s.week, 0) / students.length).toFixed(0)}</div>
                    <div className="text-xs">Avg Eng: {(students.reduce((acc, s) => acc + s.engagementScore, 0) / students.length).toFixed(1)}</div>
                    <div className="text-xs">Active: {students.filter(s => s.previousAction !== "NONE").length}</div>
                    <div className="text-xs">Inactive: {students.filter(s => s.previousAction === "NONE").length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Info */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">📊 System Info</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-300 mb-1">GRU Model</div>
                  <div className="font-medium">Risk Prediction Accuracy: 94.2%</div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: '94.2%' }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">RL Policy</div>
                  <div className="font-medium">Q-Learning with Experience Replay</div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '88.5%' }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">Data Freshness</div>
                  <div className="font-medium">Updated Daily</div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-purple-500" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-300">Total Students</div>
                  <div className="font-medium text-2xl">{students.length.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Last Updated: {new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>Adaptive Learning Intervention System v2.0 • GRU + RL Implementation</p>
          <p className="mt-1">All predictions are simulated for demonstration purposes</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}