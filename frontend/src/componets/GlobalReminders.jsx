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
          (a) => isReminderActive(a) && !dismissed.has(a.id)
        );
        setReminders(filtered);
      } catch (err) {
        console.error("GlobalReminders load error", err);
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
    <div className="mb-4 space-y-2">
      {reminders.map((a) => (
        <div
          key={a.id}
          onClick={(e) => handleReminderClick(e, a)}
          className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-xs cursor-pointer hover:bg-amber-100"
        >
          <div className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold">
            !
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="font-semibold truncate">{a.title}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.remind_until && (
                  <span className="text-[10px] text-amber-800/80 whitespace-nowrap">
                    {formatDateOnly(a.remind_until)}
                  </span>
                )}
                {renderCountdownBadge(a, now)}
              </div>
            </div>
            <p className="text-amber-900/90 leading-snug line-clamp-2">
              {a.message}
            </p>
            {Array.isArray(a.attachments) && a.attachments.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-[11px] text-amber-900/90">
                {a.attachments.map((att, idx) => (
                  <li
                    key={`${att.url}-${idx}`}
                    className="flex items-center gap-1"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-amber-600"
                      aria-hidden="true"
                    />
                    <span className="text-amber-700 font-medium">
                      {att.label || "Attachment"}:
                    </span>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-900 underline break-all"
                    >
                      {att.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDismiss(a.id)}
            className="ml-1 text-[11px] text-amber-800/80 hover:text-amber-900"
          >
            ×
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
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 border border-red-200">
      Due in {label}
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
