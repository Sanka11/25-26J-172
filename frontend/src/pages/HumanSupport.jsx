import { useState, useEffect } from "react";

/* ================= SRI LANKAN HIGH RISK STUDENTS DATA ================= */
const generateHighRiskStudents = () => {
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
    ],
    phonePrefixes: ["077", "078", "076", "071", "072", "070", "075"],
    emails: ["@gmail.com", "@yahoo.com", "@outlook.com", "@univ.lk", "@student.cmb.ac.lk"]
  };

  const students = [];
  const numStudents = Math.floor(Math.random() * 10) + 15; // 15-25 students

  const issues = [
    "Academic Probation",
    "Attendance Below 40%",
    "Failed Multiple Courses",
    "Financial Difficulties",
    "Personal Crisis",
    "Mental Health Concerns",
    "Family Issues",
    "Language Barrier",
    "Academic Dishonesty Case",
    "Repeated Course Failures"
  ];

  const interventionTypes = [
    "Email Reminder",
    "In-App Notification",
    "Peer Support",
    "Academic Warning",
    "Faculty Meeting",
    "Parent Notification",
    "Counselor Referral"
  ];

  for (let i = 0; i < numStudents; i++) {
    const firstName = sriLankanNames.firstNames[Math.floor(Math.random() * sriLankanNames.firstNames.length)];
    const lastName = sriLankanNames.lastNames[Math.floor(Math.random() * sriLankanNames.lastNames.length)];
    const emailPrefix = firstName.toLowerCase() + lastName.toLowerCase().slice(0, 3) + Math.floor(Math.random() * 100);
    
    const riskScore = (Math.random() * 0.3 + 0.7).toFixed(2); // 0.7-1.0
    const engagementScore = (Math.random() * 0.5 + 0.5).toFixed(1); // 0.5-1.0
    const attendance = Math.floor(Math.random() * 20 + 30); // 30-50%
    
    // Generate failed interventions
    const failedInterventions = [];
    const numInterventions = Math.floor(Math.random() * 3) + 3; // 3-5 failed interventions
    for (let j = 0; j < numInterventions; j++) {
      failedInterventions.push({
        type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        responded: Math.random() > 0.7,
        notes: ["No response", "No improvement", "Issue escalated", "Requires personal contact"][
          Math.floor(Math.random() * 4)
        ]
      });
    }

    students.push({
      id: i + 1,
      studentId: `IT${Math.floor(Math.random() * 2000 + 1000)}`,
      name: `${firstName} ${lastName}`,
      department: sriLankanNames.departments[Math.floor(Math.random() * sriLankanNames.departments.length)],
      year: Math.floor(Math.random() * 3 + 2),
      contact: {
        phone: `${sriLankanNames.phonePrefixes[Math.floor(Math.random() * sriLankanNames.phonePrefixes.length)]}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        email: emailPrefix + sriLankanNames.emails[Math.floor(Math.random() * sriLankanNames.emails.length)],
        address: `Hostel ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 200 + 100)}, University of Colombo`,
        guardianPhone: `0${Math.floor(Math.random() * 2) + 7}${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`
      },
      academic: {
        gpa: (Math.random() * 0.8 + 1.2).toFixed(2), // 1.2-2.0
        failedCourses: Math.floor(Math.random() * 3) + 1,
        currentCourse: sriLankanNames.courses[Math.floor(Math.random() * sriLankanNames.courses.length)],
        attendance: attendance,
        lastExamScore: Math.floor(Math.random() * 30 + 30) // 30-60%
      },
      risk: {
        score: riskScore,
        level: riskScore > 0.8 ? "CRITICAL" : "HIGH",
        trend: Math.random() > 0.5 ? "increasing" : "stable",
        primaryIssue: issues[Math.floor(Math.random() * issues.length)],
        flaggedDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
        escalationLevel: Math.floor(Math.random() * 3) + 1 // 1-3
      },
      interventions: {
        attempted: numInterventions,
        failed: failedInterventions,
        lastAttempt: failedInterventions[failedInterventions.length - 1].date,
        requiresHumanContact: true
      },
      engagement: {
        score: engagementScore,
        lastLogin: `${Math.floor(Math.random() * 21) + 5} days ago`, // 5-25 days
        platformActivity: Math.floor(Math.random() * 10),
        peerConnections: Math.floor(Math.random() * 5)
      },
      support: {
        assignedCounselor: ["Dr. Perera", "Prof. Fernando", "Ms. Silva", "Mr. Ratnayake", "Dr. Jayawardena"][
          Math.floor(Math.random() * 5)
        ],
        nextReview: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Next 7 days
        priority: riskScore > 0.9 ? "URGENT" : riskScore > 0.8 ? "HIGH" : "MEDIUM",
        notes: [
          "Has not responded to any automated interventions",
          "May require in-person meeting",
          "Consider contacting guardians",
          "Schedule campus visit",
          "Check for external factors"
        ][Math.floor(Math.random() * 5)]
      }
    });
  }

  // Sort by risk score (highest first)
  return students.sort((a, b) => parseFloat(b.risk.score) - parseFloat(a.risk.score));
};

/* ================= COUNSELOR/STAFF DATA ================= */
const staffMembers = [
  { id: 1, name: "Dr. Nimal Perera", role: "Head Counselor", email: "nimal.perera@cmb.ac.lk", phone: "011-2345678", students: 12 },
  { id: 2, name: "Ms. Priya Fernando", role: "Academic Advisor", email: "priya.fernando@cmb.ac.lk", phone: "011-2345679", students: 8 },
  { id: 3, name: "Prof. Kamal Silva", role: "Department Head", email: "kamal.silva@cmb.ac.lk", phone: "011-2345680", students: 15 },
  { id: 4, name: "Mrs. Shanika Ratnayake", role: "Student Welfare Officer", email: "shanika.ratnayake@cmb.ac.lk", phone: "011-2345681", students: 10 },
  { id: 5, name: "Mr. Sunil Bandara", role: "Crisis Counselor", email: "sunil.bandara@cmb.ac.lk", phone: "011-2345682", students: 5 }
];

/* ================= DASHBOARD COMPONENT ================= */
export default function HighRiskInterventionDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({
    riskLevel: "all",
    department: "all",
    escalationLevel: "all",
    priority: "all"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    total: 0,
    avgFailedInterventions: 0,
    avgRiskScore: 0
  });

  useEffect(() => {
    const data = generateHighRiskStudents();
    setStudents(data);
    setFilteredStudents(data);
    updateStats(data);
  }, []);

  useEffect(() => {
    let result = students;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.riskLevel !== "all") {
      result = result.filter(student => student.risk.level === filters.riskLevel);
    }

    if (filters.department !== "all") {
      result = result.filter(student => student.department === filters.department);
    }

    if (filters.escalationLevel !== "all") {
      result = result.filter(student => student.risk.escalationLevel.toString() === filters.escalationLevel);
    }

    if (filters.priority !== "all") {
      result = result.filter(student => student.support.priority === filters.priority);
    }

    setFilteredStudents(result);
    updateStats(result);
  }, [students, filters, searchTerm]);

  const updateStats = (data) => {
    const critical = data.filter(s => s.risk.level === "CRITICAL").length;
    const high = data.filter(s => s.risk.level === "HIGH").length;
    const total = data.length;
    const avgFailedInterventions = data.length > 0 
      ? (data.reduce((sum, s) => sum + s.interventions.attempted, 0) / data.length).toFixed(1)
      : 0;
    const avgRiskScore = data.length > 0
      ? (data.reduce((sum, s) => sum + parseFloat(s.risk.score), 0) / data.length).toFixed(2)
      : 0;

    setStats({ critical, high, total, avgFailedInterventions, avgRiskScore });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getRiskColor = (level) => {
    switch(level) {
      case "CRITICAL": return "bg-red-600";
      case "HIGH": return "bg-orange-500";
      default: return "bg-yellow-500";
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "URGENT": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportContacts = () => {
    // This would export contact info in real implementation
    alert(`Exported contact information for ${filteredStudents.length} students.`);
  };

  const handleGenerateReport = () => {
    // This would generate a report in real implementation
    alert(`Report generated for ${filteredStudents.length} high-risk students.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🚨 High-Risk Students Intervention Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Students requiring manual intervention after failed automated support attempts
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-3">
              <button
                onClick={handleExportContacts}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                📞 Export Contacts
              </button>
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                📊 Generate Report
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Critical Cases</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.critical}
              </div>
              <div className="text-xs text-gray-500 mt-1">Require immediate contact</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">High Risk Cases</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.high}
              </div>
              <div className="text-xs text-gray-500 mt-1">Need this week follow-up</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Total Students</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500 mt-1">Manual intervention needed</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Avg Failed Interventions</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.avgFailedInterventions}
              </div>
              <div className="text-xs text-gray-500 mt-1">Per student</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-500">Avg Risk Score</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgRiskScore}
              </div>
              <div className="text-xs text-gray-500 mt-1">Out of 1.0</div>
            </div>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, student ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filters.riskLevel}
                onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
              </select>
              
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-lg ${viewMode === "grid" ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  🏠 Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 rounded-lg ${viewMode === "list" ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  📋 List
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Information Technology">IT</option>
                <option value="Data Science">Data Science</option>
                <option value="Cyber Security">Cyber Security</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Level</label>
              <select
                value={filters.escalationLevel}
                onChange={(e) => handleFilterChange("escalationLevel", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Failed Interventions</label>
              <select
                value={filters.interventionCount}
                onChange={(e) => handleFilterChange("interventionCount", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Any number</option>
                <option value="3">3+ interventions</option>
                <option value="4">4+ interventions</option>
                <option value="5">5+ interventions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
              <select
                value={filters.lastLogin}
                onChange={(e) => handleFilterChange("lastLogin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Any time</option>
                <option value="7">7+ days ago</option>
                <option value="14">14+ days ago</option>
                <option value="21">21+ days ago</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Student Cards/Table */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`bg-white rounded-xl shadow-lg p-5 border-2 cursor-pointer transition-all hover:shadow-xl ${
                      selectedStudent?.id === student.id 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.studentId}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(student.risk.level)} text-white`}>
                        {student.risk.level}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Score</span>
                        <span className="font-bold text-red-600">{student.risk.score}</span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Failed Interventions</span>
                          <span className="font-medium">{student.interventions.attempted}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-red-500"
                            style={{ width: `${(student.interventions.attempted / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <div>
                          <div className="text-gray-600">Department</div>
                          <div className="font-medium">{student.department}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Year</div>
                          <div className="font-medium">{student.year}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">GPA</div>
                          <div className="font-medium">{student.academic.gpa}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-500">Primary Issue</div>
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {student.risk.primaryIssue}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${getPriorityColor(student.support.priority)}`}>
                          {student.support.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Failed Interventions
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map(student => (
                      <tr 
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedStudent?.id === student.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                            <div className="text-xs text-gray-400">{student.department}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${getRiskColor(student.risk.level)}`} />
                            <div>
                              <div className={`font-bold ${
                                student.risk.level === "CRITICAL" ? 'text-red-700' : 'text-orange-700'
                              }`}>
                                {student.risk.level}
                              </div>
                              <div className="text-xs text-gray-500">Score: {student.risk.score}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">{student.interventions.attempted}</div>
                            <div className="text-xs text-gray-500">attempts</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium">
                              {student.interventions.lastAttempt.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.floor((Date.now() - student.interventions.lastAttempt) / (1000 * 60 * 60 * 24))} days ago
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(student.support.priority)}`}>
                            {student.support.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div>📱 {student.contact.phone}</div>
                            <div>📧 {student.contact.email}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filteredStudents.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Students Found</h3>
                <p className="text-gray-600 mb-6">
                  No students match your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      riskLevel: "all",
                      department: "all",
                      escalationLevel: "all",
                      priority: "all"
                    });
                    setSearchTerm("");
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Student Details & Staff */}
          <div className="space-y-6">
            {/* Selected Student Details */}
            {selectedStudent ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  👨‍🎓 Student Details
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{selectedStudent.name}</div>
                      <div className="text-sm text-gray-500">{selectedStudent.studentId}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(selectedStudent.risk.level)} text-white`}>
                      {selectedStudent.risk.level}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-sm font-medium text-red-800 mb-2">⚠️ Why Manual Intervention Needed</div>
                    <div className="text-xs text-red-700">
                      {selectedStudent.interventions.attempted} automated interventions failed. 
                      Last attempt: {selectedStudent.interventions.lastAttempt.toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">📞 Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{selectedStudent.contact.phone}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(selectedStudent.contact.phone)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium truncate">{selectedStudent.contact.email}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(selectedStudent.contact.email)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Address:</span>
                        <span className="font-medium">{selectedStudent.contact.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Guardian:</span>
                        <span className="font-medium">{selectedStudent.contact.guardianPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">📚 Academic Status</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">GPA</div>
                        <div className="font-bold">{selectedStudent.academic.gpa}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Attendance</div>
                        <div className="font-bold">{selectedStudent.academic.attendance}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Failed Courses</div>
                        <div className="font-bold">{selectedStudent.academic.failedCourses}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Last Exam</div>
                        <div className="font-bold">{selectedStudent.academic.lastExamScore}%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">🔄 Failed Interventions</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                      {selectedStudent.interventions.failed.map((intervention, idx) => (
                        <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="font-medium">{intervention.type}</div>
                          <div className="text-xs text-gray-500">
                            {intervention.date.toLocaleDateString()} • {intervention.notes}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-2">👤 Assigned Support</h3>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium">{selectedStudent.support.assignedCounselor}</div>
                      <div className="text-sm text-blue-700">
                        Priority: <span className="font-bold">{selectedStudent.support.priority}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Next review: {selectedStudent.support.nextReview.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">👈</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a Student</h3>
                  <p className="text-gray-600 text-sm">
                    Click on any student card to view detailed information and contact details
                  </p>
                </div>
              </div>
            )}

            {/* Staff Assignment */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                👥 Support Staff
              </h2>
              
              <div className="space-y-4">
                {staffMembers.map(staff => (
                  <div key={staff.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="font-medium text-gray-900">{staff.name}</div>
                    <div className="text-sm text-gray-600">{staff.role}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs">
                        <div>📧 {staff.email}</div>
                        <div>📱 {staff.phone}</div>
                      </div>
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {staff.students} students
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3">📋 Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                    Schedule Meeting
                  </button>
                  <button className="p-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition-colors">
                    Send Email
                  </button>
                  <button className="p-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors">
                    Call Guardian
                  </button>
                  <button className="p-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors">
                    Emergency Protocol
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">📊 Intervention Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-300 mb-1">Critical Cases</div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-bold">{stats.critical}</div>
                    <div className="text-sm text-gray-400">students</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">Avg Response Time</div>
                  <div className="text-xl font-bold">4.2 days</div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: '70%' }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-1">Success Rate</div>
                  <div className="text-xl font-bold">65%</div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-300">Last Updated</div>
                  <div className="font-medium">{new Date().toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {filteredStudents.length} students need attention
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>University of Colombo - Student Crisis Intervention System 🚨</p>
          <p className="mt-1">
            <span className="inline-block mx-2">•</span>
            For staff use only - Confidential Information
            <span className="inline-block mx-2">•</span>
            Data updated daily
            <span className="inline-block mx-2">•</span>
            Emergency contact: 011-9999999
          </p>
        </footer>
      </div>

      <style jsx>{`
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