import {
  format,
  isSameDay,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";

const WorkloadCalendar = ({
  workload = [],
  onDayClick,
  currentWeekStart,
  onWeekChange,
  semesterStartDate,
  view = "week",
}) => {
  const workloadByWeek = useMemo(() => {
    const map = new Map();
    workload.forEach((weekData) => {
      if (weekData.week) map.set(weekData.week, weekData);
    });
    return map;
  }, [workload]);

  const isPackedStatus = (status) =>
    ["BUSY", "HEAVY", "OVERLOADED"].includes(status);

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

  const monthStart = useMemo(
    () => startOfMonth(new Date(currentWeekStart)),
    [currentWeekStart],
  );
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );

  const startingDayIndex =
    getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const emptyDays = Array(startingDayIndex).fill(null);

  const handlePrevious = () => {
    if (!onWeekChange) return;
    const newDate =
      view === "week"
        ? subWeeks(new Date(currentWeekStart), 1)
        : subMonths(new Date(currentWeekStart), 1);
    onWeekChange(newDate);
  };

  const handleNext = () => {
    if (!onWeekChange) return;
    const newDate =
      view === "week"
        ? addWeeks(new Date(currentWeekStart), 1)
        : addMonths(new Date(currentWeekStart), 1);
    onWeekChange(newDate);
  };

  const handleJumpToToday = () => {
    if (!onWeekChange) return;
    onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (!currentWeekStart) return null;

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-white/30 backdrop-blur-xl">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-3 tracking-tight">
            <div className="bg-indigo-100/80 p-2 sm:p-2.5 rounded-xl text-indigo-600 shadow-inner">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            {view === "week" ? "Weekly Timeline" : "Monthly View"}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-gray-500 mt-2 flex items-center gap-2">
            {view === "week" ? (
              <>
                <span className="px-2 py-1 bg-white shadow-sm text-indigo-700 rounded-lg border border-gray-100">
                  Week {weekNumber}
                </span>
                <span>
                  • {format(weekDays[0], "MMM d")} -{" "}
                  {format(weekDays[6], "MMM d, yyyy")}
                </span>
              </>
            ) : (
              <span className="px-3 py-1 bg-white shadow-sm text-indigo-700 rounded-lg border border-gray-100 text-base sm:text-lg">
                {format(monthStart, "MMMM yyyy")}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-white/50 p-1.5 rounded-2xl border border-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-sm self-start md:self-auto">
          <button
            onClick={handlePrevious}
            className="p-2 sm:p-3 rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-600 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleJumpToToday}
            className="px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm bg-indigo-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.39)] rounded-xl hover:bg-indigo-700 transition-all font-bold active:scale-95"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 sm:p-3 rounded-xl hover:bg-white hover:shadow-md transition-all text-gray-600 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {view === "week" ? (
        /* --- WEEKLY GRID --- */
        <div className="space-y-6">
          {/* Weekly Summary Banner (Only renders if there is workload data) */}
          {currentWorkload && (
            <div
              onClick={() => onDayClick?.(currentWorkload)}
              className={`w-full p-4 sm:p-5 rounded-2xl border cursor-pointer hover:-translate-y-1 transition-transform flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isPackedStatus(currentWorkload.status) ? "bg-gradient-to-r from-red-50 to-red-100/50 border-red-200" : "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl shadow-sm bg-white ${isPackedStatus(currentWorkload.status) ? "text-red-500" : "text-emerald-500"}`}
                >
                  {isPackedStatus(currentWorkload.status) ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <CheckCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4
                    className={`text-lg font-black ${isPackedStatus(currentWorkload.status) ? "text-red-900" : "text-emerald-900"}`}
                  >
                    Week {currentWorkload.week} Overview
                  </h4>
                  <p
                    className={`text-sm font-bold ${isPackedStatus(currentWorkload.status) ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {currentWorkload.totalHours} Estimated Hours •{" "}
                    {currentWorkload.breakdown?.length || 0} Key Subjects
                  </p>
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-xl text-sm font-bold bg-white shadow-sm border transition-colors ${isPackedStatus(currentWorkload.status) ? "text-red-700 border-red-100 hover:bg-red-50" : "text-emerald-700 border-emerald-100 hover:bg-emerald-50"}`}
              >
                View Details
              </button>
            </div>
          )}

          {/* Clean Day Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {weekDays.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div
                  key={index}
                  className={`relative p-4 sm:p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center min-h-[120px] sm:min-h-[140px]
                    ${isToday ? "bg-indigo-50 border-indigo-400 ring-4 ring-indigo-500/20 shadow-md" : "bg-white/80 border-gray-100 hover:border-gray-300"}`}
                >
                  <div
                    className={`text-xs font-black uppercase tracking-widest mb-1 ${isToday ? "text-indigo-600" : "text-gray-400"}`}
                  >
                    {format(date, "EEEE")}
                  </div>
                  <div
                    className={`text-3xl sm:text-4xl font-black tracking-tighter ${isToday ? "text-indigo-600" : "text-gray-800"}`}
                  >
                    {format(date, "d")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* --- MONTHLY GRID --- */
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] sm:text-xs font-black text-gray-400 py-3 sm:py-4 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-[1px] bg-gray-100">
            {emptyDays.map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-gray-50/30 min-h-[80px] sm:min-h-[120px]"
              ></div>
            ))}

            {monthDays.map((date, i) => {
              const weekNum = calculateAcademicWeek(date);
              const dayWorkload = workloadByWeek.get(weekNum);
              const isToday = isSameDay(date, new Date());
              const isPacked =
                dayWorkload && isPackedStatus(dayWorkload.status);

              // Only display the badge on the first day of the academic week (Monday)
              const isStartOfWeek = getDay(date) === 1;

              return (
                <div
                  key={i}
                  className={`min-h-[80px] sm:min-h-[120px] p-1.5 sm:p-3 relative transition-all duration-200 group
                    ${dayWorkload && isStartOfWeek ? "cursor-pointer hover:z-10 hover:shadow-lg" : ""}
                    ${isPacked ? "bg-red-50/40 hover:bg-red-50/80" : dayWorkload ? "bg-emerald-50/30" : "bg-white"}
                  `}
                  onClick={() =>
                    dayWorkload && isStartOfWeek && onDayClick?.(dayWorkload)
                  }
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                      ${isToday ? "bg-indigo-600 text-white shadow-md" : "text-gray-600"}
                    `}
                    >
                      {format(date, "d")}
                    </span>
                  </div>

                  {/* Single Week Anchor Badge */}
                  {dayWorkload && isStartOfWeek && (
                    <div
                      className={`mt-2 p-1 sm:p-1.5 rounded-lg border text-[10px] sm:text-xs font-bold transition-transform group-hover:-translate-y-0.5
                      ${isPacked ? "bg-red-50 border-red-200 text-red-700 shadow-sm" : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"}
                    `}
                    >
                      <div className="flex items-center gap-1 line-clamp-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70 flex-shrink-0" />{" "}
                        {dayWorkload.totalHours || 0}h
                      </div>
                      {isPacked && dayWorkload.breakdown?.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] text-red-600 line-clamp-1">
                          <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />{" "}
                          {dayWorkload.breakdown.length} Tasks
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadCalendar;
