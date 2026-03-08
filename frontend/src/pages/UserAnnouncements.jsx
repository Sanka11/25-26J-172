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
        setError(
          "Unable to load announcements at this moment. Please try again later.",
        );
        setAnnouncements([]); // Set empty array on error for graceful fallback
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-2 sm:px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Announcements & Reminders
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
            Stay up to date with important course announcements and
            time-sensitive reminders from your instructors
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border-l-4 border-red-500 shadow-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Active Reminders Section */}
        {reminders.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    ⚡ Important Reminders
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {reminders.length} active{" "}
                    {reminders.length === 1 ? "reminder" : "reminders"}{" "}
                    requiring your attention
                  </p>
                </div>
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Refreshing...</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {reminders.map((a) => (
                <div
                  key={a.id}
                  onClick={(e) => handleCardClick(e, a)}
                  className="group rounded-xl bg-white border-2 border-purple-200 px-5 py-4 shadow-md hover:shadow-xl hover:border-purple-400 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse shadow-lg"></div>
                      <p className="font-bold text-purple-900 text-base leading-tight">
                        {a.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.remind_until && (
                        <span className="text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shadow-md">
                          📅 {formatDateOnly(a.remind_until)}
                        </span>
                      )}
                      {renderCountdownBadge(a, now)}
                    </div>
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed mb-3 pl-5">
                    {a.message}
                  </p>
                  {Array.isArray(a.attachments) && a.attachments.length > 0 && (
                    <div className="mt-3 pl-5 space-y-2">
                      {a.attachments.map((att, idx) => (
                        <div
                          key={`${att.url}-${idx}`}
                          className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 rounded-lg border border-purple-200"
                        >
                          <svg
                            className="w-4 h-4 text-purple-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-purple-700 font-semibold">
                            {att.label || "Attachment"}:
                          </span>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline truncate font-medium"
                          >
                            {att.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openDetails(a)}
                    className="mt-3 ml-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline"
                  >
                    <span>View full details</span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Announcements Section */}
        <div className="bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 rounded-2xl shadow-xl border-2 border-purple-200 p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  All Announcements
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {announcements.length}{" "}
                  {announcements.length === 1
                    ? "announcement"
                    : "announcements"}{" "}
                  available
                </p>
              </div>
            </div>
          </div>

          {announcements.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="mt-4 text-lg text-slate-700 font-semibold">
                No announcements yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Check back later for updates from your instructors
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  onClick={(e) => handleCardClick(e, a)}
                  className="group rounded-xl border-2 border-purple-200 px-5 py-4 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:border-purple-400 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex-shrink-0"></div>
                        <p className="font-bold text-slate-900 text-base truncate">
                          {a.title}
                        </p>
                      </div>
                      {a.remind_until && (
                        <p className="text-sm text-slate-600 flex items-center gap-2 ml-5">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold">Deadline:</span>{" "}
                          {formatDateOnly(a.remind_until)}
                        </p>
                      )}
                    </div>
                    {isActiveReminder(a) && (
                      <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-sm font-bold text-white shadow-md whitespace-nowrap">
                        🔔 Reminder
                      </span>
                    )}
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed line-clamp-2 ml-5">
                    {a.message}
                  </p>
                  {Array.isArray(a.attachments) && a.attachments.length > 0 && (
                    <div className="mt-3 ml-5 space-y-2">
                      {a.attachments.map((att, idx) => (
                        <div
                          key={`${att.url}-${idx}`}
                          className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-2 rounded-lg border border-purple-200"
                        >
                          <svg
                            className="w-4 h-4 text-purple-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-semibold text-slate-700">
                            {att.label || "Attachment"}:
                          </span>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline truncate font-medium"
                          >
                            {att.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openDetails(a)}
                    className="mt-3 ml-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline"
                  >
                    <span>View details</span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border-2 border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isActiveReminder(selected) && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
                      🔔 Active Reminder
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                  {selected.title}
                </h3>
                {selected.remind_until && (
                  <p className="text-base text-slate-600 mt-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-slate-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">Deadline:</span>{" "}
                    {formatDateOnly(selected.remind_until)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelected(null);
                }}
                className="ml-4 flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
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

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                <p className="text-base text-slate-700 whitespace-pre-line leading-relaxed">
                  {selected.message}
                </p>
              </div>

              {Array.isArray(selected.attachments) &&
                selected.attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h4 className="text-base font-bold text-slate-900">
                        Attachments ({selected.attachments.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {selected.attachments.map((att, idx) => (
                        <a
                          key={`${att.url}-${idx}`}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-slate-900 truncate">
                              {att.label || "Attachment"}
                            </p>
                            <p className="text-sm font-semibold text-blue-600 group-hover:underline truncate">
                              {att.url}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-blue-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelected(null);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-base font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                Close
              </button>
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
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-pink-600 px-2.5 py-1 text-sm font-bold text-white shadow-md animate-pulse">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
      {label} left
    </span>
  );
}
