
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { createQuiz } from "../services/api/quizApi";
import QuestionCard from "../componets/QuestionCard";

export default function CreateQuiz() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: "",
      skill_name: "",
    },
  });

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: "",
      options: ["", "", "", ""],
      correct: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const removeQuestion = (questionId) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const onSubmit = async (data) => {
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

      alert("Quiz saved successfully!");
      reset();
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with 3D effect */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Your Quiz
          </h1>
          <p className="text-gray-600">
            Design engaging quizzes with interactive questions
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8 transform transition-all duration-300 hover:shadow-3xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Quiz Title */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quiz Title *
              </label>
              <Controller
                name="title"
                control={control}
                rules={{ required: "Quiz title is required" }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-4 rounded-xl border-2 ${
                      errors.title ? "border-red-300" : "border-gray-200"
                    } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm`}
                    placeholder="Enter an engaging quiz title"
                  />
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Skill Name */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Skill Name *
              </label>
              <Controller
                name="skill_name"
                control={control}
                rules={{ required: "Skill name is required" }}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-4 rounded-xl border-2 ${
                      errors.skill_name ? "border-red-300" : "border-gray-200"
                    } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm`}
                    placeholder="e.g., JavaScript Fundamentals, React Patterns"
                  />
                )}
              />
              {errors.skill_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.skill_name.message}
                </p>
              )}
            </div>

            {/* Questions Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Questions ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500">
                    No questions added yet. Click "Add Question" to start
                    building your quiz!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, index) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={index}
                      updateQuestion={updateQuestion}
                      updateOption={updateOption}
                      removeQuestion={removeQuestion}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || questions.length === 0}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  isSubmitting || questions.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:scale-105 active:scale-95"
                } text-white shadow-lg`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving Quiz...
                  </span>
                ) : (
                  "Save Quiz"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  reset();
                  setQuestions([]);
                }}
                className="py-4 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Clear All
              </button>
            </div>
          </form>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  questions.length > 0 ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className="text-gray-600">
                {questions.length} questions added
              </span>
            </div>
            <div className="text-gray-500">
              All fields marked with * are required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}