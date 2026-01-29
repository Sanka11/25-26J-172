// import React, { useState } from "react";
// import { createSubject } from "../services/api/subjectService";

// const AddSubject = () => {
//   const [form, setForm] = useState({
//     subjectId: "",
//     subjectName: "",
//     semester: "",
//     enrollPassword: "",
//     lectureDays: [],
//     lectureHoursPerDay: "",
//     assignmentWeek: "",
//     midExamWeek: "",
//     finalExamWeek: "",
//   });

//   // lessons state
//   const [lessons, setLessons] = useState([{ lessonNo: 1, title: "" }]);

//   // assessment lesson coverage
//   const [coverage, setCoverage] = useState({
//     assignmentFrom: "",
//     assignmentTo: "",
//     midFrom: "",
//     midTo: "",
//     finalFrom: "",
//     finalTo: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const toggleLectureDay = (day) => {
//     setForm((prev) => ({
//       ...prev,
//       lectureDays: prev.lectureDays.includes(day)
//         ? prev.lectureDays.filter((d) => d !== day)
//         : [...prev.lectureDays, day],
//     }));
//   };

//   // -------- LESSON HANDLERS --------
//   const addLesson = () => {
//     setLessons([...lessons, { lessonNo: lessons.length + 1, title: "" }]);
//   };

//   const updateLesson = (index, value) => {
//     const updated = [...lessons];
//     updated[index].title = value;
//     setLessons(updated);
//   };

//   const handleCoverageChange = (e) => {
//     setCoverage({ ...coverage, [e.target.name]: e.target.value });
//   };

