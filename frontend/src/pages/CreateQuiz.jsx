
// import { useState } from "react";
// import { createQuiz } from "../services/api/quizApi";

// export default function CreateQuiz() {
//   const [level, setLevel] = useState("");
//   const [questions, setQuestions] = useState([]);

//   const [q, setQ] = useState({
//     question: "",
//     lesson: "",
//     options: ["", "", "", ""],
//     correct_index: 0,
//     hint: "",
//   });

//   const addQuestion = () => {
//     setQuestions([...questions, q]);
//     setQ({
//       question: "",
//       lesson: "",
//       options: ["", "", "", ""],
//       correct_index: 0,
//       hint: "",
//     });
//   };

//   const saveQuiz = async () => {
//     await createQuiz({
//       level: Number(level),
//       created_by: "lecturer_001",
//       questions,
//     });
//     alert("Quiz Created");
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Create Quiz (Level)</h2>

//       <input
//         placeholder="Level Number"
//         value={level}
//         onChange={(e) => setLevel(e.target.value)}
//       />

//       <h3>Add Question</h3>

//       <input
//         placeholder="Question"
//         value={q.question}
//         onChange={(e) => setQ({ ...q, question: e.target.value })}
//       />

//       <input
//         placeholder="Lesson"
//         value={q.lesson}
//         onChange={(e) => setQ({ ...q, lesson: e.target.value })}
//       />

//       {q.options.map((o, i) => (
//         <input
//           key={i}
//           placeholder={`Option ${i + 1}`}
//           value={o}
//           onChange={(e) => {
//             const opts = [...q.options];
//             opts[i] = e.target.value;
//             setQ({ ...q, options: opts });
//           }}
//         />
//       ))}

//       <select
//         value={q.correct_index}
//         onChange={(e) => setQ({ ...q, correct_index: Number(e.target.value) })}
//       >
//         <option value={0}>Option 1</option>
//         <option value={1}>Option 2</option>
//         <option value={2}>Option 3</option>
//         <option value={3}>Option 4</option>
//       </select>

//       <input
//         placeholder="Hint"
//         value={q.hint}
//         onChange={(e) => setQ({ ...q, hint: e.target.value })}
//       />

//       <button onClick={addQuestion}>Add Question</button>
//       <button onClick={saveQuiz}>Save Quiz</button>
//     </div>
//   );
// }

import { useState } from "react";
import { createQuiz } from "../services/api/quizApi";
import {
  Plus,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Edit3,
  BookOpen,
} from "lucide-react";

export default function CreateQuiz() {
  const [level, setLevel] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [q, setQ] = useState({
    question: "",
    lesson: "",
    options: ["", "", "", ""],
    correct_index: 0,
    hint: "",
  });

  const isQuestionValid = () => {
    return (
      q.question.trim() &&
      q.lesson.trim() &&
      q.options.every((o) => o.trim()) &&
      q.correct_index >= 0
    );
  };

  const addQuestion = () => {
    if (!isQuestionValid()) {
      alert("Please fill in all fields before adding a question");
      return;
    }

    setQuestions([...questions, { ...q }]);
    setQ({
      question: "",
      lesson: "",
      options: ["", "", "", ""],
      correct_index: 0,
      hint: "",
    });
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveQuiz = async () => {
    if (!level.trim()) {
      alert("Please enter a level number");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    setLoading(true);
    try {
      await createQuiz({
        level: Number(level),
        created_by: "lecturer_001",
        questions,
      });

      setSuccessMessage("Quiz created successfully!");
      setTimeout(() => {
        setLevel("");
        setQuestions([]);
        setQ({
          question: "",
          lesson: "",
          options: ["", "", "", ""],
          correct_index: 0,
          hint: "",
        });
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      alert("Error creating quiz. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const opts = [...q.options];
    opts[index] = value;
    setQ({ ...q, options: opts });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-lg text-gray-800">
              Quiz Builder
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Create New Quiz
          </h1>
          <p className="text-gray-600">
            Design engaging questions to challenge your students
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg flex items-center gap-3 animate-pulse">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-green-800">
              {successMessage}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Quiz Level
                </label>
                <input
                  type="number"
                  placeholder="Enter level number (1, 2, 3...)"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition text-lg font-semibold"
                />
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-600" />
                  Add Question
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Question
                    </label>
                    <textarea
                      placeholder="Enter the question text"
                      value={q.question}
                      onChange={(e) => setQ({ ...q, question: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition resize-none"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Lesson / Topic
                    </label>
                    <input
                      type="text"
                      placeholder="Related lesson or topic"
                      value={q.lesson}
                      onChange={(e) => setQ({ ...q, lesson: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Answer Options
                    </label>
                    <div className="space-y-3">
                      {q.options.map((option, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <label
                            className={`flex items-center w-10 h-10 rounded-full cursor-pointer transition ${
                              q.correct_index === i
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="correct"
                              checked={q.correct_index === i}
                              onChange={() => setQ({ ...q, correct_index: i })}
                              className="hidden"
                            />
                            <CheckCircle className="w-5 h-5 mx-auto" />
                          </label>
                          <input
                            type="text"
                            placeholder={`Option ${i + 1}`}
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(i, e.target.value)
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Hint (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Add a helpful hint for students"
                      value={q.hint}
                      onChange={(e) => setQ({ ...q, hint: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <button
                    onClick={addQuestion}
                    disabled={!isQuestionValid()}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all duration-200 ${
                      isQuestionValid()
                        ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    Add Question
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                Questions Added
              </h3>

              <div className="mb-6 p-4 bg-purple-50 rounded-lg text-center">
                <span className="text-3xl font-bold text-purple-600">
                  {questions.length}
                </span>
                <p className="text-sm text-gray-600 mt-1">Questions</p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                {questions.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No questions added yet
                  </p>
                ) : (
                  questions.map((question, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-bold text-gray-700">
                          Q{index + 1}
                        </span>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {question.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {question.lesson}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={saveQuiz}
                disabled={loading || questions.length === 0 || !level.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all duration-200 ${
                  loading || questions.length === 0 || !level.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:scale-105"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
