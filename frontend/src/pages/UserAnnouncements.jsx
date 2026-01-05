import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnnouncements } from "../services/api/announcementApi";

export default function UserAnnouncements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const reminders = announcements.filter((a) => isReminderActive(a));
  const isActiveReminder = (a) => isReminderActive(a);

  const openDetails = (a) => {
    setSelected(a);
    setShowModal(true);
  };

  const handleCardClick = (event, a) => {
    const target = event.target;
    if (target.closest("a") || target.closest("button")) return;
    openDetails(a);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50 px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Announcements & reminders
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Stay up to date with important course announcements and time-bound
              reminders from your instructors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/announcements")}
            className="hidden sm:inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
          >
            Manage announcements
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Reminders section */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  !
                </span>
                Important reminders
              </h3>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                These announcements were marked as reminders by your instructor.
              </p>
            </div>
            {loading && (
              <span className="text-[11px] text-amber-700/80">
                Refreshing...
              </span>
            )}
          </div>

          {reminders.length === 0 ? (
            <p className="text-xs text-amber-800/80">
              No active reminders right now.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {reminders.map((a) => (
                <li
                  key={a.id}
                  onClick={(e) => handleCardClick(e, a)}
                  className="rounded-lg bg-white/80 border border-amber-200 px-3 py-2 flex flex-col gap-1 cursor-pointer hover:bg-amber-50/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-amber-900">{a.title}</p>
                    <div className="flex items-center gap-2">
                      {a.remind_until && (
                        <span className="text-[10px] text-amber-800/80 whitespace-nowrap">
                          {formatDateOnly(a.remind_until)}
                        </span>
                      )}
                      {renderCountdownBadge(a, now)}
                    </div>
                  </div>
                  <p className="text-amber-900/90 leading-snug whitespace-pre-line">
                    {a.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => openDetails(a)}
                    className="mt-1 self-start text-[11px] font-medium text-amber-800 hover:text-amber-900"
                  >
                    View details
                  </button>
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
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* All announcements */}
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">
              All announcements
            </h3>
          </div>

          {announcements.length === 0 && !loading ? (
            <p className="text-xs text-slate-500">No announcements yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  onClick={(e) => handleCardClick(e, a)}
                  className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50/80 flex flex-col gap-1 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {a.title}
                      </p>
                      {a.remind_until && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Deadline: {formatDateOnly(a.remind_until)}
                        </p>
                      )}
                    </div>
                    {isActiveReminder(a) && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                        Reminder
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-snug line-clamp-2">
                    {a.message}
                  </p>
                  {Array.isArray(a.attachments) && a.attachments.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-slate-700">
                      {a.attachments.map((att, idx) => (
                        <li
                          key={`${att.url}-${idx}`}
                          className="flex items-center gap-1"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full bg-slate-500"
                            aria-hidden="true"
                          />
                          <span className="font-medium">
                            {att.label || "Attachment"}:
                          </span>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline break-all"
                          >
                            {att.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => openDetails(a)}
                    className="mt-1 self-start text-[11px] font-medium text-slate-700 hover:text-slate-900"
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showModal && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-5 text-xs">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {selected.title}
                </h3>
                {selected.remind_until && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Deadline: {formatDateOnly(selected.remind_until)}
                  </p>
                )}
                {isActiveReminder(selected) && (
                  <p className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
                    Active reminder
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelected(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-slate-700 whitespace-pre-line leading-snug">
                  {selected.message}
                </p>
              </div>

              {Array.isArray(selected.attachments) &&
                selected.attachments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-slate-700">
                      Attachments
                    </p>
                    <ul className="space-y-0.5 text-[11px] text-slate-700">
                      {selected.attachments.map((att, idx) => (
                        <li
                          key={`${att.url}-${idx}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full bg-slate-500"
                            aria-hidden="true"
                          />
                          <span className="font-medium">
                            {att.label || "Attachment"}:
                          </span>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline break-all"
                          >
                            {att.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
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