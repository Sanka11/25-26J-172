import React, { useEffect, useState } from "react";
import { enrollSubject } from "../services/api/enrollmentService";
import { enrollInternship } from "../services/api/internshipService";
import { fetchAllSubjects } from "../services/api/subjectService";
import {
  FaBook,
  FaBuilding,
  FaLock,
  FaCalendarAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaChalkboardTeacher,
  FaGraduationCap,
} from "react-icons/fa";

const EnrollCourses = () => {
  const studentId = "S001"; // later from auth

  const [subjects, setSubjects] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

 

 useEffect(() => {
   loadData();
 }, []);

 const loadData = async () => {
   setLoading(true);
   try {
     const data = await fetchAllSubjects(studentId);

     setSubjects(data.availableSubjects || []);
     // data.enrolledSubjects available if you want to show status
     // data.internship available for internship section
   } catch (err) {
     showNotification("Failed to load enrollment data", "error");
   } finally {
     setLoading(false);
   }
 };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 4000);
  };

  const handlePasswordChange = (subjectId, value) => {
    setPasswords({ ...passwords, [subjectId]: value });
  };

  const handleSubjectEnroll = async (subjectId) => {
    setEnrollingId(subjectId);
    try {
      await enrollSubject({
        studentId,
        subjectId,
        password: passwords[subjectId],
      });
      showNotification(`${subjectId} enrolled successfully! ✅`, "success");
      // Clear password after successful enrollment
      setPasswords({ ...passwords, [subjectId]: "" });
    } catch (err) {
      showNotification(err.message || "Failed to enroll in subject", "error");
    } finally {
      setEnrollingId(null);
    }
  };

  const handleInternshipEnroll = async () => {
    setEnrollingId("internship");
    try {
      await enrollInternship({
        studentId,
        internshipId: "intern_2026",
      });
      showNotification("Internship enrolled successfully! 🏢", "success");
    } catch (err) {
      showNotification(
        err.message || "Failed to enroll in internship",
        "error",
      );
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow">
            <FaGraduationCap className="text-3xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Course Enrollment
            </h1>
            <p className="text-gray-600 mt-1">
              Enroll in subjects and internship for the upcoming semester
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 font-medium">
            👤 Logged in as: <span className="font-bold">{studentId}</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available courses...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subjects Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FaBook className="text-2xl text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Available Subjects
                  </h2>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {subjects.length} Subjects
                </span>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-12">
                  <FaBook className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    No subjects available for enrollment
                  </p>
                  <p className="text-gray-400 mt-2">
                    Check back later for new courses
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subjects.map((sub) => (
                    <div
                      key={sub.subjectId}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Semester {sub.semester}
                          </span>
                          <h3 className="text-xl font-bold text-gray-800 mt-2">
                            {sub.subjectName}
                          </h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {sub.subjectId}
                          </p>
                        </div>
                        <FaChalkboardTeacher className="text-3xl text-blue-400" />
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaCalendarAlt className="mr-2 text-blue-400" />
                          <span>
                            {sub.lectureDays?.length > 0
                              ? sub.lectureDays.join(", ")
                              : "Schedule not set"}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <FaHourglassHalf className="mr-2 text-blue-400" />
                          <span>
                            {sub.lectureHoursPerDay || "N/A"} hours per day
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            placeholder="Enter enrollment password"
                            value={passwords[sub.subjectId] || ""}
                            onChange={(e) =>
                              handlePasswordChange(
                                sub.subjectId,
                                e.target.value,
                              )
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>
                        <button
                          onClick={() => handleSubjectEnroll(sub.subjectId)}
                          disabled={
                            enrollingId === sub.subjectId ||
                            !passwords[sub.subjectId]
                          }
                          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                            enrollingId === sub.subjectId
                              ? "bg-blue-400 cursor-not-allowed"
                              : passwords[sub.subjectId]
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow hover:shadow-lg"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {enrollingId === sub.subjectId ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enrolling...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <FaCheckCircle /> Enroll Subject
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Internship Section */}
          <div>
            <div className="sticky top-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg p-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                  <FaBuilding className="text-2xl text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Internship Program
                </h2>
              </div>

              <div className="bg-white rounded-xl p-5 border border-indigo-200 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FaBuilding className="text-xl text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Industrial Internship
                    </h3>
                    <p className="text-gray-600">
                      Gain real-world industry experience
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 text-indigo-500">📅</div>
                    <span className="ml-2">Mon – Fri (Full-time)</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 text-indigo-500">⏰</div>
                    <span className="ml-2">9:00 AM – 5:00 PM</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 text-indigo-500">📝</div>
                    <span className="ml-2">Credit-based program</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 text-indigo-500">🎯</div>
                    <span className="ml-2">Industry mentorship included</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <p className="text-indigo-700 text-sm">
                    <strong>Note:</strong> Internship enrollment requires
                    departmental approval and will be confirmed within 3
                    business days.
                  </p>
                </div>
              </div>

              <button
                onClick={handleInternshipEnroll}
                disabled={enrollingId === "internship"}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  enrollingId === "internship"
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {enrollingId === "internship" ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing Enrollment...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <FaBuilding /> Enroll in Internship
                  </span>
                )}
              </button>

              {/* Enrollment Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Enrollment Status
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subjects Enrolled</span>
                    <span className="font-semibold text-blue-600">
                      0/{subjects.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Internship Status</span>
                    <span className="font-semibold text-amber-600">
                      Not Enrolled
                    </span>
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <strong>Tip:</strong> You can enroll in multiple subjects
                      simultaneously
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 max-w-md p-4 rounded-xl shadow-xl border transform transition-all duration-300 ${
            notification.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                notification.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {notification.type === "success" ? (
                <FaCheckCircle className="text-xl" />
              ) : (
                <div className="text-xl">⚠️</div>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  notification.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollCourses;
