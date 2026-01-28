import { BookOpen, Calendar, Clock } from "lucide-react";

const StudyTimetable = ({ subjects }) => {
  if (!subjects || subjects.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Study Plan Recommendation
        </h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900 font-medium">
          📚 Exams are approaching! Here's your recommended study schedule:
        </p>
      </div>

      <div className="space-y-4">
        {subjects.map((subject, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg mb-2">
                    {subject.subjectName}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {subject.assessmentTimeline?.midExamWeek && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Mid Exam: Week{" "}
                          {subject.assessmentTimeline.midExamWeek}
                        </span>
                      </div>
                    )}
                    {subject.assessmentTimeline?.finalExamWeek && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Final Exam: Week{" "}
                          {subject.assessmentTimeline.finalExamWeek}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  2h/day
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">
          💡 <span className="font-semibold">Tip:</span> Start with the subjects
          that have exams earliest. Focus on understanding concepts rather than
          memorizing.
        </p>
      </div>
    </div>
  );
};

export default StudyTimetable;
