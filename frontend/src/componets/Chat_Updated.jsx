// frontend/src/components/Chat.jsx (Updated)
/**
 * Chat Component - Compact Sidebar with Feedback Icons
 * Reduced size with feedback system
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Settings,
  Download,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Minimize2,
  Maximize2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import ChatbotSettings from "../components/ChatbotSettings";
import { useSettings } from "../context/SettingsContext";
import { useUserContext } from "../context/UserContext";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMenuOpen, setShowMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedback, setFeedback] = useState({});
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { settings, updateSettings } = useSettings();
  const { user } = useUserContext();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
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

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = (messageId, type) => {
    setFeedback((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type,
    }));
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
    <div
      className="fixed right-0 top-20 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-lg z-40 transition-all duration-300 overflow-hidden"
      style={{
        transform: isMinimized ? "translateX(100%)" : "translateX(0)",
        width: isMinimized ? "0" : "20rem",
        height: "70vh",
        willChange: "transform",
      }}
    >
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-3 py-2 text-white flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
            🤖
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold truncate">AcademiGuard</h1>
            <p className="text-xs opacity-80 capitalize truncate">
              {settings.responseMode}
            </p>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => setMessages([])}
            className="p-2 hover:bg-blue-400 rounded-lg transition"
            title="New chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-blue-400 rounded-lg transition"
            title="Minimize"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenuOpen(!showMenuOpen)}
              className="p-2 hover:bg-blue-400 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={() => {
                    exportChat();
                    setShowMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg text-xs text-gray-900 dark:text-white"
                >
                  📥 Export
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    setShowMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs text-gray-900 dark:text-white"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => {
                    setMessages([]);
                    setShowMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg text-red-600 dark:text-red-400 text-xs"
                >
                  🗑️ Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-styled min-h-0"
        style={{
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="w-full px-2 py-2 space-y-1.5 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center flex-1 min-h-56 text-center">
              <div>
                <div className="text-3xl mb-1">👋</div>
                <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                  Welcome!
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Ask anything about studies.
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setInput("What is the plagiarism policy?")}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    📚 Policies
                  </button>
                  <button
                    onClick={() => setInput("When is the next exam?")}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                  >
                    📅 Exams
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-1.5 ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  } animate-fadeIn`}
                >
                  <div className="flex-shrink-0">
                    {message.sender === "user" ? (
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {user?.displayName?.charAt(0) || "U"}
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        A
                      </div>
                    )}
                  </div>

                  <div className="flex-1 max-w-xs">
                    <div
                      className={`px-2 py-1.5 rounded-lg text-xs leading-relaxed break-words group relative ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>

                      {message.sender === "bot" && (
                        <div className="flex gap-0.5 mt-1.5 pt-1 border-t border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyMessage(message.text)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition text-xs"
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, "up")}
                            className={`p-1 rounded transition text-xs ${
                              feedback[message.id] === "up"
                                ? "bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, "down")}
                            className={`p-1 rounded transition text-xs ${
                              feedback[message.id] === "down"
                                ? "bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300"
                                : "hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p
                      className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5 px-1 ${
                        message.sender === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-1.5 animate-fadeIn">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      A
                    </div>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <div className="px-2 py-1.5 rounded-lg rounded-bl-none bg-gray-100 dark:bg-gray-700">
                      <div className="flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex-shrink-0 shadow-md">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" &&
              !loading &&
              input.trim() &&
              handleSendMessage()
            }
            placeholder="Ask..."
            className="flex-1 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-400 shadow-md hover:shadow-lg"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
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
