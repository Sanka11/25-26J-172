import { useEffect, useState } from "react";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api/announcementApi";

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [remind, setRemind] = useState(false);
  const [remindUntil, setRemindUntil] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAnnouncements = async () => {
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

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setRemind(false);
    setRemindUntil("");
    setAttachments([]);
    setAttachmentLabel("");
    setAttachmentUrl("");
    setEditingId(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newFieldErrors = {};

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      newFieldErrors.title = "Title is required.";
    } else if (trimmedTitle.length < 3) {
      newFieldErrors.title = "Title must be at least 3 characters.";
    } else if (trimmedTitle.length > 120) {
      newFieldErrors.title = "Title must be 120 characters or fewer.";
    }

    if (!trimmedMessage) {
      newFieldErrors.message = "Message is required.";
    } else if (trimmedMessage.length < 10) {
      newFieldErrors.message = "Message must be at least 10 characters.";
    } else if (trimmedMessage.length > 2000) {
      newFieldErrors.message = "Message must be 2000 characters or fewer.";
    }

    if (remind && !remindUntil) {
      newFieldErrors.remindUntil =
        "Please select a reminder deadline (date and time) when enabling reminders.";
    }

    if (attachmentUrl.trim() || attachmentLabel.trim()) {
      // Encourage clicking "Add" instead of leaving partially filled row
      newFieldErrors.attachments =
        "Click 'Add link' to attach this link or clear the fields.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setError("");

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        title: trimmedTitle,
        message: trimmedMessage,
        remind,
        remind_until: remindUntil || null,
        attachments,
      };
      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement(payload);
      }
      resetForm();
      setIsModalOpen(false);
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
      setError("Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (a) => {
    setTitle(a.title || "");
    setMessage(a.message || "");
    setRemind(Boolean(a.remind));
    if (a.remind_until) {
      setRemindUntil(toDateTimeInputValue(a.remind_until));
    } else {
      setRemindUntil("");
    }
    setAttachments(Array.isArray(a.attachments) ? a.attachments : []);
    setAttachmentLabel("");
    setAttachmentUrl("");
    setFieldErrors({});
    setEditingId(a.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      setError("");
      await deleteAnnouncement(id);
      await loadAnnouncements();
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete announcement");
    }
  };

  const formatTimestamp = (ts) => {
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
      return date.toLocaleString();
    } catch {
      return "";
    }
  };

  const toDateTimeInputValue = (ts) => {
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
      const iso = date.toISOString();
      return iso.slice(0, 16);
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 sm:px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Manage Announcements
              </h1>
              <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                Create and manage announcements to keep students informed about
                critical deadlines, exam dates, and policy changes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Announcement</span>
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border-2 border-slate-200 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {editingId
                        ? "Edit Announcement"
                        : "Create New Announcement"}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Fill in the details below to{" "}
                      {editingId ? "update" : "create"} an announcement for
                      students
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border-l-4 border-red-500 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Announcement Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                    placeholder="e.g., Midterm Exam Schedule Released"
                  />
                  {fieldErrors.title && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {fieldErrors.title}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Message Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none transition-all"
                    placeholder="Write the complete announcement message here..."
                  />
                  {fieldErrors.message && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <div>
                      <p className="text-base font-semibold text-slate-800">
                        Attachments
                      </p>
                      <p className="text-sm text-slate-500">
                        Optional links to documents or resources (PDF, Google
                        Drive, etc.)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      value={attachmentLabel}
                      onChange={(e) => setAttachmentLabel(e.target.value)}
                      className="flex-1 min-w-[140px] rounded-lg border-2 border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Link label (e.g. 'Exam guide')"
                    />
                    <input
                      type="url"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="flex-[2] min-w-[200px] rounded-lg border-2 border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = attachmentUrl.trim();
                        const label = attachmentLabel.trim();
                        if (!url) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            attachments: "URL is required to add a link.",
                          }));
                          return;
                        }
                        try {
                          // Basic URL validation
                          // eslint-disable-next-line no-new
                          new URL(url);
                        } catch {
                          setFieldErrors((prev) => ({
                            ...prev,
                            attachments:
                              "Please enter a valid URL (starting with http or https).",
                          }));
                          return;
                        }
                        setAttachments((prev) => [
                          ...prev,
                          { label: label || null, url },
                        ]);
                        setAttachmentLabel("");
                        setAttachmentUrl("");
                        setFieldErrors((prev) => ({
                          ...prev,
                          attachments: undefined,
                        }));
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Add Link
                    </button>
                  </div>

                  {fieldErrors.attachments && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {fieldErrors.attachments}
                    </p>
                  )}

                  {attachments.length > 0 && (
                    <ul className="space-y-2">
                      {attachments.map((att, idx) => (
                        <li
                          key={`${att.url}-${idx}`}
                          className="flex items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3"
                        >
                          <div className="min-w-0 flex items-center gap-3 flex-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-sm text-slate-800 block">
                                {att.label || "Link"}
                              </span>
                              <span className="text-sm text-slate-500 truncate block">
                                {att.url}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 hover:bg-red-50 rounded-md transition-all"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Reminder Settings */}
                <div className="bg-amber-50 rounded-xl p-5 space-y-4 border border-amber-200">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-amber-600"
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
                    <p className="text-base font-semibold text-slate-800">
                      Reminder Settings
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remind}
                      onChange={(e) => setRemind(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-amber-300 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Highlight this as a reminder for students
                    </span>
                  </label>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Reminder Deadline (Date & Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={remindUntil}
                      onChange={(e) => setRemindUntil(e.target.value)}
                      className="w-full rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                    {fieldErrors.remindUntil && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {fieldErrors.remindUntil}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all"
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
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-base font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5"
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {editingId
                          ? "Update Announcement"
                          : "Save Announcement"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                All Announcements
              </h3>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg
                  className="animate-spin w-4 h-4"
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
                Loading...
              </div>
            )}
          </div>

          {announcements.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-base text-slate-600 font-medium">
                No announcements yet
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Create your first announcement to keep students informed
              </p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border-2 border-slate-200 p-5 bg-gradient-to-br from-slate-50 to-white hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {a.remind && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 border border-amber-300 shadow-sm">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            Reminder
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-lg text-slate-900 mb-1">
                        {a.title}
                      </p>
                      {a.remind_until && (
                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Deadline: {formatTimestamp(a.remind_until)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(a)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition-all"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm transition-all"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed line-clamp-3">
                    {a.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
