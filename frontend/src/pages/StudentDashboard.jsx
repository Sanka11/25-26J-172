import { useEffect, useState } from "react";
import {
  startOfWeek,
  addDays,
  format,
  differenceInDays,
  parseISO,
  addWeeks,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  GraduationCap,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Plus,
  X,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  CalendarDays,
  Target,
  TrendingUp,
  ListTodo,
  Filter as FilterIcon,
  Sparkles,
  Trophy,
} from "lucide-react";

import WorkloadCalendar from "../componets/WorkloadCalendar";
import WorkloadSummary from "../componets/WorkloadSummary";
import DayBreakdown from "../componets/DayBreakdown";
import StudyTimetable from "../componets/StudyTimetable";

import { fetchDailyWorkload } from "../services/api/workloadService";
import { fetchStudentEnrollment } from "../services/api/studentService";

const StudentDashboard = () => {
  const studentId = "S001";
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [internship, setInternship] = useState(null);

  const [workload, setWorkload] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const [todos, setTodos] = useState([]);
  const [manualReminders, setManualReminders] = useState([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);

  const [newReminder, setNewReminder] = useState({
    title: "",
    date: "",
    time: "",
  });

  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    category: "study",
    subjectId: "",
  });

  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [todoFilter, setTodoFilter] = useState("ALL"); // ALL, ACTIVE, COMPLETED, TODAY
  const [editingTodoId, setEditingTodoId] = useState(null);

  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekEnd = addDays(weekStart, 6);

  // Semester configuration
  const semesterStartDate = new Date("2024-02-24");
  const semesterDurationWeeks = 26; // 6 months ≈ 26 weeks
  const [currentWeek, setCurrentWeek] = useState(1);

  // Load existing todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem(`todos_${studentId}`);
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        parsedTodos.forEach((todo) => {
          todo.dueDate = new Date(todo.dueDate);
          todo.createdAt = new Date(todo.createdAt);
          if (todo.completedAt) todo.completedAt = new Date(todo.completedAt);
        });
        setTodos(parsedTodos);
      } catch (error) {
        console.error("Error loading todos:", error);
      }
    }
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const enrollment = await fetchStudentEnrollment(studentId);
        setSubjects(enrollment.subjects || []);
        setInternship(enrollment.internship || null);

        const workloadData = await fetchDailyWorkload(studentId);
        setWorkload(workloadData);

        generateTodos(enrollment.subjects || [], enrollment.internship);
        generateWeeklySchedule(
          enrollment.subjects || [],
          enrollment.internship,
        );
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`todos_${studentId}`, JSON.stringify(todos));
  }, [todos]);

  // Calculate current week based on semester start
  useEffect(() => {
    const today = new Date();
    const weekDiff =
      Math.floor(differenceInDays(today, semesterStartDate) / 7) + 1;
    setCurrentWeek(Math.min(Math.max(weekDiff, 1), semesterDurationWeeks));
  }, []);

  const generateTodos = (subjects, internship) => {
    const today = new Date();
    const list = [];

    subjects.forEach((sub) => {
      const base = new Date(sub.semesterStartDate || semesterStartDate);

      const getDateByWeek = (week) =>
        new Date(base.getTime() + (week - 1) * 7 * 86400000);

      // Process all assessment types
      const assessments = [
        { key: "assignmentWeek", label: "Assignment" },
        { key: "midExamWeek", label: "Mid Exam" },
        { key: "finalExamWeek", label: "Final Exam" },
        { key: "quizWeeks", label: "Quiz" },
        { key: "projectSubmissionWeek", label: "Project" },
      ];

      assessments.forEach(({ key, label }) => {
        if (sub.assessmentTimeline?.[key]) {
          const weeks = Array.isArray(sub.assessmentTimeline[key])
            ? sub.assessmentTimeline[key]
            : [sub.assessmentTimeline[key]];

          weeks.forEach((week) => {
            const dueDate = getDateByWeek(week);
            const daysLeft = differenceInDays(dueDate, today);

            if (daysLeft >= 0 && daysLeft <= 14) {
              list.push({
                id: `auto_${Date.now()}_${Math.random()}`,
                title: `${sub.subjectName} – ${label}`,
                description: `Complete ${label.toLowerCase()} for ${sub.subjectName}`,
                dueDate,
                daysLeft,
                priority: daysLeft <= 7 ? "HIGH" : "MEDIUM",
                category: label.toLowerCase(),
                subjectId: sub.subjectId,
                subjectName: sub.subjectName,
                type: "AUTO_GENERATED",
                completed: false,
                createdAt: new Date(),
                isAutoGenerated: true,
              });
            }
          });
        }
      });
    });

    if (internship?.submissionWeeks) {
      internship.submissionWeeks.forEach((week) => {
        const dueDate = new Date(
          semesterStartDate.getTime() + (week - 1) * 7 * 86400000,
        );
        const daysLeft = differenceInDays(dueDate, today);

        if (daysLeft >= 0 && daysLeft <= 14) {
          list.push({
            id: `internship_${Date.now()}_${Math.random()}`,
            title: "Internship Weekly Submission",
            description: "Submit weekly internship report",
            dueDate,
            daysLeft,
            priority: "HIGH",
            category: "internship",
            type: "INTERNSHIP",
            completed: false,
            createdAt: new Date(),
            isAutoGenerated: true,
          });
        }
      });
    }

    // Merge with existing todos, avoiding duplicates
    setTodos((prevTodos) => {
      const existingAutoIds = new Set(
        prevTodos
          .filter((t) => t.isAutoGenerated)
          .map((t) => t.id.split("_")[1]),
      );

      const newAutoTodos = list.filter((todo) => {
        const baseId = todo.id.split("_")[1];
        return !existingAutoIds.has(baseId);
      });

      return [...prevTodos, ...newAutoTodos].sort(
        (a, b) => a.dueDate - b.dueDate,
      );
    });
  };

  const generateWeeklySchedule = (subjects, internship) => {
    console.log("Generating weekly schedule...");
  };

  // To-Do Functions
  const addTodo = () => {
    if (!newTodo.title.trim()) return;

    const todo = {
      id: `manual_${Date.now()}_${Math.random()}`,
      ...newTodo,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : null,
      completed: false,
      createdAt: new Date(),
      isAutoGenerated: false,
    };

    setTodos([...todos, todo]);
    setNewTodo({
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      category: "study",
      subjectId: "",
    });
    setShowTodoForm(false);
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          const updatedTodo = {
            ...todo,
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date() : null,
          };

          // Show celebration for completing a high priority todo
          if (updatedTodo.completed && todo.priority === "HIGH") {
            showTemporaryNotification(
              "🎉 Great job completing a high priority task!",
              "success",
            );
          }

          return updatedTodo;
        }
        return todo;
      }),
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const editTodo = (id) => {
    const todoToEdit = todos.find((todo) => todo.id === id);
    if (todoToEdit) {
      setNewTodo({
        title: todoToEdit.title,
        description: todoToEdit.description || "",
        dueDate: todoToEdit.dueDate
          ? format(todoToEdit.dueDate, "yyyy-MM-dd")
          : "",
        priority: todoToEdit.priority,
        category: todoToEdit.category,
        subjectId: todoToEdit.subjectId || "",
      });
      setEditingTodoId(id);
      setShowTodoForm(true);
    }
  };

  const saveTodoEdit = () => {
    if (!newTodo.title.trim()) return;

    setTodos(
      todos.map((todo) => {
        if (todo.id === editingTodoId) {
          return {
            ...todo,
            ...newTodo,
            dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : null,
          };
        }
        return todo;
      }),
    );

    setNewTodo({
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      category: "study",
      subjectId: "",
    });
    setEditingTodoId(null);
    setShowTodoForm(false);
  };

  const addManualReminder = () => {
    if (!newReminder.title || !newReminder.date) return;

    const reminder = {
      id: Date.now(),
      ...newReminder,
      date: parseISO(newReminder.date),
      type: "manual",
      priority: "MEDIUM",
    };

    setManualReminders([...manualReminders, reminder]);
    setNewReminder({ title: "", date: "", time: "" });
    setShowReminderForm(false);
  };

  const removeManualReminder = (id) => {
    setManualReminders(manualReminders.filter((r) => r.id !== id));
  };

  const showTemporaryNotification = (message, type = "success") => {
    // Create a temporary notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-500 ${
      type === "success"
        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
        : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-gradient-to-r from-red-500 to-rose-500";
      case "MEDIUM":
        return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "LOW":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500";
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "text-red-700";
      case "MEDIUM":
        return "text-amber-700";
      case "LOW":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "study":
        return "bg-gradient-to-r from-indigo-100 to-purple-100";
      case "assignment":
        return "bg-gradient-to-r from-amber-100 to-yellow-100";
      case "exam":
        return "bg-gradient-to-r from-red-100 to-pink-100";
      case "internship":
        return "bg-gradient-to-r from-emerald-100 to-green-100";
      case "personal":
        return "bg-gradient-to-r from-sky-100 to-cyan-100";
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-100";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "study":
        return <BookOpen className="w-4 h-4" />;
      case "assignment":
        return <ListTodo className="w-4 h-4" />;
      case "exam":
        return <Target className="w-4 h-4" />;
      case "internship":
        return <Briefcase className="w-4 h-4" />;
      case "personal":
        return <Sparkles className="w-4 h-4" />;
      default:
        return <ListTodo className="w-4 h-4" />;
    }
  };

  // Filter todos based on selected filter
  const filteredTodos = todos.filter((todo) => {
    const today = startOfDay(new Date());

    switch (todoFilter) {
      case "COMPLETED":
        return todo.completed;
      case "ACTIVE":
        return !todo.completed;
      case "TODAY":
        if (!todo.dueDate) return false;
        const todoDate = startOfDay(new Date(todo.dueDate));
        return !todo.completed && todoDate.getTime() === today.getTime();
      case "UPCOMING":
        if (!todo.dueDate) return false;
        const dueDate = startOfDay(new Date(todo.dueDate));
        return (
          !todo.completed &&
          dueDate > today &&
          dueDate <= endOfDay(addDays(today, 7))
        );
      default:
        return true;
    }
  });

  // Calculate statistics
  const todoStats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    pending: todos.filter((t) => !t.completed).length,
    overdue: todos.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length,
    today: todos.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      const today = startOfDay(new Date());
      const todoDate = startOfDay(new Date(t.dueDate));
      return todoDate.getTime() === today.getTime();
    }).length,
  };

  const progressPercentage =
    todoStats.total > 0
      ? Math.round((todoStats.completed / todoStats.total) * 100)
      : 0;

  const subjectOptions = ["ALL", ...subjects.map((s) => s.subjectId)];

  const weeklyWorkload = workload.filter((day) => {
    const date = new Date(day.date);
    if (date < weekStart || date > weekEnd) return false;
    if (selectedSubject === "ALL") return true;
    return day.subjectId === selectedSubject;
  });

  const nextWeekOverloaded = workload.some((day) => {
    const date = new Date(day.date);
    return (
      date >= addDays(weekStart, 7) &&
      date <= addDays(weekStart, 13) &&
      day.loadStatus === "OVERLOADED"
    );
  });

  const examInTwoWeeks = todos.some(
    (t) => t.title.toLowerCase().includes("exam") && !t.completed,
  );

  const goPrevWeek = () => {
    setSelectedDay(null);
    setWeekStart(addDays(weekStart, -7));
  };

  const goNextWeek = () => {
    setSelectedDay(null);
    setWeekStart(addDays(weekStart, 7));
  };

  const getDayEvents = (date) => {
    const dayStr = format(date, "yyyy-MM-dd");
    const events = [];

    // Add todos for this day
    todos.forEach((todo) => {
      if (todo.dueDate && format(todo.dueDate, "yyyy-MM-dd") === dayStr) {
        events.push({
          ...todo,
          isTodo: true,
        });
      }
    });

    // Add manual reminders for this day
    manualReminders.forEach((reminder) => {
      if (format(reminder.date, "yyyy-MM-dd") === dayStr) {
        events.push({
          ...reminder,
          isReminder: true,
        });
      }
    });

    // Add lectures based on subject schedule
    subjects.forEach((sub) => {
      if (sub.schedule?.includes(format(date, "EEEE"))) {
        events.push({
          title: `${sub.subjectName} Lecture`,
          type: "lecture",
          priority: "LOW",
        });
      }
    });

    return events;
  };

  // Generate week days with dates
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(weekStart, i);
    return {
      name: format(date, "EEEE"),
      date: format(date, "yyyy-MM-dd"),
      displayDate: format(date, "MMM dd"),
      events: getDayEvents(date),
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Student Dashboard
            </h1>
            <div className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              Semester Week: {currentWeek}
            </div>
          </div>
          <p className="text-gray-600">
            Manage your workload and track your progress
          </p>
        </div>

        {nextWeekOverloaded && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Next week is overloaded
              </p>
              <p className="text-sm text-amber-700">
                Consider planning ahead and distributing your workload
              </p>
            </div>
          </div>
        )}

        {examInTwoWeeks && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">
                Upcoming exams within 2 weeks
              </p>
              <p className="text-sm text-red-700">
                Check your to-do list and start preparing
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Calendar View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Week Overview
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrevWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-900">
                      {format(weekStart, "MMM dd")} -{" "}
                      {format(weekEnd, "MMM dd")}
                    </span>
                  </div>
                  <button
                    onClick={goNextWeek}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Weekly Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      {day.name.substring(0, 3)}
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                        format(new Date(), "yyyy-MM-dd") === day.date
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {format(parseISO(day.date), "d")}
                    </div>
                    {day.events.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {day.events.slice(0, 2).map((event, idx) => (
                          <div
                            key={idx}
                            className={`text-xs px-2 py-1 rounded truncate ${
                              event.type === "exam"
                                ? "bg-red-100 text-red-800"
                                : event.type === "assignment"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : event.type === "lecture"
                                    ? "bg-blue-100 text-blue-800"
                                    : event.type === "internship"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-green-100 text-green-800"
                            }`}
                            title={event.title}
                          >
                            {event.title.split(" – ")[0]}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{day.events.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Subject Filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4" />
                  Filter by Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedDay(null);
                    setSelectedSubject(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Subjects</option>
                  <option value="INTERNSHIP">Internship</option>
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <WorkloadSummary workload={weeklyWorkload} />
              <WorkloadCalendar
                workload={weeklyWorkload}
                onDayClick={setSelectedDay}
              />
            </div>

            {/* To-Do List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                    <ListTodo className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      To-Do List
                    </h3>
                    <p className="text-sm text-gray-600">
                      {todoStats.completed} of {todoStats.total} tasks completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {progressPercentage === 100 && todoStats.total > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full text-sm">
                      <Trophy className="w-4 h-4" />
                      <span>All Done!</span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowTodoForm(!showTodoForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{progressPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${progressPercentage === 100 ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Todo Filter Tabs */}
              <div className="flex gap-2 mb-6">
                {["ALL", "ACTIVE", "COMPLETED", "TODAY", "UPCOMING"].map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setTodoFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        todoFilter === filter
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {filter}{" "}
                      {filter === "TODAY" &&
                        todoStats.today > 0 &&
                        `(${todoStats.today})`}
                    </button>
                  ),
                )}
              </div>

              {/* Todo Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {todoStats.total}
                  </div>
                  <div className="text-sm text-blue-700">Total Tasks</div>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">
                    {todoStats.completed}
                  </div>
                  <div className="text-sm text-emerald-700">Completed</div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">
                    {todoStats.pending}
                  </div>
                  <div className="text-sm text-amber-700">Pending</div>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {todoStats.overdue}
                  </div>
                  <div className="text-sm text-red-700">Overdue</div>
                </div>
              </div>

              {/* Add Todo Form */}
              {showTodoForm && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {editingTodoId ? "Edit Task" : "Add New Task"}
                    </h4>
                    <button
                      onClick={() => {
                        setShowTodoForm(false);
                        setEditingTodoId(null);
                        setNewTodo({
                          title: "",
                          description: "",
                          dueDate: "",
                          priority: "MEDIUM",
                          category: "study",
                          subjectId: "",
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={newTodo.title}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="What needs to be done?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newTodo.category}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="study">Study</option>
                        <option value="assignment">Assignment</option>
                        <option value="exam">Exam</option>
                        <option value="internship">Internship</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newTodo.priority}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, priority: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTodo.dueDate}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, dueDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newTodo.description}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Add details about this task..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Subject (Optional)
                    </label>
                    <select
                      value={newTodo.subjectId}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, subjectId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {subjects.map((s) => (
                        <option key={s.subjectId} value={s.subjectId}>
                          {s.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowTodoForm(false);
                        setEditingTodoId(null);
                        setNewTodo({
                          title: "",
                          description: "",
                          dueDate: "",
                          priority: "MEDIUM",
                          category: "study",
                          subjectId: "",
                        });
                      }}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingTodoId ? saveTodoEdit : addTodo}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-colors"
                    >
                      {editingTodoId ? "Save Changes" : "Add Task"}
                    </button>
                  </div>
                </div>
              )}

              {/* Todo List */}
              {filteredTodos.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {todoFilter === "COMPLETED"
                      ? "No completed tasks yet"
                      : todoFilter === "TODAY"
                        ? "No tasks for today"
                        : "No tasks found"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {todoFilter === "ALL" &&
                      "Add your first task to get started!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`group p-4 rounded-lg border transition-all hover:shadow ${
                        todo.completed
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200"
                          : todo.priority === "HIGH"
                            ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                            : todo.priority === "MEDIUM"
                              ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`mt-1 flex-shrink-0 ${
                            todo.completed
                              ? "text-emerald-500"
                              : "text-gray-400 hover:text-blue-500"
                          }`}
                        >
                          {todo.completed ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className={`font-medium truncate ${
                                  todo.completed
                                    ? "text-emerald-800 line-through"
                                    : "text-gray-900"
                                }`}
                              >
                                {todo.title}
                              </p>
                              {todo.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {todo.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {todo.dueDate && (
                                <div
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                    todo.completed
                                      ? "bg-emerald-100 text-emerald-700"
                                      : new Date(todo.dueDate) < new Date()
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  <CalendarDays className="w-3 h-3" />
                                  <span>
                                    {format(new Date(todo.dueDate), "MMM dd")}
                                  </span>
                                </div>
                              )}

                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityTextColor(todo.priority)} ${todo.completed ? "bg-emerald-100" : getPriorityColor(todo.priority).replace("bg-gradient-to-r", "bg")}`}
                              >
                                {todo.priority}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 border-opacity-50">
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getCategoryColor(todo.category)}`}
                            >
                              {getCategoryIcon(todo.category)}
                              <span className="capitalize">
                                {todo.category}
                              </span>
                            </div>

                            {todo.subjectName && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                <BookOpen className="w-3 h-3" />
                                <span>{todo.subjectName}</span>
                              </div>
                            )}

                            {todo.isAutoGenerated && (
                              <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                Auto-generated
                              </div>
                            )}

                            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => editTodo(todo.id)}
                                className="p-1 text-gray-500 hover:text-blue-500 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="p-1 text-gray-500 hover:text-red-500 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Manual Reminder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Reminder
                  </h3>
                </div>
                <button
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Reminder
                </button>
              </div>

              {showReminderForm && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reminder Title
                      </label>
                      <input
                        type="text"
                        value={newReminder.title}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Get supervisor signature"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newReminder.date}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time (Optional)
                      </label>
                      <input
                        type="time"
                        value={newReminder.time}
                        onChange={(e) =>
                          setNewReminder({
                            ...newReminder,
                            time: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowReminderForm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addManualReminder}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Add Reminder
                    </button>
                  </div>
                </div>
              )}

              {manualReminders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Your Reminders</h4>
                  {manualReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {reminder.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(reminder.date, "MMM dd, yyyy")}
                          {reminder.time && ` at ${reminder.time}`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeManualReminder(reminder.id)}
                        className="p-1 hover:bg-green-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {examInTwoWeeks && <StudyTimetable subjects={subjects} />}
          </div>

          <div className="space-y-6">
            {/* Upcoming Tasks Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Upcoming Tasks
                </h3>
              </div>

              {todos.filter(
                (t) =>
                  !t.completed &&
                  t.dueDate &&
                  new Date(t.dueDate) <= addDays(new Date(), 7),
              ).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-gray-600">No urgent tasks</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todos
                    .filter(
                      (t) =>
                        !t.completed &&
                        t.dueDate &&
                        new Date(t.dueDate) <= addDays(new Date(), 7),
                    )
                    .slice(0, 5)
                    .map((t, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border-l-4 ${
                          t.priority === "HIGH"
                            ? "bg-red-50 border-red-500"
                            : "bg-amber-50 border-amber-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleTodo(t.id)}
                              className="mt-1"
                            >
                              {t.completed ? (
                                <CheckSquare className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <div>
                              <p className="font-medium text-gray-900">
                                {t.title}
                              </p>
                              {t.dueDate && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {format(t.dueDate, "MMM dd")} •{" "}
                                    {differenceInDays(t.dueDate, new Date())}d
                                    left
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              t.category === "exam"
                                ? "bg-red-100 text-red-800"
                                : t.category === "assignment"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : t.category === "internship"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {t.category}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Subjects with Syllabus */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  My Subjects
                </h3>
              </div>
              <div className="space-y-4">
                {subjects.map((sub) => (
                  <div
                    key={sub.subjectId}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-blue-900">
                          {sub.subjectName} ({sub.subjectId})
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Final: Week{" "}
                          {sub.assessmentTimeline?.finalExamWeek || "TBA"}
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </div>
                    {sub.syllabus && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-medium text-blue-800 mb-2">
                          Syllabus:
                        </p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {sub.syllabus.slice(0, 3).map((topic, idx) => (
                            <li key={idx} className="flex items-start">
                              <div className="w-1 h-1 bg-blue-500 rounded-full mt-1 mr-2"></div>
                              {topic}
                            </li>
                          ))}
                          {sub.syllabus.length > 3 && (
                            <li className="text-blue-600">
                              +{sub.syllabus.length - 3} more topics
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Internship */}
            {internship && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Internship
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {internship.companyName}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">{internship.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Working Days:
                    </p>
                    <p className="text-sm text-gray-600">
                      {internship.workingDays?.join(", ") || "Monday - Friday"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Office Hours:
                    </p>
                    <p className="text-sm text-gray-600">
                      {internship.officeHoursPerDay} hours per day
                    </p>
                  </div>
                  {internship.submissionWeeks && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Submission Weeks:
                      </p>
                      <p className="text-sm text-gray-600">
                        Weeks {internship.submissionWeeks.join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Supervisor:
                    </p>
                    <p className="text-sm text-gray-600">
                      {internship.supervisorName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {internship.supervisorEmail}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDay && (
        <DayBreakdown day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
};

export default StudentDashboard;
