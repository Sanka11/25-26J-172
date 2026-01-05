import { useState, useEffect } from "react";

/* ================= SRI LANKAN NAMES DATABASE ================= */
const sriLankanNames = {
  firstNames: [
    "Nimal", "Kamal", "Sunil", "Priya", "Lakshitha", "Tharindu", "Dilini", "Sachini", 
    "Chamara", "Dinesh", "Nishadi", "Prabodha", "Sanjaya", "Shanika", "Thilini", 
    "Asiri", "Binura", "Chathura", "Dulanga", "Eranda", "Gayani", "Hiruni", "Ishara",
    "Janaka", "Kavindu", "Lahiru", "Madhushan", "Nipun", "Oshadi", "Pasan", "Ravindu",
    "Sanduni", "Tharaka", "Udaya", "Vidura", "Yasas", "Anuradha", "Buddhika", "Chamila",
    "Darshana", "Eranga", "Fazlan", "Gayan", "Harsha", "Indika", "Jeevan", "Kasun",
    "Lasith", "Mahesh", "Nadeesha", "Pradeep", "Ranga", "Saman", "Thushara", "Upul",
    "Wasantha", "Yohan"
  ],
  lastNames: [
    "Perera", "Fernando", "Silva", "De Silva", "Ratnayake", "Wijesinghe", "Bandara",
    "Jayawardena", "Weerasinghe", "Gunawardena", "Dissanayake", "Amarasinghe",
    "Rajapaksa", "Wickramasinghe", "Herath", "Abeywickrama", "Alwis", "Cooray",
    "Dharmasena", "Ekanayake", "Fonseka", "Gamage", "Hettiarachchi", "Illangakoon",
    "Jayasinghe", "Karunaratne", "Liyanage", "Mendis", "Nanayakkara", "Opatha",
    "Peiris", "Ranatunga", "Samarasinghe", "Tennakoon", "Udawatte", "Vithanage",
    "Wickramaratne", "Yapa", "Zoysa"
  ],
  departments: [
    "Computer Science", "Software Engineering", "Information Technology", 
    "Data Science", "Cyber Security", "Business IT", "Bioinformatics"
  ],
  courses: [
    "Programming Fundamentals", "Data Structures", "Database Systems", 
    "Web Development", "Machine Learning", "Software Engineering", 
    "Network Security", "Mobile App Development", "Cloud Computing"
  ]
};

