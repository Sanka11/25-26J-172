
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { createQuiz } from "../services/api/quizApi";
import {
  Plus,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Edit3,
  BookOpen,
  ChevronDown,
  Calculator,
  Hash,
  Pi,
  Infinity as InfinityIcon,
  X,
} from "lucide-react";

// Math lesson topics for dropdown
const MATH_LESSONS = [
  "Algebra Basics",
  "Linear Equations",
  "Quadratic Equations",
  "Polynomials",
  "Functions",
  "Trigonometry",
  "Geometry",
  "Fractions",
  "Decimals",
  "Percentages",
  "Ratios & Proportions",
  "Exponents & Roots",
  "Statistics",
  "Probability",
  "Calculus Basics",
  "Matrices",
  "Vectors",
  "Number Theory",
  "Coordinate Geometry",
  "Sets & Logic",
];

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "hard", label: "Hard", color: "bg-red-100 text-red-800" },
  { value: "expert", label: "Expert", color: "bg-purple-100 text-purple-800" },
];

// Time estimates
const TIME_ESTIMATES = [
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 120, label: "2 minutes" },
  { value: 180, label: "3 minutes" },
  { value: 300, label: "5 minutes" },
];

export default function CreateQuiz() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [q, setQ] = useState({
    question: "",
    lesson: "",
    options: ["", "", "", ""],
    correct_index: 0,
    hint: "",
    difficulty: "medium",
    time_estimate: 60,
    explanation: "",
  });

  const [showLessonDropdown, setShowLessonDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

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
      alert("Please fill in all required fields before adding a question");
      return;
    }

    setQuestions([...questions, { ...q }]);
    setQ({
      question: "",
      lesson: "",
      options: ["", "", "", ""],
      correct_index: 0,
      hint: "",
      difficulty: "medium",
      time_estimate: 60,
      explanation: "",
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

    const hasInvalidQuestions = questions.some(
      (q) => !q.question.trim() || q.options.some((opt) => !opt.trim())
    );

    if (hasInvalidQuestions) {
      alert("Please fill in all question and option fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuiz({
        ...data,
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
          difficulty: "medium",
          time_estimate: 60,
          explanation: "",
        });
        setSuccessMessage("");
      }, 2000);
    } catch (error) {
      alert("Error creating quiz. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const opts = [...q.options];
    opts[index] = value;
    setQ({ ...q, options: opts });
  };

  const selectLesson = (lesson) => {
    setQ({ ...q, lesson });
    setShowLessonDropdown(false);
  };

  const selectDifficulty = (difficulty) => {
    setQ({ ...q, difficulty });
    setShowDifficultyDropdown(false);
  };

  const selectTimeEstimate = (time) => {
    setQ({ ...q, time_estimate: time });
    setShowTimeDropdown(false);
  };

  const getDifficultyColor = (diff) => {
    const diffObj = DIFFICULTY_LEVELS.find((d) => d.value === diff);
    return diffObj ? diffObj.color : "bg-gray-100 text-gray-800";
  };

  const getDifficultyLabel = (diff) => {
    const diffObj = DIFFICULTY_LEVELS.find((d) => d.value === diff);
    return diffObj ? diffObj.label : "Medium";
  };

  const getTimeLabel = (time) => {
    const timeObj = TIME_ESTIMATES.find((t) => t.value === time);
    return timeObj ? timeObj.label : "1 minute";
  };

  const addOption = () => {
    if (q.options.length < 6) {
      setQ({ ...q, options: [...q.options, ""] });
    }
  };

  const removeOption = (index) => {
    if (q.options.length > 2) {
      const newOptions = q.options.filter((_, i) => i !== index);
      // Adjust correct_index if needed
      let newCorrectIndex = q.correct_index;
      if (index === q.correct_index) {
        newCorrectIndex = 0;
      } else if (index < q.correct_index) {
        newCorrectIndex = q.correct_index - 1;
      }
      setQ({ ...q, options: newOptions, correct_index: newCorrectIndex });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4 border border-blue-200">
            <Calculator className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-800">
              Quiz Builder
            </span>
          </div>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Design engaging math questions with detailed explanations and
            difficulty levels
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
          {/* Left Column - Question Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quiz Level Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Quiz Level
                  </h3>
                  <p className="text-sm text-gray-600">
                    Set the difficulty level for this quiz
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Level Number
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="1 to 10"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition text-lg font-semibold"
                    />
                    <Pi className="w-5 h-5 text-blue-400 absolute right-4 top-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Questions Added
                  </label>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <span className="text-4xl font-bold text-blue-600 block">
                      {questions.length}
                    </span>
                    <span className="text-sm text-blue-500">
                      Questions ready
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Form Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Add New Question
                  </h3>
                  <p className="text-sm text-gray-600">
                    Fill in all required fields
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Question Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    Question
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Enter the math question text..."
                    value={q.question}
                    onChange={(e) => setQ({ ...q, question: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none"
                    rows="3"
                  />
                </div>

                {/* Lesson and Difficulty Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lesson Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Lesson / Topic
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowLessonDropdown(!showLessonDropdown)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition text-left"
                      >
                        <span
                          className={
                            q.lesson ? "text-gray-800" : "text-gray-500"
                          }
                        >
                          {q.lesson || "Select a math topic"}
                        </span>
                        <ChevronDown className="w-5 h-5 text-blue-400" />
                      </button>

                      {showLessonDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <input
                              type="text"
                              placeholder="Search topics..."
                              className="w-full px-3 py-2 mb-2 border border-blue-200 rounded"
                              onChange={(e) => {
                                // Add search functionality if needed
                              }}
                            />
                          </div>
                          {MATH_LESSONS.map((lesson) => (
                            <button
                              key={lesson}
                              type="button"
                              onClick={() => selectLesson(lesson)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-blue-50 last:border-b-0 transition"
                            >
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-500" />
                                <span>{lesson}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Difficulty Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowDifficultyDropdown(!showDifficultyDropdown)
                        }
                        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition text-left ${getDifficultyColor(
                          q.difficulty
                        )} border-transparent`}
                      >
                        <span>{getDifficultyLabel(q.difficulty)}</span>
                        <ChevronDown className="w-5 h-5" />
                      </button>

                      {showDifficultyDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg">
                          {DIFFICULTY_LEVELS.map((diff) => (
                            <button
                              key={diff.value}
                              type="button"
                              onClick={() => selectDifficulty(diff.value)}
                              className={`w-full px-4 py-3 text-left hover:opacity-90 transition ${diff.color}`}
                            >
                              {diff.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Estimate and Correct Answer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time Estimate Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Time Estimate
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                        className="w-full flex items-center justify-between px-4 py-3 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition text-left"
                      >
                        <span>{getTimeLabel(q.time_estimate)}</span>
                        <ChevronDown className="w-5 h-5 text-blue-400" />
                      </button>

                      {showTimeDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg">
                          {TIME_ESTIMATES.map((time) => (
                            <button
                              key={time.value}
                              type="button"
                              onClick={() => selectTimeEstimate(time.value)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition border-b border-blue-50 last:border-b-0"
                            >
                              {time.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Correct Answer Indicator */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Correct Answer
                    </label>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">
                        Selected:{" "}
                        <span className="font-bold">
                          Option {q.correct_index + 1}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Answer Options */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-gray-700">
                      Answer Options
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      disabled={q.options.length >= 6}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 disabled:text-gray-400"
                    >
                      <Plus className="w-4 h-4" />
                      Add Option ({q.options.length}/6)
                    </button>
                  </div>
                  <div className="space-y-3">
                    {q.options.map((option, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <label
                          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition ${
                            q.correct_index === i
                              ? "bg-green-500 text-white ring-4 ring-green-200"
                              : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="correct"
                            checked={q.correct_index === i}
                            onChange={() => setQ({ ...q, correct_index: i })}
                            className="hidden"
                          />
                          <CheckCircle className="w-5 h-5" />
                        </label>
                        <input
                          type="text"
                          placeholder={`Option ${i + 1} ${
                            q.correct_index === i ? "(Correct)" : ""
                          }`}
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(i, e.target.value)
                          }
                          className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(i)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hint and Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Hint (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Add a helpful hint for students..."
                      value={q.hint}
                      onChange={(e) => setQ({ ...q, hint: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Solution Explanation
                    </label>
                    <textarea
                      placeholder="Explain the solution (optional)..."
                      value={q.explanation}
                      onChange={(e) =>
                        setQ({ ...q, explanation: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none"
                      rows="2"
                    />
                  </div>
                </div>

                {/* Add Question Button */}
                <button
                  onClick={addQuestion}
                  disabled={!isQuestionValid()}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold transition-all duration-200 ${
                    isQuestionValid()
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-95"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-6 h-6" />
                  Add Question to Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview & Save */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Questions Preview */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Quiz Preview
                  </h3>
                  <span className="ml-auto bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                    {questions.length} Qs
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {questions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        No questions added yet
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Add questions to see preview
                      </p>
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <div
                        key={index}
                        className="group p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400 transition cursor-pointer hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600">
                              Q{index + 1}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                                question.difficulty
                              )}`}
                            >
                              {getDifficultyLabel(question.difficulty)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition p-1 hover:bg-red-50 rounded"
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                          {question.question}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                            {question.lesson}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getTimeLabel(question.time_estimate)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Save Quiz Card */}
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Ready to Save?</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Level</span>
                    <span className="font-bold text-lg">
                      {level || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Questions</span>
                    <span className="font-bold text-2xl">
                      {questions.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Total Time</span>
                    <span className="font-bold">
                      {questions.reduce(
                        (total, q) => total + q.time_estimate,
                        0
                      )}
                      s
                    </span>
                  </div>
                </div>

                <button
                  onClick={saveQuiz}
                  disabled={loading || questions.length === 0 || !level.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-bold transition-all duration-200 ${
                    loading || questions.length === 0 || !level.trim()
                      ? "bg-blue-400 text-blue-200 cursor-not-allowed"
                      : "bg-white text-blue-600 hover:shadow-2xl hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Creating Quiz...
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      Save Math Quiz
                    </>
                  )}
                </button>

                {questions.length === 0 && (
                  <p className="text-center text-blue-200 text-sm mt-3">
                    Add at least one question to save
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}