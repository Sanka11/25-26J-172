import {
  format,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
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
  BookOpen,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const WorkloadCalendar = ({
  workload = [],
  onDayClick,
  currentWeekStart,
  onWeekChange,
  showWeekNavigation = true,
  semesterStartDate = "2026-02-10",
}) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Create a map of week numbers to workload data for faster lookup
  const workloadByWeek = useMemo(() => {
    const map = new Map();
    workload.forEach((weekData) => {
      if (weekData.week) {
        map.set(weekData.week, weekData);
      }
    });
    return map;
  }, [workload]);

  // Get status color based on API status with user-friendly colors
  const getStatusColor = (status) => {
    switch (status) {
      case "BUSY":
        return "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
      case "LIGHT":
        return "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
      case "MODERATE":
        return "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100";
      case "HEAVY":
        return "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100";
      case "OVERLOADED":
        return "bg-red-50 border-red-200 text-red-800 hover:bg-red-100";
      default: // NORMAL
        return "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
    }
  };

  // Get status icon based on API status with user-friendly mapping
  const getStatusIcon = (status) => {
    switch (status) {
      case "BUSY":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "LIGHT":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "MODERATE":
        return <Activity className="w-4 h-4 text-indigo-600" />;
      case "HEAVY":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "OVERLOADED":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: // NORMAL
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    }
  };

  // Get user-friendly status label
  const getStatusLabel = (status = "NORMAL") => {
    const statusMap = {
      NORMAL: "Easy",
      LIGHT: "Easy",
      BUSY: "Packed",
      MODERATE: "Steady",
      HEAVY: "Intense",
      OVERLOADED: "Full Plate",
    };
    return (
      statusMap[status] || status.charAt(0) + status.slice(1).toLowerCase()
    );
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

  // Calculate academic week number from a date
  const calculateAcademicWeek = (date) => {
    if (!semesterStartDate || !date) return 1;

    const start = new Date(semesterStartDate);
    const target = new Date(date);
    start.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Add 1 because week 1 starts on the semester start date
    // If diffDays is negative (date before semester start), return 1
    return Math.max(1, Math.floor(diffDays / 7) + 1);
  };

  // Get the week number for the current view
  const weekNumber = useMemo(() => {
    if (!currentWeekStart) return 1;
    return calculateAcademicWeek(currentWeekStart);
  }, [currentWeekStart, semesterStartDate]);

  // Get workload data for the current week
  const currentWorkload = useMemo(() => {
    return workloadByWeek.get(weekNumber);
  }, [workloadByWeek, weekNumber]);

  // Generate week days for display
  const weekDays = useMemo(() => {
    if (!currentWeekStart) return [];

    const start = startOfWeek(new Date(currentWeekStart), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(new Date(currentWeekStart), { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
  }, [currentWeekStart]);

  // Prepare day data with workload information
  const weekDaysData = useMemo(() => {
    return weekDays.map((date) => {
      // All days in this week share the same workload data
      // because workload is organized by week, not by day
      return {
        date,
        weekData: currentWorkload, // Use the week's workload data for all days
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [weekDays, currentWorkload]);

  if (!currentWeekStart) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center rounded-2xl">
        <Calendar className="w-16 h-16 text-blue-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">
          Select a week to view your workload
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Choose from the week selector above
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Weekly Workload Calendar
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium text-blue-600">Week {weekNumber}</span>{" "}
            • {format(new Date(currentWeekStart), "MMM d")} -{" "}
            {format(addDays(new Date(currentWeekStart), 6), "MMM d, yyyy")}
          </p>
          {currentWorkload && (
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getStatusColor(currentWorkload.status).split(" ")[0]
                }`}
              >
                {getStatusLabel(currentWorkload.status)} Week
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                {currentWorkload.totalHours || 0} total hours
              </span>
            </div>
          )}
        </div>

        {showWeekNavigation && (
          <div className="flex items-center gap-2 bg-blue-50 p-1 rounded-xl">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg hover:bg-white transition-all text-gray-600 hover:text-blue-600"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const currentWeekStart = startOfWeek(today, {
                  weekStartsOn: 1,
                });
                onWeekChange && onWeekChange(currentWeekStart);
              }}
              className="px-4 py-2 text-sm bg-white text-blue-700 rounded-lg hover:shadow-sm transition-all font-medium"
            >
              This Week
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-white transition-all text-gray-600 hover:text-blue-600"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {weekDaysData.map((day, index) => {
          const hasWorkload = !!day.weekData;
          const statusInfo = hasWorkload
            ? getStatusColor(day.weekData.status)
            : "bg-gray-50 border-gray-200 text-gray-400";
          const isHovered = hoveredDay === index;

          return (
            <button
              key={index}
              onClick={() => hasWorkload && onDayClick?.(day.weekData)}
              onMouseEnter={() => setHoveredDay(index)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200
                ${statusInfo}
                ${hasWorkload ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}
                ${day.isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                ${isHovered && hasWorkload ? "shadow-lg" : "shadow-sm"}
              `}
              disabled={!hasWorkload}
            >
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider">
                  {format(day.date, "EEE")}
                </div>

                <div
                  className={`text-xl sm:text-2xl font-bold ${
                    day.isToday ? "text-blue-600" : ""
                  }`}
                >
                  {format(day.date, "d")}
                </div>

                {hasWorkload ? (
                  <>
                    <div className="flex justify-center">
                      {getStatusIcon(day.weekData.status)}
                    </div>

                    <div className="text-xs font-semibold">
                      {getStatusLabel(day.weekData.status)}
                    </div>

                    <div className="text-sm font-bold">
                      {day.weekData.totalHours || 0}h
                    </div>

                    {day.weekData.breakdown?.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-sm">
                        {day.weekData.breakdown.length}
                      </div>
                    )}

                    {isHovered && day.weekData.breakdown?.length > 0 && (
                      <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {day.weekData.breakdown.length} item
                          {day.weekData.breakdown.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-400 mt-4">
                    {weekNumber <= 16 ? "No data" : "Beyond semester"}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend with user-friendly labels */}
      <div className="mt-8 pt-6 border-t border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Workload Status
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Easy Week</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700">Packed Week</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-indigo-700">Steady Pace</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-orange-700">Intense Week</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700">Full Plate</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Current Week:</span>
            <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm">
              Week {weekNumber}
            </span>
            {currentWorkload && (
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  getStatusColor(currentWorkload.status).split(" ")[0]
                }`}
              >
                {getStatusLabel(currentWorkload.status)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 space-y-1 bg-blue-50 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Click on any colored day to view detailed breakdown of workload
            items
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Colored days indicate workload status - hover for quick preview
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Numbers in blue circles show total items for that week
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkloadCalendar;