/* ================= MOCKED PEER DATA ================= */
const generateMockPeers = () => {
  const peers = [];
  
  for (let i = 0; i < 8; i++) {
    const firstName = sriLankanNames.firstNames[Math.floor(Math.random() * sriLankanNames.firstNames.length)];
    const lastName = sriLankanNames.lastNames[Math.floor(Math.random() * sriLankanNames.lastNames.length)];
    
    peers.push({
      peerId: `P${(i + 1).toString().padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      studentId: `IT${Math.floor(Math.random() * 2000 + 1000)}`,
      year: Math.floor(Math.random() * 3 + 2), // 2nd to 4th year
      department: sriLankanNames.departments[Math.floor(Math.random() * sriLankanNames.departments.length)],
      currentGPA: (Math.random() * 1.5 + 2.5).toFixed(2), // 2.5-4.0
      friendsWith: Math.floor(Math.random() * 3) + 2, // 2-4 friends
      groupProjects: Math.floor(Math.random() * 3) + 1, // 1-3 projects
      supportScore: (Math.random() * 1.5 + 3.0).toFixed(1), // 3.0-4.5
      relationship: ["Close Friend", "Group Member", "Classmate", "Roommate"][Math.floor(Math.random() * 4)],
      lastActive: `${Math.floor(Math.random() * 3)} days ago`
    });
  }
  
  return peers;
};

/* ================= STUDENT WITH PEER RELATIONSHIPS ================= */
const generateRiskStudentWithPeers = () => {
  // Generate the main at-risk student
  const firstName = sriLankanNames.firstNames[Math.floor(Math.random() * sriLankanNames.firstNames.length)];
  const lastName = sriLankanNames.lastNames[Math.floor(Math.random() * sriLankanNames.lastNames.length)];
  
  const student = {
    studentId: `IT${Math.floor(Math.random() * 2000 + 1000)}`,
    name: `${firstName} ${lastName}`,
    department: sriLankanNames.departments[Math.floor(Math.random() * sriLankanNames.departments.length)],
    year: Math.floor(Math.random() * 3 + 2),
    riskLevel: "HIGH",
    riskScore: (Math.random() * 0.3 + 0.6).toFixed(2), // 0.6-0.9
    engagementScore: (Math.random() * 1.0 + 1.0).toFixed(1), // 1.0-2.0
    attendance: Math.floor(Math.random() * 30 + 50), // 50-80%
    lastActive: `${Math.floor(Math.random() * 14) + 1} days ago`,
    currentCourse: sriLankanNames.courses[Math.floor(Math.random() * sriLankanNames.courses.length)],
    interventionTriggered: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
    reason: [
      "Low assignment submission",
      "Poor exam performance",
      "Frequent absences",
      "Declining participation",
      "Missed deadlines"
    ][Math.floor(Math.random() * 5)],
    peers: generateMockPeers()
  };
  
  return student;
};

/* ================= SURVEY QUESTIONS ================= */
const surveyQuestions = [
  {
    id: 1,
    question: "As someone who knows this student, have you noticed any recent changes in their behavior?",
    options: ["More withdrawn", "Less engaged in group work", "Missing classes", "Seems stressed", "No significant change"],
    type: "checkbox"
  },
  {
    id: 2,
    question: "How would you describe your relationship with this student?",
    options: ["Close friend", "Group project member", "Classmate", "Roommate/Hostel mate", "Acquaintance"],
    type: "multiple_choice"
  },
  {
    id: 3,
    question: "Have you spoken to them about their studies recently?",
    options: ["Yes, they seemed fine", "Yes, they mentioned some struggles", "No, but I noticed they're quiet", "No, haven't had a chance", "We don't usually talk about studies"],
    type: "multiple_choice"
  },
  {
    id: 4,
    question: "In your opinion, what might help them improve? (Select all that apply)",
    options: ["Study group sessions", "One-on-one tutoring", "Better time management", "Mental health support", "More engagement in class", "Reduced workload"],
    type: "checkbox"
  },
  {
    id: 5,
    question: "Would you be willing to reach out and offer support?",
    options: ["Yes, definitely", "Yes, if guided on what to say", "Maybe, but unsure how to help", "Prefer not to get involved"],
    type: "multiple_choice"
  },
  {
    id: 6,
    question: "Any additional information or observations that might help?",
    type: "text_area",
    placeholder: "e.g., I noticed they've been missing our group study sessions..."
  }
];

/* ================= PEER VIEW DASHBOARD ================= */
export default function PeerStudentDashboard() {
  const [student, setStudent] = useState(generateRiskStudentWithPeers());
  const [selectedPeer, setSelectedPeer] = useState(student.peers[0]);
  const [activeTab, setActiveTab] = useState("overview");
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const [notification, setNotification] = useState(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      message: `Hi ${selectedPeer.name}, your friend ${student.name} has been identified as needing some academic support. Your perspective as someone who knows them could be really valuable.`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 2,
      sender: "system",
      message: "Please complete the short survey about your observations and consider sending an encouraging message.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    }
  ]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: "me",
      message: messageInput,
      timestamp: new Date(),
      read: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");

    // Show success notification
    setNotification({
      type: "success",
      message: `Your message has been sent to the support system. Counselors will review it and coordinate support for ${student.name}.`
    });

    setTimeout(() => setNotification(null), 4000);
  };

  const handleSurveySubmit = (e) => {
    e.preventDefault();
    
    // In a real app, this would send to backend
    console.log("Survey submitted:", surveyAnswers);
    
    // Show success notification
    setNotification({
      type: "success",
      message: "Thank you for completing the survey! Your insights will help us support your friend better."
    });

    setTimeout(() => setNotification(null), 4000);
    
    // Mark as completed
    setSelectedPeer(prev => ({
      ...prev,
      surveyCompleted: true
    }));

    setSurveyAnswers({});
    setShowSurvey(false);
  };

  const handleSurveyChange = (questionId, value) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleRefresh = () => {
    setStudent(generateRiskStudentWithPeers());
    setSelectedPeer(student.peers[0]);
    setActiveTab("overview");
    setSurveyAnswers({});
    setMessageInput("");
    setShowSurvey(false);
    setMessages([
      {
        id: 1,
        sender: "system",
        message: `Hi ${student.peers[0].name}, your friend ${student.name} has been identified as needing some academic support. Your perspective as someone who knows them could be really valuable.`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true
      },
      {
        id: 2,
        sender: "system",
        message: "Please complete the short survey about your observations and consider sending an encouraging message.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true
      }
    ]);
  };

  const getRelationshipIcon = (relationship) => {
    switch(relationship) {
      case "Close Friend": return "🤝";
      case "Group Member": return "👥";
      case "Classmate": return "🎓";
      case "Roommate": return "🏠";
      default: return "🙋";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🤝 Friend Support Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Help your fellow students succeed - Your perspective matters
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                🔄 View Another Case
              </button>
            </div>
          </div>

          {/* Current Peer Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="text-sm text-blue-200 mb-2">You are viewing as:</div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <span className="text-2xl">🙋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPeer.name}</h2>
                    <div className="text-blue-200">
                      {selectedPeer.studentId} • Year {selectedPeer.year} • {selectedPeer.department}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 bg-white/20 p-4 rounded-xl">
                <div className="text-sm text-blue-200">Your Support Score</div>
                <div className="text-3xl font-bold">{selectedPeer.supportScore}/5.0</div>
                <div className="text-xs text-blue-200 mt-1">Based on previous help given</div>
              </div>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-xl border ${
            notification.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          } animate-fadeIn`}>
            <div className="flex items-center gap-3">
              <div className="text-xl">
                {notification.type === "success" ? "✅" : "ℹ️"}
              </div>
              <div>{notification.message}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Student Info & Peers */}
          <div className="space-y-6">
            {/* Student Profile */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                👨‍🎓 Student Needing Support
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.studentId}</div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="font-bold text-red-800">HIGH RISK STATUS</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <div className="mb-2">
                      <span className="font-medium">Reason:</span> {student.reason}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Course:</span> {student.currentCourse}
                    </div>
                    <div>
                      <span className="font-medium">Last Active:</span> {student.lastActive}
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Risk Score</span>
                      <span>{student.riskScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${parseFloat(student.riskScore) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Engagement</span>
                      <span>{student.engagementScore}/3.0</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          parseFloat(student.engagementScore) > 2.0 ? 'bg-emerald-500' :
                          parseFloat(student.engagementScore) > 1.5 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(parseFloat(student.engagementScore) / 3) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Attendance</span>
                      <span>{student.attendance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${student.attendance}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <div className="font-medium mb-2">📚 Academic Info:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Department: {student.department}</div>
                    <div>Year: {student.year}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Peers */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                👥 Other Friends Who Know This Student
              </h2>
              
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {student.peers.map((peer, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPeer(peer)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedPeer.peerId === peer.peerId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        peer.relationship === "Close Friend" ? 'bg-purple-100 text-purple-800' :
                        peer.relationship === "Group Member" ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getRelationshipIcon(peer.relationship)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{peer.name}</div>
                        <div className="text-xs text-gray-500">{peer.relationship}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs">
                            <span className="font-medium">Y{peer.year}</span>
                          </div>
                          <div className="text-xs flex items-center gap-1">
                            <span className="text-amber-600">⭐</span>
                            <span>GPA: {peer.currentGPA}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                <div className="font-medium">ℹ️ How this works:</div>
                <div className="text-xs mt-1">
                  You can switch between different friend perspectives. Each person might have different insights.
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-2">
              <div className="flex space-x-1">
                {["overview", "survey", "message", "resources"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === "overview" && "📋 Overview"}
                    {tab === "survey" && "📝 Complete Survey"}
                    {tab === "message" && "💬 Send Message"}
                    {tab === "resources" && "🛠️ Support Resources"}
                  </button>
                ))}
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  How You Can Help {student.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <div className="text-blue-800 text-3xl mb-3">🤝</div>
                    <h3 className="font-bold text-gray-800 mb-2">Your Connection</h3>
                    <p className="text-gray-700 mb-4">
                      You know {student.name} as a {selectedPeer.relationship.toLowerCase()}. 
                      You've worked together on {selectedPeer.groupProjects} group project(s) 
                      and have {selectedPeer.friendsWith} mutual friends.
                    </p>
                    <div className="text-sm text-blue-700 font-medium">
                      Your perspective is valuable because you see them in different settings.
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                    <div className="text-emerald-800 text-3xl mb-3">🎯</div>
                    <h3 className="font-bold text-gray-800 mb-2">Why Your Help Matters</h3>
                    <p className="text-gray-700 mb-4">
                      Friends often notice changes first. Your insights can help university 
                      support services provide better, more personalized assistance.
                    </p>
                    <div className="text-sm text-emerald-700 font-medium">
                      Research shows peer support improves student retention by 40%.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab("survey")}
                    className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <div className="font-bold">Complete Survey</div>
                    <div className="text-sm opacity-90">Share your observations</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("message")}
                    className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md"
                  >
                    <div className="text-2xl mb-2">💬</div>
                    <div className="font-bold">Send Message</div>
                    <div className="text-sm opacity-90">Offer encouragement</div>
                  </button>

                  <button
                    onClick={() => setActiveTab("resources")}
                    className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                  >
                    <div className="text-2xl mb-2">🛠️</div>
                    <div className="font-bold">Get Resources</div>
                    <div className="text-sm opacity-90">Learn how to help</div>
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">📋 What happens next?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4">
                      <div className="text-2xl mb-2">1</div>
                      <div className="font-medium">You share insights</div>
                      <div className="text-sm text-gray-600">Complete survey or send message</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl mb-2">2</div>
                      <div className="font-medium">System analyzes</div>
                      <div className="text-sm text-gray-600">Combines all peer perspectives</div>
                    </div>
                    <div className="text-center p-4">
                      <div className="text-2xl mb-2">3</div>
                      <div className="font-medium">Coordinated help</div>
                      <div className="text-sm text-gray-600">University provides targeted support</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Survey Tab */}
            {activeTab === "survey" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    📝 Share Your Observations
                  </h2>
                  {selectedPeer.surveyCompleted && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                      ✅ Survey Completed
                    </span>
                  )}
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">ℹ️</div>
                    <div className="text-sm text-blue-800">
                      This information helps university counselors understand {student.name}'s situation better. 
                      All responses are confidential and will be combined with other perspectives.
                    </div>
                  </div>
                </div>

                {!selectedPeer.surveyCompleted ? (
                  <form onSubmit={handleSurveySubmit} className="space-y-6">
                    {surveyQuestions.map((q) => (
                      <div key={q.id} className="bg-gray-50 rounded-xl p-5">
                        <label className="block text-lg font-medium text-gray-800 mb-3">
                          {q.question}
                        </label>
                        {q.type === "multiple_choice" ? (
                          <div className="space-y-3">
                            {q.options.map((option, idx) => (
                              <label key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`q${q.id}`}
                                  value={option}
                                  onChange={() => handleSurveyChange(q.id, option)}
                                  className="text-blue-600"
                                />
                                <span className="flex-1">{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : q.type === "checkbox" ? (
                          <div className="space-y-3">
                            {q.options.map((option, idx) => (
                              <label key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={option}
                                  onChange={(e) => {
                                    const current = surveyAnswers[q.id] || [];
                                    const updated = e.target.checked
                                      ? [...current, option]
                                      : current.filter(item => item !== option);
                                    handleSurveyChange(q.id, updated);
                                  }}
                                  className="text-blue-600"
                                />
                                <span className="flex-1">{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            onChange={(e) => handleSurveyChange(q.id, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            rows="4"
                            placeholder={q.placeholder || "Enter your observations here..."}
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="flex gap-4 pt-6">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg text-lg font-medium"
                      >
                        ✅ Submit Survey
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6">🎉</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      Thank You for Your Help!
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                      Your insights have been recorded. Combined with other friends' perspectives, 
                      this will help university support services provide better assistance to {student.name}.
                    </p>
                    <button
                      onClick={() => setActiveTab("message")}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
                    >
                      💬 Consider Sending an Encouraging Message
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Message Tab */}
            {activeTab === "message" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  💬 Send a Supportive Message
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Message Thread */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h3 className="font-semibold text-gray-800 mb-4">Message Thread</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin p-2">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-4 rounded-xl ${
                              msg.sender === "me"
                                ? 'bg-blue-100 border border-blue-200 ml-8'
                                : 'bg-gray-100 border border-gray-200 mr-8'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <div className={`font-medium ${
                                msg.sender === "me" ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                                {msg.sender === "me" ? "You" : "System"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {msg.timestamp.toLocaleDateString()} at{" "}
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                            <div className={msg.sender === "me" ? "text-blue-900" : "text-gray-700"}>
                              {msg.message}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="mt-6">
                        <div className="text-sm font-medium text-gray-800 mb-2">
                          Your message to support coordinators:
                        </div>
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Share what you'd like to say to ${student.name}, or suggest ways to help them...`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          rows="4"
                        />
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-sm text-gray-500">
                            Messages are reviewed by support staff before sharing
                          </div>
                          <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Templates */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                      <h3 className="font-semibold text-gray-800 mb-4">💡 Message Ideas</h3>
                      <div className="space-y-3">
                        {[
                          "Hey, I noticed you've been quiet in class recently. Everything okay?",
                          "The assignment deadline is coming up. Want to study together this week?",
                          "I remember you helped me with the last project. Let me know if you need any help now!",
                          "Miss seeing you in our study group. We're meeting tomorrow if you want to join!"
                        ].map((template, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMessageInput(template)}
                            className="w-full p-3 bg-white text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-sm"
                          >
                            "{template}"
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                      <h3 className="font-semibold text-gray-800 mb-4">📋 Message Guidelines</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600">✓</span>
                          <span>Be supportive, not confrontational</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600">✓</span>
                          <span>Offer specific help if you can</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600">✓</span>
                          <span>Mention you're coming from a place of care</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600">✓</span>
                          <span>Keep it casual and friendly</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === "resources" && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  🛠️ Support Resources & Guidance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="text-3xl mb-4">🤔</div>
                    <h3 className="text-xl font-bold mb-3">How to Approach Your Friend</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Choose a private, comfortable setting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Start with "I've noticed..." not "You should..."</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Listen more than you talk</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Offer specific help, not just general offers</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                    <div className="text-3xl mb-4">📞</div>
                    <h3 className="text-xl font-bold mb-3">University Support Services</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Academic Counseling: 011-1234567</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Mental Health Support: 011-7654321</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Tutoring Center: Building C, Room 205</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Emergency: 011-9999999</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Academic Help Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a href="#" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="text-blue-600 text-lg mb-2">📖</div>
                      <div className="font-medium">Study Skills Workshops</div>
                      <div className="text-sm text-gray-600">Every Wednesday, 2-4 PM</div>
                    </a>
                    <a href="#" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="text-blue-600 text-lg mb-2">👥</div>
                      <div className="font-medium">Peer Tutoring</div>
                      <div className="text-sm text-gray-600">One-on-one subject help</div>
                    </a>
                    <a href="#" className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="text-blue-600 text-lg mb-2">⏰</div>
                      <div className="font-medium">Time Management</div>
                      <div className="text-sm text-gray-600">Tools and techniques</div>
                    </a>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ What to Do If You're Worried</h3>
                  <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                    <div className="flex items-start gap-3">
                      <div className="text-red-600 text-xl">🚨</div>
                      <div>
                        <div className="font-medium text-red-800 mb-2">Immediate Concerns</div>
                        <div className="text-sm text-red-700">
                          If you have serious concerns about {student.name}'s wellbeing 
                          (e.g., talking about self-harm, severe depression, or other emergencies), 
                          please contact university emergency services immediately at 011-9999999 
                          or approach a faculty member directly.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>University of Colombo - Student Support System 🤝</p>
          <p className="mt-1">
            <span className="inline-block mx-2">•</span>
            Confidential Peer Support Network
            <span className="inline-block mx-2">•</span>
            Data Privacy Protected
            <span className="inline-block mx-2">•</span>
            All communications are monitored by support staff
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
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