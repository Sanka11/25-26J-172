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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Announcements management
          </h3>
          <p className="text-xs text-slate-500">
            Create, edit and highlight important announcements for your
            students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + New announcement
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingId ? "Edit announcement" : "Create announcement"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fill in the announcement details, optional attachments and an
                  optional reminder deadline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 bg-slate-50"
                  placeholder="e.g. Midterm exam schedule"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 bg-slate-50 resize-none"
                  placeholder="Write the full announcement text here..."
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-700">
                  Attachments
                </p>
                <p className="text-[11px] text-slate-500">
                  Optional links to documents or resources (e.g. PDF, Google
                  Drive, external pages).
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <input
                    type="text"
                    value={attachmentLabel}
                    onChange={(e) => setAttachmentLabel(e.target.value)}
                    className="flex-1 min-w-[120px] rounded-md border border-slate-200 px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500/70"
                    placeholder="Link label (e.g. 'Exam guide')"
                  />
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="flex-[2] min-w-[160px] rounded-md border border-slate-200 px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500/70"
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
                    className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1 text-[11px] font-medium text-white shadow-sm hover:bg-slate-900"
                  >
                    Add link
                  </button>
                </div>
                {fieldErrors.attachments && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {fieldErrors.attachments}
                  </p>
                )}
                {attachments.length > 0 && (
                  <ul className="mt-1 space-y-1 text-[11px] text-slate-700">
                    {attachments.map((att, idx) => (
                      <li
                        key={`${att.url}-${idx}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 truncate flex items-center gap-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full bg-slate-400"
                            aria-hidden="true"
                          />
                          <span className="font-medium">
                            {att.label || "Link"}
                          </span>
                          <span className="mx-1 text-slate-400">·</span>
                          <span className="text-slate-500 truncate">
                            {att.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-[10px] text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={remind}
                    onChange={(e) => setRemind(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Highlight this as a reminder for students</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-600">
                      Reminder deadline (date & time):
                    </span>
                    <input
                      type="datetime-local"
                      value={remindUntil}
                      onChange={(e) => setRemindUntil(e.target.value)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500/70"
                    />
                    {fieldErrors.remindUntil && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {fieldErrors.remindUntil}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setIsModalOpen(false);
                        }}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting
                        ? "Saving..."
                        : editingId
                        ? "Update announcement"
                        : "Save announcement"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/70 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            All announcements
          </h3>
          {loading && (
            <span className="text-[11px] text-slate-400">Loading...</span>
          )}
        </div>

        {announcements.length === 0 && !loading ? (
          <p className="text-xs text-slate-500">No announcements yet.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto text-xs">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50/80 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {a.title}
                    </p>
                    {a.remind_until && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Deadline: {formatTimestamp(a.remind_until)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.remind && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                        Reminder on
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(a)}
                      className="text-[10px] text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="text-[10px] text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 leading-snug line-clamp-2">
                  {a.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
