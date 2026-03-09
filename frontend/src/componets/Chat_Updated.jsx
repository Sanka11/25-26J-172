// frontend/src/components/Chat.jsx (Updated)
/**
 * Chat Component - Updated with Settings Integration
 * Includes Settings icon and panel
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, Settings, Download, MoreVertical } from "lucide-react";
import ChatbotSettings from "../components/ChatbotSettings";
import { useSettings } from "../context/SettingsContext";
import { useUserContext } from "../context/UserContext";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMenuOpen, setShowMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const { settings, updateSettings } = useSettings();
  const { user } = useUserContext();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    loadChatHistory();
  }, [user]);

  const loadChatHistory = async () => {
    try {
      // Load chat history from backend
      // Implementation depends on your backend
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send message with selected response mode
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          question: userMessage.text,
          responseMode: settings.responseMode,
          userId: user.uid,
          userPreferences: {
            theme: settings.theme,
            responseLength: settings.responseLength,
          },
        }),
      });

      const data = await response.json();

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        text: data.answer,
        sender: "bot",
        timestamp: new Date(),
        source: data.answer_source || "document",
        sources: data.sources || [],
        webSources: data.web_sources || [],
      };

      setMessages((prev) => [...prev, botMessage]);

      // Trigger reminders if applicable
      if (data.reminders && data.reminders.length > 0) {
        triggerReminders(data.reminders);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const triggerReminders = (reminders) => {
    reminders.forEach((reminder) => {
      // Show reminder notification
      if (Notification.permission === "granted") {
        new Notification("Academic Reminder", {
          body: reminder.message,
          icon: "/logo.png",
        });
      }
    });
  };

  const exportChat = async () => {
    try {
      const response = await fetch(`/api/chat-history/${user.uid}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

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
      console.error("Error exporting chat:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              AcademiGuard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mode:{" "}
              <span className="font-semibold capitalize">
                {settings.responseMode}
              </span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            onClick={exportChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Export chat history"
          >
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Open settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowMenuOpen(!showMenuOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {showMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={() => {
                    exportChat();
                    setShowMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  📥 Export Chat
                </button>
                <button
                  onClick={() => {
                    setMessages([]);
                    setShowMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg text-red-600 dark:text-red-400"
                >
                  🗑️ Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to AcademiGuard!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                I'm an intelligent academic assistant. Ask me about university
                policies, deadlines, assignments, or general academic topics.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setInput("What is the plagiarism policy?")}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                >
                  📚 Plagiarism Policy
                </button>
                <button
                  onClick={() => setInput("When is the next exam?")}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                >
                  📅 Exam Schedule
                </button>
                <button
                  onClick={() => setInput("How do I register for modules?")}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-800 transition"
                >
                  📝 Module Registration
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.sender === "bot" && message.source && (
                  <p className="text-xs mt-2 opacity-70">
                    Source:{" "}
                    {message.source === "web_search" ? "🌐 Web" : "📄 Document"}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me a question..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <ChatbotSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={updateSettings}
      />
    </div>
  );
};

export default Chat;
