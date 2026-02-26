import {
  format,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isWithinInterval,
} from "date-fns";
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

const WorkloadCalendar = ({
  workload = [],
  onDayClick,
  currentWeekStart,
  onWeekChange,
  showWeekNavigation = true,
  semesterStartDate = "2026-01-26",
}) => {
  const [weekDaysData, setWeekDaysData] = useState([]);

  // Get status color based on API status
  const getStatusColor = (status) => {
    switch (status) {
      case "BUSY":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "LIGHT":
        return "bg-emerald-50 border-emerald-200 text-emerald-800";
      case "MODERATE":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "HEAVY":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "OVERLOADED":
        return "bg-red-50 border-red-200 text-red-800";
      default: // NORMAL
        return "bg-green-50 border-green-200 text-green-800";
    }
  };

  // Get status icon based on API status
  const getStatusIcon = (status) => {
    switch (status) {
      case "BUSY":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "LIGHT":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "MODERATE":
        return <Activity className="w-4 h-4 text-blue-600" />;
      case "HEAVY":
      case "OVERLOADED":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: // NORMAL
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getStatusLabel = (status = "NORMAL") => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Handle week navigation
  const handlePreviousWeek = () => {
    if (currentWeekStart && onWeekChange) {
      const prevWeek = subWeeks(new Date(currentWeekStart), 1);
      onWeekChange(prevWeek);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekStart && onWeekChange) {
      const nextWeek = addWeeks(new Date(currentWeekStart), 1);
      onWeekChange(nextWeek);
    }
  };

  // Generate week dates for display
  const getWeekDays = (weekStartDate) => {
    if (!weekStartDate) return [];

    const start = startOfWeek(new Date(weekStartDate), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(new Date(weekStartDate), { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
  };

  // Find workload for a specific date (check if date falls within a workload week)
  const findWorkloadForDate = (date) => {
    return workload.find((weekData) => {
      if (!weekData.weekStart?._seconds) return false;

      const weekStart = new Date(weekData.weekStart._seconds * 1000);
      const weekEnd = addDays(weekStart, 6); // Week spans 7 days

      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });
  };

  // Calculate academic week number
  const calculateAcademicWeek = (date) => {
    if (!semesterStartDate || !date) return 1;

    const start = new Date(semesterStartDate);
    const target = new Date(date);
    start.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(1, Math.floor(diffDays / 7) + 1);
  };

  // Calculate current week number from workload data
  const getCurrentWeekFromWorkload = () => {
    if (!currentWeekStart || workload.length === 0) return null;

    const weekStart = new Date(currentWeekStart);
    const weekEnd = addDays(weekStart, 6);

    // Find if current displayed week has any workload data
    for (const weekData of workload) {
      if (!weekData.weekStart?._seconds) continue;

      const dataWeekStart = new Date(weekData.weekStart._seconds * 1000);
      const dataWeekEnd = addDays(dataWeekStart, 6);

      if (
        (weekStart >= dataWeekStart && weekStart <= dataWeekEnd) ||
        (weekEnd >= dataWeekStart && weekEnd <= dataWeekEnd)
      ) {
        return weekData;
      }
    }

    return null;
  };

  // Find the actual week number from workload data for the current week
  const getWorkloadWeekNumber = () => {
    const currentWorkload = getCurrentWeekFromWorkload();
    return currentWorkload
      ? currentWorkload.week
      : calculateAcademicWeek(currentWeekStart);
  };

  // Prepare week days data
  useEffect(() => {
    if (currentWeekStart) {
      const days = getWeekDays(currentWeekStart);
      const daysWithData = days.map((date) => {
        const weekData = findWorkloadForDate(date);
        return {
          date,
          weekData,
          isToday: isSameDay(date, new Date()),
        };
      });
      setWeekDaysData(daysWithData);
    }
  }, [currentWeekStart, workload]);

  if (!currentWeekStart) {
    return (
      <div className="bg-white p-8 text-center rounded-xl border">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Select a week to view workload</p>
      </div>
    );
  }

  const currentWorkload = getCurrentWeekFromWorkload();
  const weekNumber = getWorkloadWeekNumber();

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Weekly Workload Calendar</h3>
          <p className="text-sm text-gray-600">
            Week {weekNumber} • {format(new Date(currentWeekStart), "MMM d")} -{" "}
            {format(addDays(new Date(currentWeekStart), 6), "MMM d, yyyy")}
          </p>
          {currentWorkload && (
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(currentWorkload.status)}`}
              >
                {getStatusLabel(currentWorkload.status)} Week
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                {currentWorkload.totalHours || 0} total hours
              </div>
            </div>
          )}
        </div>

        {showWeekNavigation && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg border hover:bg-gray-50 transition"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => onWeekChange && onWeekChange(new Date())}
              className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
            >
              This Week
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg border hover:bg-gray-50 transition"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDaysData.map((day, index) => (
          <button
            key={index}
            onClick={() => day.weekData && onDayClick?.(day.weekData)}
            className={`p-4 rounded-lg border-2 transition-all
              ${day.weekData ? getStatusColor(day.weekData.status) : "bg-gray-50 border-gray-200 text-gray-500"}
              ${day.isToday ? "ring-2 ring-blue-500" : ""}
              ${day.weekData ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"}
            `}
          >
            <div className="text-center space-y-2">
              <div className="text-xs uppercase font-medium">
                {format(day.date, "EEE")}
              </div>
              <div
                className={`text-xl font-bold ${day.isToday ? "text-blue-600" : ""}`}
              >
                {format(day.date, "d")}
              </div>

              {day.weekData ? (
                <>
                  <div className="flex justify-center">
                    {getStatusIcon(day.weekData.status)}
                  </div>
                  <div className="text-xs font-semibold">
                    {getStatusLabel(day.weekData.status)}
                  </div>
                  <div className="text-sm font-medium">
                    {day.weekData.totalHours || 0}h
                  </div>
                  {day.weekData.breakdown &&
                    day.weekData.breakdown.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {day.weekData.breakdown.length} item
                        {day.weekData.breakdown.length !== 1 ? "s" : ""}
                      </div>
                    )}
                </>
              ) : (
                <div className="text-xs text-gray-400 mt-4">
                  No scheduled work
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Workload Status Legend</h4>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Busy</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                <Activity className="w-3 h-3 text-blue-600" />
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs">
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span>Heavy/Overloaded</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Displayed Week:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {weekNumber}
            </span>
            {currentWorkload && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentWorkload.status)}`}
              >
                {getStatusLabel(currentWorkload.status)}
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>• Click on a day to view detailed breakdown of workload items</p>
          <p>
            • Week colors indicate the overall workload status for that week
          </p>
          <p>• Hover over days and click to see subject-wise breakdown</p>
        </div>
      </div>
    </div>
  );
};

export default WorkloadCalendar;
