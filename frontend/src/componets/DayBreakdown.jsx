import { format } from "date-fns";
import { X, Clock, BookOpen, Briefcase } from "lucide-react";

const DayBreakdown = ({ day, onClose }) => {
  if (!day) return null;

  const dayDate = new Date(day.date);

  const getStatusBadge = (status) => {
    const styles = {
      LIGHT: "bg-emerald-100 text-emerald-800 border-emerald-200",
      MODERATE: "bg-blue-100 text-blue-800 border-blue-200",
      HEAVY: "bg-amber-100 text-amber-800 border-amber-200",
      OVERLOADED: "bg-red-100 text-red-800 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {format(dayDate, "EEEE, MMMM d")}
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(day.loadStatus)}`}
              >
                {day.loadStatus}
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{day.totalHours} hours</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {day.studyHours > 0 && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900 text-lg">
                  Study Time
                </h4>
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {day.studyHours} hours
              </div>
              {day.subjectName && (
                <div className="text-sm text-blue-700">
                  Subject:{" "}
                  <span className="font-semibold">{day.subjectName}</span>
                </div>
              )}
            </div>
          )}

          {day.internshipHours > 0 && (
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900 text-lg">
                  Internship
                </h4>
              </div>
              <div className="text-3xl font-bold text-purple-900">
                {day.internshipHours} hours
              </div>
            </div>
          )}

          {day.description && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
              <p className="text-gray-700 leading-relaxed">{day.description}</p>
            </div>
          )}

          {day.tasks && day.tasks.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Tasks</h4>
              <ul className="space-y-2">
                {day.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayBreakdown;