//   // -------- SUBMIT --------
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await createSubject({
//         subjectId: form.subjectId,
//         subjectName: form.subjectName,
//         semester: Number(form.semester),
//         enrollPassword: form.enrollPassword,
//         lectureDays: form.lectureDays,
//         lectureHoursPerDay: Number(form.lectureHoursPerDay),

//         lessons,

//         assessmentTimeline: {
//           assignmentWeek: Number(form.assignmentWeek),
//           midExamWeek: Number(form.midExamWeek),
//           finalExamWeek: Number(form.finalExamWeek),
//         },

//         assessmentCoverage: {
//           assignment: {
//             from: Number(coverage.assignmentFrom),
//             to: Number(coverage.assignmentTo),
//           },
//           midExam: {
//             from: Number(coverage.midFrom),
//             to: Number(coverage.midTo),
//           },
//           finalExam: {
//             from: Number(coverage.finalFrom),
//             to: Number(coverage.finalTo),
//           },
//         },
//       });

//       alert("Subject created successfully ✅");
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   return (
//     <div style={{ padding: "20px", maxWidth: "650px" }}>
//       <h2>📘 Add Subject</h2>

//       <form onSubmit={handleSubmit}>
//         <input
//           name="subjectId"
//           placeholder="Subject Code"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="subjectName"
//           placeholder="Subject Name"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="semester"
//           type="number"
//           placeholder="Semester"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="enrollPassword"
//           placeholder="Enrollment Password"
//           onChange={handleChange}
//           required
//         />

//         <h4>Lecture Days</h4>
//         {["Saturday", "Sunday"].map((day) => (
//           <label key={day} style={{ marginRight: "10px" }}>
//             <input
//               type="checkbox"
//               checked={form.lectureDays.includes(day)}
//               onChange={() => toggleLectureDay(day)}
//             />
//             {day}
//           </label>
//         ))}

//         <input
//           name="lectureHoursPerDay"
//           type="number"
//           placeholder="Lecture Hours Per Day"
//           onChange={handleChange}
//           required
//         />

//         <h4>📚 Lessons / Syllabus</h4>
//         {lessons.map((l, i) => (
//           <input
//             key={i}
//             placeholder={`Lesson ${l.lessonNo} title`}
//             value={l.title}
//             onChange={(e) => updateLesson(i, e.target.value)}
//             required
//           />
//         ))}

//         <button type="button" onClick={addLesson}>
//           ➕ Add Lesson
//         </button>

//         <h4>Assessment Timeline (Weeks)</h4>
//         <input
//           name="assignmentWeek"
//           type="number"
//           placeholder="Assignment Week"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="midExamWeek"
//           type="number"
//           placeholder="Mid Exam Week"
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="finalExamWeek"
//           type="number"
//           placeholder="Final Exam Week"
//           onChange={handleChange}
//           required
//         />

//         <h4>📌 Lesson Coverage for Assessments</h4>

//         <p>Assignment covers lessons</p>
//         <input
//           name="assignmentFrom"
//           type="number"
//           placeholder="From"
//           onChange={handleCoverageChange}
//           required
//         />
//         <input
//           name="assignmentTo"
//           type="number"
//           placeholder="To"
//           onChange={handleCoverageChange}
//           required
//         />

//         <p>Mid Exam covers lessons</p>
//         <input
//           name="midFrom"
//           type="number"
//           placeholder="From"
//           onChange={handleCoverageChange}
//           required
//         />
//         <input
//           name="midTo"
//           type="number"
//           placeholder="To"
//           onChange={handleCoverageChange}
//           required
//         />

//         <p>Final Exam covers lessons</p>
//         <input
//           name="finalFrom"
//           type="number"
//           placeholder="From"
//           onChange={handleCoverageChange}
//           required
//         />
//         <input
//           name="finalTo"
//           type="number"
//           placeholder="To"
//           onChange={handleCoverageChange}
//           required
//         />

//         <button type="submit" style={{ marginTop: "15px" }}>
//           Create Subject
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddSubject;
// Install: npm install react-icons
import React, { useState } from "react";
import { createSubject } from "../services/api/subjectService";
import {
  FaBook,
  FaCalendarAlt,
  FaClipboardList,
  FaClock,
  FaPlus,
  FaTrash,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";

const AddSubject = () => {
  // State declarations
  const [form, setForm] = useState({
    subjectId: "",
    subjectName: "",
    semester: "",
    enrollPassword: "",
    lectureDays: [],
    lectureHoursPerDay: "",
    assignmentWeek: "",
    midExamWeek: "",
    finalExamWeek: "",
  });

  const [lessons, setLessons] = useState([{ lessonNo: 1, title: "" }]);
  const [coverage, setCoverage] = useState({
    assignmentFrom: "",
    assignmentTo: "",
    midFrom: "",
    midTo: "",
    finalFrom: "",
    finalTo: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // -------- HANDLER FUNCTIONS (MUST BE BEFORE RETURN) --------

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleLectureDay = (day) => {
    setForm((prev) => ({
      ...prev,
      lectureDays: prev.lectureDays.includes(day)
        ? prev.lectureDays.filter((d) => d !== day)
        : [...prev.lectureDays, day],
    }));
  };

  const addLesson = () => {
    setLessons([...lessons, { lessonNo: lessons.length + 1, title: "" }]);
  };

  const updateLesson = (index, value) => {
    const updated = [...lessons];
    updated[index].title = value;
    setLessons(updated);
  };

  const removeLesson = (index) => {
    if (lessons.length > 1) {
      const updated = lessons.filter((_, i) => i !== index);
      // Re-number lessons
      const renumbered = updated.map((lesson, idx) => ({
        ...lesson,
        lessonNo: idx + 1,
      }));
      setLessons(renumbered);
    }
  };

  const handleCoverageChange = (e) => {
    setCoverage({ ...coverage, [e.target.name]: e.target.value });
  };

  // -------- SUBMIT HANDLER (MUST BE BEFORE RETURN) --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createSubject({
        subjectId: form.subjectId,
        subjectName: form.subjectName,
        semester: Number(form.semester),
        enrollPassword: form.enrollPassword,
        lectureDays: form.lectureDays,
        lectureHoursPerDay: Number(form.lectureHoursPerDay),
        lessons,
        assessmentTimeline: {
          assignmentWeek: Number(form.assignmentWeek),
          midExamWeek: Number(form.midExamWeek),
          finalExamWeek: Number(form.finalExamWeek),
        },
        assessmentCoverage: {
          assignment: {
            from: Number(coverage.assignmentFrom),
            to: Number(coverage.assignmentTo),
          },
          midExam: {
            from: Number(coverage.midFrom),
            to: Number(coverage.midTo),
          },
          finalExam: {
            from: Number(coverage.finalFrom),
            to: Number(coverage.finalTo),
          },
        },
      });

      setNotification({
        show: true,
        message: "Subject created successfully ✅",
        type: "success",
      });

      // Reset form
      setForm({
        subjectId: "",
        subjectName: "",
        semester: "",
        enrollPassword: "",
        lectureDays: [],
        lectureHoursPerDay: "",
        assignmentWeek: "",
        midExamWeek: "",
        finalExamWeek: "",
      });
      setLessons([{ lessonNo: 1, title: "" }]);
      setCoverage({
        assignmentFrom: "",
        assignmentTo: "",
        midFrom: "",
        midTo: "",
        finalFrom: "",
        finalTo: "",
      });
    } catch (err) {
      setNotification({
        show: true,
        message: err.message || "Failed to create subject",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------- JSX RETURN STATEMENT (LAST IN COMPONENT) --------
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 rounded-xl">
            <FaBook className="text-2xl text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Add New Subject
            </h1>
            <p className="text-gray-600 mt-1">
              Fill in all required details to create a new subject
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Subject Information */}
          <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaBook className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Subject Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code *
                </label>
                <input
                  type="text"
                  name="subjectId"
                  value={form.subjectId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., CS101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="subjectName"
                  value={form.subjectName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., Introduction to Programming"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <input
                  type="number"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  required
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Password *
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="enrollPassword"
                    value={form.enrollPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter enrollment password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaClock className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Schedule Details
              </h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lecture Days *
              </label>
              <div className="flex flex-wrap gap-4">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <label
                    key={day}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.lectureDays.includes(day)}
                      onChange={() => toggleLectureDay(day)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
              {form.lectureDays.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {form.lectureDays.map((day) => (
                    <span
                      key={day}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lecture Hours Per Day *
              </label>
              <input
                type="number"
                name="lectureHoursPerDay"
                value={form.lectureHoursPerDay}
                onChange={handleChange}
                required
                min="1"
                max="8"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Lessons Section */}
          <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FaBook className="text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Lessons / Syllabus
                </h2>
              </div>
              <button
                type="button"
                onClick={addLesson}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FaPlus /> Add Lesson
              </button>
            </div>

            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium min-w-[100px] text-center">
                    Lesson {lesson.lessonNo}
                  </span>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => updateLesson(index, e.target.value)}
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder={`Enter title for lesson ${lesson.lessonNo}`}
                  />
                  {lessons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLesson(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Timeline */}
          <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <FaCalendarAlt className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Assessment Timeline (Weeks)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Assignment Week",
                  name: "assignmentWeek",
                  value: form.assignmentWeek,
                },
                {
                  label: "Mid Exam Week",
                  name: "midExamWeek",
                  value: form.midExamWeek,
                },
                {
                  label: "Final Exam Week",
                  name: "finalExamWeek",
                  value: form.finalExamWeek,
                },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} *
                  </label>
                  <input
                    type="number"
                    name={field.name}
                    value={field.value}
                    onChange={handleChange}
                    required
                    min="1"
                    max="20"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Coverage */}
          <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <FaClipboardList className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Lesson Coverage for Assessments
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Assignment Coverage",
                  from: "assignmentFrom",
                  to: "assignmentTo",
                },
                { title: "Mid Exam Coverage", from: "midFrom", to: "midTo" },
                {
                  title: "Final Exam Coverage",
                  from: "finalFrom",
                  to: "finalTo",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-800 mb-4">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-2">
                        From (Lesson)
                      </label>
                      <input
                        type="number"
                        name={item.from}
                        value={coverage[item.from]}
                        onChange={handleCoverageChange}
                        required
                        min="1"
                        max={lessons.length}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                    <span className="text-gray-500">to</span>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-2">
                        To (Lesson)
                      </label>
                      <input
                        type="number"
                        name={item.to}
                        value={coverage[item.to]}
                        onChange={handleCoverageChange}
                        required
                        min="1"
                        max={lessons.length}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaCheckCircle /> Create Subject
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-xl ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <FaCheckCircle
              className={
                notification.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }
            />
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubject;