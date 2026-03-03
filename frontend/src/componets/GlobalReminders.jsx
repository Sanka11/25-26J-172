import { useEffect, useState } from "react";
import { getAnnouncements } from "../services/api/announcementApi";

const STORAGE_KEY = "dismissed_reminder_ids";

function loadDismissed() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(set) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export default function GlobalReminders({ onReminderClick }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const data = await getAnnouncements();
        if (!active) return;
        const dismissed = loadDismissed();
        const filtered = (data || []).filter(
          (a) => isReminderActive(a) && !dismissed.has(a.id),
        );
        setReminders(filtered);
      } catch (err) {
        console.error("GlobalReminders load error", err);
        setReminders([]); // Clear reminders on error to show graceful fallback
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReminders();

    // Optionally refresh on an interval
    const interval = setInterval(fetchReminders, 60_000);
    const tick = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      active = false;
      clearInterval(interval);
      clearInterval(tick);
    };
  }, []);

  const handleDismiss = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    const dismissed = loadDismissed();
    dismissed.add(id);
    saveDismissed(dismissed);
  };

  if (!reminders.length) return null;

  const handleReminderClick = (event, announcement) => {
    if (!onReminderClick) return;
    // Don't trigger navigation when clicking links or buttons (e.g., attachments, dismiss)
    const target = event.target;
    if (target.closest("a") || target.closest("button")) return;
    onReminderClick(announcement);
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-[90vw] sm:w-96 space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-transparent">
      {reminders.map((a) => (
        <div
          key={a.id}
          onClick={(e) => handleReminderClick(e, a)}
          className="group relative flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-slide-in"
        >
          {/* Icon */}
          <div className="mt-1 flex-shrink-0">
            <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <svg
                className="w-5 h-5 text-white animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="font-bold text-amber-900 text-base leading-tight truncate">
                {a.title}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {a.remind_until && (
                  <span className="text-sm text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
                    {formatDateOnly(a.remind_until)}
                  </span>
                )}
                {renderCountdownBadge(a, now)}
              </div>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed line-clamp-2 mb-2">
              {a.message}
            </p>
            {Array.isArray(a.attachments) && a.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {a.attachments.slice(0, 2).map((att, idx) => (
                  <div
                    key={`${att.url}-${idx}`}
                    className="flex items-center gap-1.5 text-sm bg-white/70 px-2 py-1 rounded-lg border border-amber-200"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-amber-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-amber-800 font-semibold truncate">
                      {att.label || "Attachment"}
                    </span>
                  </div>
                ))}
                {a.attachments.length > 2 && (
                  <p className="text-sm text-amber-700 font-medium pl-2">
                    +{a.attachments.length - 2} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(a.id);
            }}
            className="flex-shrink-0 -mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-amber-600 hover:text-amber-900 hover:bg-amber-200 transition-colors"
            title="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function formatDateOnly(ts) {
  if (!ts) return "";
  try {
    let date;
    if (ts.toDate) {
      date = ts.toDate();
    } else if (ts._seconds) {
      date = new Date(ts._seconds * 1000);
    } else {
      date = new Date(ts);
    }
    return date.toLocaleDateString();
  } catch {
    return "";
  }
}

function renderCountdownBadge(a, now) {
  const deadline = getReminderDeadline(a.remind_until);
  if (!deadline) return null;
  const diffMs = deadline - now;
  if (diffMs <= 0) return null;
  const hoursLeft = diffMs / (1000 * 60 * 60);
  if (hoursLeft > 24) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-2 py-0.5 text-sm font-bold text-white shadow-md">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}

function isReminderActive(a) {
  if (!a || !a.remind) return false;
  const deadline = getReminderDeadline(a.remind_until);
  if (!deadline) return true;
  const now = new Date();
  return now <= deadline;
}

function getReminderDeadline(ts) {
  if (!ts) return null;
  try {
    let date;
    if (ts.toDate) {
      date = ts.toDate();
    } else if (ts._seconds) {
      date = new Date(ts._seconds * 1000);
    } else {
      date = new Date(ts);
    }
    return date;
  } catch {
    return null;
  }
}
