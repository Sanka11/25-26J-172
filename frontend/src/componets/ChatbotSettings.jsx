// frontend/src/components/ChatbotSettings.jsx
/**
 * ChatbotSettings Component
 * Comprehensive settings panel for chatbot configuration
 * Features: Response Mode, Notifications, Appearance, Chat Management
 */

import React, { useState, useEffect } from "react";
import { X, Download, Trash2, Check } from "lucide-react";
import { useUserContext } from "../context/UserContext";
import { settingsService } from "../services/settingsService";

const ChatbotSettings = ({ isOpen, onClose, onSettingsChange }) => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState("response-mode");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // State for Response Mode
  const [responseMode, setResponseMode] = useState("hybrid");

  // State for Notifications
  const [notifications, setNotifications] = useState({
    examReminders: true,
    attendanceWarnings: true,
    assignmentDeadlines: true,
    paymentNotifications: true,
  });

  // State for Appearance
  const [theme, setTheme] = useState("dark");
  const [responseLength, setResponseLength] = useState("balanced");

  // State for Advanced Settings
  const [includeWebResults, setIncludeWebResults] = useState(true);
  const [autoSuggest, setAutoSuggest] = useState(true);

  // Load settings on mount
  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  // Load settings from backend/localStorage
  const loadSettings = async () => {
    try {
      const settings = await settingsService.getUserSettings(user.uid);
      if (settings) {
        setResponseMode(settings.responseMode || "hybrid");
        setNotifications(settings.notifications || notifications);
        setTheme(settings.theme || "dark");
        setResponseLength(settings.responseLength || "balanced");
        setIncludeWebResults(settings.includeWebResults !== false);
        setAutoSuggest(settings.autoSuggest !== false);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setLoading(true);
    try {
      const settingsData = {
        responseMode,
        notifications,
        theme,
        responseLength,
        includeWebResults,
        autoSuggest,
      };

      await settingsService.saveUserSettings(user.uid, settingsData);

      // Apply theme immediately
      applyTheme(theme);

      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange(settingsData);
      }

      // Show success status
      setSaveStatus("Settings saved successfully!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // Apply theme to document
  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    if (selectedTheme === "light") {
      root.classList.remove("dark");
    } else if (selectedTheme === "dark") {
      root.classList.add("dark");
    } else {
      // System default
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    localStorage.setItem("chatbot-theme", selectedTheme);
  };

  // Handle notification toggle
  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Export chat history
  const exportChatHistory = async () => {
    try {
      setLoading(true);
      const data = await settingsService.exportChatHistory(user.uid);

      // Create download
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," +
          encodeURIComponent(JSON.stringify(data, null, 2)),
      );
      element.setAttribute(
        "download",
        `chat-history-${new Date().toISOString().slice(0, 10)}.json`,
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Error exporting chat history:", error);
      setSaveStatus("Failed to export chat history");
    } finally {
      setLoading(false);
    }
  };

  // Clear chat history
  const clearChatHistory = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all chat history? This action cannot be undone.",
      )
    ) {
      try {
        setLoading(true);
        await settingsService.clearChatHistory(user.uid);
        setSaveStatus("Chat history cleared successfully!");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (error) {
        console.error("Error clearing chat history:", error);
        setSaveStatus("Failed to clear chat history");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⚙️ Chatbot Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {[
            { id: "response-mode", label: "🤖 Response Mode", icon: "🤖" },
            { id: "notifications", label: "🔔 Notifications", icon: "🔔" },
            { id: "appearance", label: "🎨 Appearance", icon: "🎨" },
            { id: "data", label: "💾 Data", icon: "💾" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Response Mode Tab */}
          {activeTab === "response-mode" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Select Response Mode
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Choose how the chatbot retrieves information to answer your
                  questions.
                </p>

                <div className="space-y-3">
                  {/* Document Mode */}
                  <label
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    style={{
                      borderColor:
                        responseMode === "document" ? "#3b82f6" : "#e5e7eb",
                    }}
                  >
                    <input
                      type="radio"
                      name="response-mode"
                      value="document"
                      checked={responseMode === "document"}
                      onChange={() => setResponseMode("document")}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        📄 Document Mode
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Answers only from university PDF documents. Most
                        reliable for institutional information.
                      </p>
                    </div>
                  </label>

                  {/* Web Mode */}
                  <label
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    style={{
                      borderColor:
                        responseMode === "web" ? "#3b82f6" : "#e5e7eb",
                    }}
                  >
                    <input
                      type="radio"
                      name="response-mode"
                      value="web"
                      checked={responseMode === "web"}
                      onChange={() => setResponseMode("web")}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        🌐 Web Mode
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Answers from web search only. Best for general knowledge
                        and current information.
                      </p>
                    </div>
                  </label>

                  {/* Hybrid Mode */}
                  <label
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    style={{
                      borderColor:
                        responseMode === "hybrid" ? "#3b82f6" : "#e5e7eb",
                    }}
                  >
                    <input
                      type="radio"
                      name="response-mode"
                      value="hybrid"
                      checked={responseMode === "hybrid"}
                      onChange={() => setResponseMode("hybrid")}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        🤖 Hybrid Mode (Recommended)
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Searches PDFs first, then falls back to web search if
                        needed. Best of both worlds.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Advanced Options
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeWebResults}
                      onChange={() => setIncludeWebResults(!includeWebResults)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="ml-3 text-gray-900 dark:text-white">
                      Include web results in hybrid mode
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoSuggest}
                      onChange={() => setAutoSuggest(!autoSuggest)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="ml-3 text-gray-900 dark:text-white">
                      Enable auto-suggestions based on context
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Notification Preferences
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Control which academic alerts you receive from the chatbot.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      key: "examReminders",
                      label: "📚 Exam Reminders",
                      description:
                        "Get notified 7 days, 2 days, and 1 day before exams",
                    },
                    {
                      key: "attendanceWarnings",
                      label: "📍 Attendance Warnings",
                      description:
                        "Get alerted when attendance drops below 75%",
                    },
                    {
                      key: "assignmentDeadlines",
                      label: "✏️ Assignment Deadlines",
                      description:
                        "Reminders for upcoming assignment submissions",
                    },
                    {
                      key: "paymentNotifications",
                      label: "💳 Payment Notifications",
                      description: "Alerts for payment deadlines and invoices",
                    },
                  ].map((notif) => (
                    <div
                      key={notif.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {notif.label}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notif.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleNotification(notif.key)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                          notifications[notif.key]
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                            notifications[notif.key]
                              ? "translate-x-7"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Theme Selection
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Choose your preferred visual theme.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "light", label: "☀️ Light Mode", icon: "☀️" },
                    { value: "dark", label: "🌙 Dark Mode", icon: "🌙" },
                    { value: "system", label: "⚙️ System Default", icon: "⚙️" },
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value)}
                      className={`p-4 rounded-lg border-2 transition ${
                        theme === themeOption.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{themeOption.icon}</div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {themeOption.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Response Format
                </h4>

                <div className="space-y-2">
                  {[
                    { value: "brief", label: "Brief (1-2 sentences)" },
                    { value: "balanced", label: "Balanced (2-4 sentences)" },
                    { value: "detailed", label: "Detailed (4+ sentences)" },
                  ].map((format) => (
                    <label key={format.value} className="flex items-center">
                      <input
                        type="radio"
                        name="response-length"
                        value={format.value}
                        checked={responseLength === format.value}
                        onChange={() => setResponseLength(format.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 text-gray-900 dark:text-white">
                        {format.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Chat Data Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Export or clear your chat history and personal data.
                </p>

                <div className="space-y-3">
                  {/* Export Chat History */}
                  <button
                    onClick={exportChatHistory}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Export Chat History
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Download your chat conversations as JSON
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl">📥</span>
                  </button>

                  {/* Clear Chat History */}
                  <button
                    onClick={clearChatHistory}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Clear Chat History
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Permanently delete all conversations
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl">🗑️</span>
                  </button>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  🔒 Privacy Notice
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your chat history and personal settings are stored securely
                  according to our privacy policy. Clearing data is irreversible
                  and affects only your local account.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          {saveStatus && (
            <div className="flex items-center text-sm font-medium">
              {saveStatus.includes("successfully") ? (
                <>
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-600 dark:text-green-400">
                    {saveStatus}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-red-600 dark:text-red-400">
                    {saveStatus}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSettings;
