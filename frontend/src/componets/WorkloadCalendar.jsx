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
  Info,
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

  // Enhanced gradient and shadow colors based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "BUSY":
        return "bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200 text-amber-800 hover:shadow-[0_8px_20px_rgb(251,191,36,0.2)] hover:border-amber-300";
      case "LIGHT":
        return "bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-200 text-emerald-800 hover:shadow-[0_8px_20px_rgb(52,211,153,0.2)] hover:border-emerald-300";
      case "MODERATE":
        return "bg-gradient-to-br from-indigo-50 to-blue-50/50 border-indigo-200 text-indigo-800 hover:shadow-[0_8px_20px_rgb(129,140,248,0.2)] hover:border-indigo-300";
      case "HEAVY":
        return "bg-gradient-to-br from-orange-50 to-red-50/50 border-orange-200 text-orange-800 hover:shadow-[0_8px_20px_rgb(249,115,22,0.2)] hover:border-orange-300";
      case "OVERLOADED":
        return "bg-gradient-to-br from-red-50 to-rose-50/50 border-red-200 text-red-800 hover:shadow-[0_8px_20px_rgb(248,113,113,0.2)] hover:border-red-300";
      default: // NORMAL
        return "bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-200 text-emerald-800 hover:shadow-[0_8px_20px_rgb(52,211,153,0.2)] hover:border-emerald-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "BUSY":
        return (
          <AlertTriangle className="w-5 h-5 text-amber-500 drop-shadow-sm" />
        );
      case "LIGHT":
        return (
          <CheckCircle className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
        );
      case "MODERATE":
        return <Activity className="w-5 h-5 text-indigo-500 drop-shadow-sm" />;
      case "HEAVY":
        return (
          <AlertCircle className="w-5 h-5 text-orange-500 drop-shadow-sm" />
        );
      case "OVERLOADED":
        return <AlertCircle className="w-5 h-5 text-red-500 drop-shadow-sm" />;
      default: // NORMAL
        return (
          <CheckCircle className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
        );
    }
  };

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

  const weekNumber = useMemo(() => {
    if (!currentWeekStart) return 1;
    return calculateAcademicWeek(currentWeekStart);
  }, [currentWeekStart, semesterStartDate]);

  const currentWorkload = useMemo(() => {
    return workloadByWeek.get(weekNumber);
  }, [workloadByWeek, weekNumber]);

  const weekDays = useMemo(() => {
    if (!currentWeekStart) return [];
    const start = startOfWeek(new Date(currentWeekStart), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(currentWeekStart), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeekStart]);

  const weekDaysData = useMemo(() => {
    return weekDays.map((date) => {
      return {
        date,
        weekData: currentWorkload,
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [weekDays, currentWorkload]);

  if (!currentWeekStart) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-16 text-center rounded-2xl border border-white shadow-sm transition-all duration-500">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
          <Calendar className="w-10 h-10 text-indigo-400" />
        </div>
        <p className="text-gray-800 font-bold text-lg">
          Select a week to view your schedule
        </p>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Choose from the timeline above to visualize workload density
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Injecting custom keyframes for smooth entrance */}
      <style>{`
        @keyframes scaleInFade {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-in { animation: scaleInFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-stagger-0 { animation-delay: 50ms; }
        .delay-stagger-1 { animation-delay: 100ms; }
        .delay-stagger-2 { animation-delay: 150ms; }
        .delay-stagger-3 { animation-delay: 200ms; }
        .delay-stagger-4 { animation-delay: 250ms; }
        .delay-stagger-5 { animation-delay: 300ms; }
        .delay-stagger-6 { animation-delay: 350ms; }
      `}</style>

      <div className="p-5 sm:p-8 bg-white/50 backdrop-blur-sm">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              Weekly Workload Calendar
            </h3>
            <p className="text-sm font-semibold text-gray-500 mt-2 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                Week {weekNumber}
              </span>
              <span>•</span>
              <span>
                {format(new Date(currentWeekStart), "MMM d")} -{" "}
                {format(addDays(new Date(currentWeekStart), 6), "MMM d, yyyy")}
              </span>
            </p>

            {currentWorkload && (
              <div className="flex items-center gap-4 mt-4 animate-scale-in delay-stagger-0">
                <span
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm border ${
                    getStatusColor(currentWorkload.status).split(" ")[0]
                  } ${getStatusColor(currentWorkload.status).split(" ")[1]} ${getStatusColor(currentWorkload.status).split(" ")[2]}`}
                >
                  {getStatusLabel(currentWorkload.status)} Week
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {currentWorkload.totalHours || 0} Total Hours
                </span>
              </div>
            )}
          </div>

          {showWeekNavigation && (
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-inner">
              <button
                onClick={handlePreviousWeek}
                className="p-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-indigo-600 active:scale-95"
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
                className="px-5 py-2.5 text-sm bg-white text-indigo-600 border border-gray-100 rounded-lg hover:shadow-md transition-all font-bold active:scale-95"
              >
                Jump to Today
              </button>

              <button
                onClick={handleNextWeek}
                className="p-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-indigo-600 active:scale-95"
                aria-label="Next week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {weekDaysData.map((day, index) => {
            const hasWorkload = !!day.weekData;
            const statusInfo = hasWorkload
              ? getStatusColor(day.weekData.status)
              : "bg-gray-50/50 border-gray-200 text-gray-400";
            const isHovered = hoveredDay === index;

            return (
              <button
                key={index}
                onClick={() => hasWorkload && onDayClick?.(day.weekData)}
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 animate-scale-in delay-stagger-${index}
                  ${statusInfo}
                  ${hasWorkload ? "cursor-pointer hover:-translate-y-1" : "cursor-default opacity-70"}
                  ${day.isToday ? "ring-4 ring-indigo-500/20 border-indigo-500" : ""}
                `}
                disabled={!hasWorkload}
              >
                <div className="text-center flex flex-col items-center h-full justify-between min-h-[140px]">
                  {/* Top: Day & Date */}
                  <div className="w-full">
                    <div
                      className={`text-xs font-bold uppercase tracking-widest mb-1 ${day.isToday ? "text-indigo-600" : "opacity-70"}`}
                    >
                      {format(day.date, "EEEE")}
                    </div>
                    <div
                      className={`text-3xl font-black tracking-tighter ${
                        day.isToday ? "text-indigo-600" : ""
                      }`}
                    >
                      {format(day.date, "d")}
                    </div>
                  </div>

                  {/* Bottom: Status & Hours */}
                  {hasWorkload ? (
                    <div className="w-full mt-auto pt-3 flex flex-col items-center gap-1.5">
                      <div className="p-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm mb-1 transform transition-transform group-hover:scale-110">
                        {getStatusIcon(day.weekData.status)}
                      </div>
                      <div className="text-xs font-extrabold uppercase tracking-wider opacity-90">
                        {getStatusLabel(day.weekData.status)}
                      </div>
                      <div className="text-sm font-black bg-white/40 px-2 py-0.5 rounded shadow-sm">
                        {day.weekData.totalHours || 0}h
                      </div>

                      {/* Badge for items */}
                      {day.weekData.breakdown?.length > 0 && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md ring-4 ring-white">
                          {day.weekData.breakdown.length}
                        </div>
                      )}

                      {/* Floating Tooltip */}
                      {isHovered && day.weekData.breakdown?.length > 0 && (
                        <div className="absolute z-20 bottom-[105%] left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-xl whitespace-nowrap animate-scale-in pointer-events-none border border-gray-700">
                          <div className="flex items-center gap-2 font-semibold">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            {day.weekData.breakdown.length} scheduled item
                            {day.weekData.breakdown.length !== 1 ? "s" : ""}
                          </div>
                          {/* Triangle pointer */}
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/95 rotate-45 border-r border-b border-gray-700"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-gray-400 mt-auto pt-4 uppercase tracking-widest">
                      {weekNumber <= 16 ? "No Data" : "End"}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Enhanced Footer Legend */}
        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col xl:flex-row gap-8 justify-between">
          <div className="flex-1">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              Status Indicators
            </h4>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  label: "Easy",
                  icon: CheckCircle,
                  color: "text-emerald-700",
                  bg: "bg-emerald-50",
                  border: "border-emerald-200",
                },
                {
                  label: "Packed",
                  icon: AlertTriangle,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                  border: "border-amber-200",
                },
                {
                  label: "Steady",
                  icon: Activity,
                  color: "text-indigo-700",
                  bg: "bg-indigo-50",
                  border: "border-indigo-200",
                },
                {
                  label: "Intense",
                  icon: AlertCircle,
                  color: "text-orange-700",
                  bg: "bg-orange-50",
                  border: "border-orange-200",
                },
                {
                  label: "Full Plate",
                  icon: AlertCircle,
                  color: "text-red-700",
                  bg: "bg-red-50",
                  border: "border-red-200",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-1.5 ${item.bg} border ${item.border} rounded-lg text-xs font-bold shadow-sm transition-transform hover:-translate-y-0.5`}
                >
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className={item.color}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50/50 p-5 rounded-2xl border border-indigo-100">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Quick Guide
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-gray-600">
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                <span>
                  Click any colored day card to reveal a detailed breakdown of
                  tasks.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                <span>
                  Hover over days with the blue badge to see total active tasks
                  instantly.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                <span>
                  The glowing border highlights today's date so you stay
                  oriented.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkloadCalendar;
