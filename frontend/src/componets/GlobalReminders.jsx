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

  const handleClearAll = () => {
    if (!reminders.length) return;
    const dismissed = loadDismissed();
    reminders.forEach((r) => {
      if (r?.id) dismissed.add(r.id);
    });
    saveDismissed(dismissed);
    setReminders([]);
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
    <div className="fixed top-20 right-1 z-30 max-w-xs w-[85vw] sm:w-80 space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {reminders.length > 0 && (
          <div className="flex items-center gap-2 mx-auto w-fit">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
              <div className="relative inline-flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </div>
              {reminders.length} Active{" "}
              {reminders.length === 1 ? "Reminder" : "Reminders"}
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
              title="Clear all reminders"
              aria-label="Clear all reminders"
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
                  d="M6 7h12m-9 0V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12"
                />
              </svg>
            </button>
          </div>
        )}
        {reminders.map((a) => (
          <div
            key={a.id}
            onClick={(e) => handleReminderClick(e, a)}
            className="group relative flex flex-col gap-3 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 px-5 py-4 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-blue-300 animate-slide-in"
          >
            {/* Header with Icon and Title */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md ring-2 ring-blue-100">
                  <svg
                    className="w-5 h-5 text-white animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2 mb-1">
                  {a.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {a.remind_until && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {formatDateOnly(a.remind_until)}
                    </span>
                  )}
                  {renderCountdownBadge(a, now)}
                </div>
              </div>
              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(a.id);
                }}
                className="flex-shrink-0 -mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                title="Dismiss this reminder"
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
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Message Content */}
            <div className="px-0">
              <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                {a.message}
              </p>
            </div>

            {/* Attachments Section */}
            {Array.isArray(a.attachments) && a.attachments.length > 0 && (
              <div className="mt-1 space-y-2 pt-3 border-t border-blue-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Resources
                </p>
                <div className="space-y-1.5">
                  {a.attachments.slice(0, 2).map((att, idx) => (
                    <a
                      key={`${att.url}-${idx}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white hover:bg-blue-50 border border-blue-100 transition-all group/link"
                    >
                      <svg
                        className="w-4 h-4 text-blue-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.586 4.586a2 2 0 112.828 2.828l-.793.793-2.828-2.829.793-.792zM9.172 9.172a2 2 0 112.828 2.829l-.793.793-2.828-2.828.793-.793zm6.414-6.414a4 4 0 00-5.656 0l-4 4a1 1 0 101.414 1.414l4-4a2 2 0 113.304 2.304l-4.793 4.793a1 1 0 001.414 1.414l4.793-4.793a4 4 0 000-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-blue-700 truncate group-hover/link:text-blue-800">
                          {att.label || "View Resource"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {new URL(att.url).hostname}
                        </p>
                      </div>
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 group-hover/link:text-blue-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ))}
                  {a.attachments.length > 2 && (
                    <div className="flex items-center gap-1 pl-3 text-xs text-slate-600 font-medium">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      +{a.attachments.length - 2} more resource
                      {a.attachments.length - 2 !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer - CTA */}
            <div className="mt-2 pt-3 border-t border-blue-200 flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                Created {formatDateOnly(a.created_at)}
              </p>
              <button
                onClick={(e) => handleReminderClick(e, a)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
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
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-md animate-pulse">
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
