export default function QuestionCard({
  question,
  index,
  updateQuestion,
  updateOption,
  removeQuestion,
}) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
            {index + 1}
          </div>
          <h4 className="text-lg font-bold text-gray-800">
            Question {index + 1}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => removeQuestion(question.id)}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Question Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Question Text *
        </label>
        <input
          value={question.question}
          onChange={(e) =>
            updateQuestion(question.id, "question", e.target.value)
          }
          className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm"
          placeholder="Enter your question here..."
        />
      </div>

      {/* Options */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Options (Select the correct one)
        </label>
        {question.options.map((option, oIndex) => (
          <div
            key={oIndex}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700">
              {optionLabels[oIndex]}
            </div>
            <input
              value={option}
              onChange={(e) =>
                updateOption(question.id, oIndex, e.target.value)
              }
              className="flex-1 p-3 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-lg"
              placeholder={`Option ${oIndex + 1}`}
            />
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correct === oIndex}
                onChange={() => updateQuestion(question.id, "correct", oIndex)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-600">Correct</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
