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
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReminders, setFilterReminders] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showReport, setShowReport] = useState(false);

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

    if (remind && remindUntil) {
      const selectedDate = new Date(remindUntil);
      const now = new Date();
      if (selectedDate < now) {
        newFieldErrors.remindUntil =
          "Reminder deadline cannot be in the past. Please select a future date and time.";
      }
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
        setSuccessMessage("Announcement updated successfully");
      } else {
        await createAnnouncement(payload);
        setSuccessMessage("Announcement created successfully");
      }
      setTimeout(() => setSuccessMessage(""), 4000);
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
    try {
      setError("");
      await deleteAnnouncement(id);
      setSuccessMessage("Announcement deleted successfully");
      setTimeout(() => setSuccessMessage(""), 4000);
      await loadAnnouncements();
      setDeleteConfirmId(null);
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

  const exportReport = (format) => {
    if (format === "csv") {
      // Create CSV content
      const headers = [
        "Title",
        "Type",
        "Created Date",
        "Reminder Until",
        "Resources Count",
      ];
      const rows = announcements.map((a) => [
        `"${a.title.replace(/"/g, '""')}"`,
        a.remind ? "Reminder" : "Standard",
        new Date(
          a.created_at?.seconds ? a.created_at.seconds * 1000 : a.created_at,
        ).toLocaleDateString(),
        a.remindUntil
          ? new Date(
              a.remindUntil?.seconds
                ? a.remindUntil.seconds * 1000
                : a.remindUntil,
            ).toLocaleDateString()
          : "N/A",
        a.attachments?.length || 0,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `announcements-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      // For PDF, we'll use a simple approach with print styles
      const printWindow = window.open("", "", "width=800,height=600");
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Announcements & Reminders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
            h2 { color: #6366f1; margin-top: 30px; border-left: 4px solid #6366f1; padding-left: 10px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .stat-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-number { font-size: 28px; font-weight: bold; color: #7c3aed; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .reminder-badge { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .insight { background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 10px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <h1>📊 Announcements & Reminders Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>

          <h2>Summary Statistics</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-number">${announcements.length}</div>
              <div class="stat-label">Total Announcements</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${announcements.filter((a) => a.remind).length}</div>
              <div class="stat-label">Active Reminders</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${announcements.filter((a) => a.attachments?.length > 0).length}</div>
              <div class="stat-label">With Attachments</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${announcements.length > 0 ? Math.round((announcements.filter((a) => a.message && a.title).length / announcements.length) * 100) : 0}%</div>
              <div class="stat-label">Completion Rate</div>
            </div>
          </div>

          <h2>Detailed Breakdown</h2>
          <p><strong>Reminders:</strong> ${announcements.filter((a) => a.remind).length} (${announcements.length > 0 ? Math.round((announcements.filter((a) => a.remind).length / announcements.length) * 100) : 0}%)</p>
          <p><strong>Standard:</strong> ${announcements.filter((a) => !a.remind).length} (${announcements.length > 0 ? Math.round((announcements.filter((a) => !a.remind).length / announcements.length) * 100) : 0}%)</p>
          <p><strong>With Resources:</strong> ${announcements.filter((a) => a.attachments?.length > 0).length} (${announcements.length > 0 ? Math.round((announcements.filter((a) => a.attachments?.length > 0).length / announcements.length) * 100) : 0}%)</p>

          <h2>All Announcements</h2>
          <table>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Created</th>
              <th>Resources</th>
            </tr>
            ${announcements
              .map(
                (a) => `
              <tr>
                <td>${a.title}</td>
                <td>${a.remind ? '<span class="reminder-badge">Reminder</span>' : "Standard"}</td>
                <td>${new Date(a.created_at?.seconds ? a.created_at.seconds * 1000 : a.created_at).toLocaleDateString()}</td>
                <td>${a.attachments?.length || 0}</td>
              </tr>
            `,
              )
              .join("")}
          </table>

          <h2>Key Insights</h2>
          <div class="insight">
            <strong>✓ Announcement Activity</strong><br/>
            You have ${announcements.length} announcements in total, with ${announcements.filter((a) => a.remind).length} marked as reminders for students.
          </div>
          <div class="insight">
            <strong>✓ Resource Coverage</strong><br/>
            ${Math.round((announcements.filter((a) => a.attachments?.length > 0).length / (announcements.length || 1)) * 100)}% of your announcements include helpful resources or references for students.
          </div>

          <div class="footer">
            <p>This report was automatically generated from your announcements and reminders data.</p>
          </div>
        </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-2 sm:px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-sm border-l-4 border-green-500 shadow-lg animate-slide-down">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-green-800">
                {successMessage}
              </span>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
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
                  Announcements & Reminders
                </h1>
                <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                  Manage announcements and reminders to keep students informed
                  about important deadlines and events
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Generate Report</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
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
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">
                    Total Announcements
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {announcements.length}
                  </p>
                </div>
                <div className="rounded-full bg-blue-50 p-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
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
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">
                    Active Reminders
                  </p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {announcements.filter((a) => a.remind).length}
                  </p>
                </div>
                <div className="rounded-full bg-amber-50 p-3">
                  <svg
                    className="w-6 h-6 text-amber-600"
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
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">
                    With Attachments
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {
                      announcements.filter((a) => a.attachments?.length > 0)
                        .length
                    }
                  </p>
                </div>
                <div className="rounded-full bg-indigo-50 p-3">
                  <svg
                    className="w-6 h-6 text-indigo-600"
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
                </div>
              </div>
            </div>
          </div>
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
                      min={new Date().toISOString().slice(0, 16)}
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

        {/* Announcements List Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search announcements by title or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-200 pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={filterReminders}
              onChange={(e) => setFilterReminders(e.target.value)}
              className="rounded-lg border-2 border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            >
              <option value="all">All Announcements</option>
              <option value="reminders">Reminders Only</option>
              <option value="standard">Standard Only</option>
            </select>
          </div>

          {/* List Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
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
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  All Announcements
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {announcements.length === 0
                    ? "No announcements"
                    : `${announcements.length} total`}
                </p>
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
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
                Refreshing...
              </div>
            )}
          </div>

          {/* Announcements Grid */}
          {announcements.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-slate-400"
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
              <p className="text-lg text-slate-600 font-semibold">
                No announcements yet
              </p>
              <p className="text-sm text-slate-500 mt-2 mb-5">
                Create your first announcement to keep students informed about
                important information
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create First Announcement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements
                .filter((a) => {
                  const matchesSearch =
                    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.message.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesFilter =
                    filterReminders === "all" ||
                    (filterReminders === "reminders" && a.remind) ||
                    (filterReminders === "standard" && !a.remind);
                  return matchesSearch && matchesFilter;
                })
                .map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border-2 border-slate-200 p-6 bg-gradient-to-br from-slate-50 to-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {a.remind && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 border border-amber-300 shadow-sm">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                              </svg>
                              REMINDER
                            </span>
                          )}
                          {a.attachments && a.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                              <svg
                                className="w-3.5 h-3.5"
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
                              {a.attachments.length}{" "}
                              {a.attachments.length === 1 ? "Link" : "Links"}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                          {a.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                          {a.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Created{" "}
                            {formatTimestamp(a.created_at).split(",")[0]}
                          </div>
                          {a.remind_until && (
                            <div className="flex items-center gap-1.5">
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
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEdit(a)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
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
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(a.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 border border-red-200 transition-all duration-200"
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
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-6">
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Delete Announcement?
            </h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              This action cannot be undone. The announcement will be permanently
              deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border-2 border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border-2 border-slate-200">
            {/* Report Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 md:px-8 py-6 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Announcements & Reminders Report
                  </h2>
                  <p className="text-sm text-purple-100 mt-1">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReport(false)}
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/20 transition-colors"
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

            {/* Report Content */}
            <div className="p-6 md:p-8 space-y-8">
              {/* Summary Statistics */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded"></span>
                  Summary Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-blue-50 p-5 border border-blue-200">
                    <p className="text-sm text-slate-600 font-medium">
                      Total Announcements
                    </p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {announcements.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-5 border border-amber-200">
                    <p className="text-sm text-slate-600 font-medium">
                      Active Reminders
                    </p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">
                      {announcements.filter((a) => a.remind).length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 p-5 border border-indigo-200">
                    <p className="text-sm text-slate-600 font-medium">
                      With Attachments
                    </p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">
                      {
                        announcements.filter((a) => a.attachments?.length > 0)
                          .length
                      }
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-5 border border-green-200">
                    <p className="text-sm text-slate-600 font-medium">
                      Completion Rate
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {announcements.length > 0
                        ? Math.round(
                            (announcements.filter((a) => a.message && a.title)
                              .length /
                              announcements.length) *
                              100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded"></span>
                  Detailed Breakdown
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Reminders vs Standard */}
                  <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">
                      Announcement Types
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Reminders
                          </span>
                          <span className="text-sm font-bold text-amber-600">
                            {announcements.filter((a) => a.remind).length}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all"
                            style={{
                              width:
                                announcements.length > 0
                                  ? `${(announcements.filter((a) => a.remind).length / announcements.length) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Standard
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {announcements.filter((a) => !a.remind).length}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width:
                                announcements.length > 0
                                  ? `${(announcements.filter((a) => !a.remind).length / announcements.length) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resource Distribution */}
                  <div className="rounded-xl bg-slate-50 p-6 border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">
                      Resource Distribution
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            With Resources
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {
                              announcements.filter(
                                (a) => a.attachments?.length > 0,
                              ).length
                            }
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                            style={{
                              width:
                                announcements.length > 0
                                  ? `${(announcements.filter((a) => a.attachments?.length > 0).length / announcements.length) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Without Resources
                          </span>
                          <span className="text-sm font-bold text-slate-600">
                            {
                              announcements.filter(
                                (a) =>
                                  !a.attachments || a.attachments.length === 0,
                              ).length
                            }
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-slate-400 to-slate-600 h-2 rounded-full transition-all"
                            style={{
                              width:
                                announcements.length > 0
                                  ? `${(announcements.filter((a) => !a.attachments || a.attachments.length === 0).length / announcements.length) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded"></span>
                  Key Insights
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-blue-900">
                        Announcement Activity
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        You have {announcements.length} announcements in total,
                        with {announcements.filter((a) => a.remind).length}{" "}
                        marked as reminders for students.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-green-900">
                        Resource Coverage
                      </p>
                      <p className="text-sm text-green-800 mt-1">
                        {Math.round(
                          (announcements.filter(
                            (a) => a.attachments?.length > 0,
                          ).length /
                            (announcements.length || 1)) *
                            100,
                        )}
                        % of your announcements include helpful resources or
                        references for students.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 border-l-4 border-purple-500">
                    <svg
                      className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 01-2-2V3a1 1 0 00-1-1H6a1 1 0 00-1 1v2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-purple-900">
                        Recommendation
                      </p>
                      <p className="text-sm text-purple-800 mt-1">
                        {announcements.length === 0
                          ? "Start creating announcements to keep students informed about important updates and deadlines."
                          : announcements.filter(
                                (a) => a.attachments?.length > 0,
                              ).length <
                              announcements.length / 2
                            ? "Consider adding more resources to your announcements for better student engagement."
                            : "Great job! Your announcements are well-structured with good resource coverage."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Announcements Preview */}
              {announcements.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded"></span>
                    Recent Announcements (Last 5)
                  </h3>
                  <div className="space-y-3">
                    {announcements.slice(0, 5).map((a, idx) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900 truncate">
                                {a.title}
                              </p>
                              {a.remind && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                  </svg>
                                  Reminder
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-1">
                              {a.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {formatTimestamp(a.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Export Report
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => exportReport("pdf")}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 border-2 border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0z" />
                      <path
                        fillRule="evenodd"
                        d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 1h4v8H8V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Export as PDF
                  </button>
                  <button
                    onClick={() => exportReport("csv")}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-50 border-2 border-green-200 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                      <path
                        fillRule="evenodd"
                        d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Export as CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-50 border-2 border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all"
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
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2a2 2 0 00-2-2zm0 0h6"
                      />
                    </svg>
                    Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
