import { format, isSameDay } from "date-fns";
import { Calendar, AlertCircle, CheckCircle, Activity } from "lucide-react";

const WorkloadCalendar = ({ workload, onDayClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "LIGHT":
        return "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200";
      case "MODERATE":
        return "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200";
      case "HEAVY":
        return "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200";
      case "OVERLOADED":
        return "bg-red-100 border-red-300 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "LIGHT":
        return <CheckCircle className="w-5 h-5" />;
      case "MODERATE":
        return <Activity className="w-5 h-5" />;
      case "HEAVY":
        return <AlertCircle className="w-5 h-5" />;
      case "OVERLOADED":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  if (!workload || workload.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No workload data for this week</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Weekly Calendar</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {workload.map((day, index) => {
          const dayDate = new Date(day.date);
          const isToday = isSameDay(dayDate, new Date());

          return (
            <button
              key={index}
              onClick={() => onDayClick(day)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${getStatusColor(day.loadStatus)}
                ${isToday ? "ring-2 ring-offset-2 ring-blue-500" : ""}
                transform hover:scale-105 hover:shadow-md
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs font-medium uppercase tracking-wide opacity-75">
                  {format(dayDate, "EEE")}
                </div>
                <div className="text-2xl font-bold">{format(dayDate, "d")}</div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(day.loadStatus)}
                </div>
                <div className="text-xs font-semibold">
                  {getStatusLabel(day.loadStatus)}
                </div>
                <div className="text-sm font-medium mt-1">
                  {day.totalHours}h
                </div>
              </div>

              {isToday && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  ●
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-300"></div>
            <span className="text-gray-600">Light</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300"></div>
            <span className="text-gray-600">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-300"></div>
            <span className="text-gray-600">Heavy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
            <span className="text-gray-600">Overloaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadCalendar;
