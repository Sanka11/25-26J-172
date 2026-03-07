import React, { useEffect, useRef, useState } from "react";
import { appConfig } from "../config/env";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import FeedbackModal from "./FeedbackModal";
import { chatHistoryService } from "../services/chatHistoryService";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

// Configure PDF.js worker from npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).href;

const PERFORMANCE_THRESHOLDS = {
  assignments_avg: 50,
  attendance_pct: 70,
  midterm_score: 50,
  projects_score: 50,
  quizzes_avg: 50,
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildInterventionFromMetrics = (metrics) => {
  console.log("[CLASSIFICATION] Input metrics:", metrics);
  console.log("[CLASSIFICATION] Thresholds:", PERFORMANCE_THRESHOLDS);

  const belowThreshold = Object.entries(PERFORMANCE_THRESHOLDS)
    .filter(([metric, threshold]) => {
      const metricValue = toNumber(metrics?.[metric]);
      const isBelow = metricValue < threshold;
      console.log(
        `[CLASSIFICATION] ${metric}: ${metricValue} < ${threshold} = ${isBelow}`,
      );
      return isBelow;
    })
    .map(([metric]) => metric);

  console.log(
    `[CLASSIFICATION] Below threshold count: ${belowThreshold.length}`,
    belowThreshold,
  );

  if (belowThreshold.length === 0) {
    console.log("[CLASSIFICATION] Result: HIGH PERFORMANCE");
    return {
      classification: "HIGH PERFORMANCE",
      reminderText:
        "- Excellent work! Your academic performance is strong.\n- Your attendance and assignment scores are very good. Keep maintaining this performance.\n- You are doing great in your coursework. Continue your effort.",
    };
  }

  if (belowThreshold.length <= 2) {
    console.log("[CLASSIFICATION] Result: MEDIUM PERFORMANCE");
    return {
      classification: "MEDIUM PERFORMANCE",
      reminderText:
        "- Your academic performance is moderate.\n- Consider improving your assignment participation and reviewing lecture materials regularly.",
    };
  }

  const reminders = [];
  if (belowThreshold.includes("attendance_pct")) {
    reminders.push(
      "Your attendance percentage is currently below the recommended level. Regular attendance significantly improves academic success.",
    );
  }
  if (belowThreshold.includes("midterm_score")) {
    reminders.push(
      "Your Midterm score is below the expected level. Consider reviewing lecture slides and contacting your lecturer for additional support.",
    );
  }
  if (belowThreshold.includes("assignment_avg")) {
    reminders.push(
      "Your assignment average is low. Please ensure future submissions are completed before deadlines.",
    );
  }
  if (belowThreshold.includes("projects_score")) {
    reminders.push(
      "Your project score is below the expected level. Allocate more time for practical tasks.",
    );
  }
  if (belowThreshold.includes("quizzes_avg")) {
    reminders.push(
      "Your quiz average is low. Revise weekly topics and practice more quizzes.",
    );
  }

  const randomLowReminder =
    reminders[Math.floor(Math.random() * reminders.length)] ||
    "Some indicators need improvement. Stay consistent with lectures, coursework, and revision.";

  console.log("[CLASSIFICATION] Result: LOW PERFORMANCE");
  return {
    classification: "LOW PERFORMANCE",
    reminderText: `- ${randomLowReminder}`,
  };
};

export default function Chat({ onClose }) {
  const { currentUser, userData } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hi! I'm AcademiGuard, How can I help you today?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState("");
  const [typingState, setTypingState] = useState(null); // for word-by-word animation
  const [voiceListening, setVoiceListening] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const historyLoadedRef = useRef(false);
  const reminderLoadedRef = useRef(false);

  const resolveStudentId = () => {
    return (
      userData?.student_id ||
      userData?.studentId ||
      userData?.email ||
      currentUser?.email ||
      currentUser?.uid ||
      null
    );
  };

  const getStudentCandidates = () => {
    const primary = resolveStudentId();
    const candidates = [
      primary,
      userData?.student_id,
      userData?.studentId,
      currentUser?.uid,
      userData?.email,
      currentUser?.email,
      (userData?.email || currentUser?.email || "").split("@")[0],
    ]
      .map((v) => (typeof v === "string" ? v.trim() : v))
      .filter(Boolean);

    return Array.from(new Set(candidates));
  };

  const fetchStudentMetricsFromFirestore = async () => {
    const candidates = getStudentCandidates();
    if (candidates.length === 0) return null;

    console.log("[METRICS] Candidate IDs for lookup:", candidates);

    // 1) Direct document-id lookup.
    for (const candidate of candidates) {
      try {
        const snap = await getDoc(doc(db, "students", candidate));
        if (snap.exists()) {
          console.log(
            `[METRICS] Found student by doc ID: ${candidate}`,
            snap.data(),
          );
          return snap.data();
        }
      } catch (err) {
        console.log(
          `[METRICS] Doc ID lookup failed for ${candidate}:`,
          err.message,
        );
      }
    }

    // 2) Field lookups with case-insensitive email matching.
    for (const candidate of candidates) {
      const fieldLookups = ["student_id", "studentId", "email", "uid"];
      for (const field of fieldLookups) {
        try {
          const q = query(
            collection(db, "students"),
            where(field, "==", candidate),
            limit(1),
          );
          const qs = await getDocs(q);
          if (!qs.empty) {
            console.log(
              `[METRICS] Found student by field ${field}=${candidate}`,
              qs.docs[0].data(),
            );
            return qs.docs[0].data();
          }
        } catch (err) {
          console.log(
            `[METRICS] Field lookup failed for ${field}=${candidate}:`,
            err.message,
          );
        }
      }
    }

    // 3) Case-insensitive email lookup - scan all students
    if (userData?.email || currentUser?.email) {
      const userEmail = (
        userData?.email ||
        currentUser?.email ||
        ""
      ).toLowerCase();
      try {
        const q = query(collection(db, "students"), limit(300));
        const qs = await getDocs(q);
        for (const doc of qs.docs) {
          const docEmail = (doc.data().email || "").toLowerCase();
          if (docEmail === userEmail) {
            console.log(
              `[METRICS] Found student by case-insensitive email match: ${docEmail}`,
              doc.data(),
            );
            return doc.data();
          }
        }
      } catch (err) {
        console.log(
          "[METRICS] Case-insensitive email scan failed:",
          err.message,
        );
      }
    }

    console.log("[METRICS] No student record found in Firebase");
    return null;
  };

  // Load chat history from Firebase on mount (only once)
  useEffect(() => {
    if (historyLoadedRef.current) return; // Already loaded
    historyLoadedRef.current = true;

    const loadHistory = async () => {
      try {
        const savedMessages = await chatHistoryService.loadMessages();
        if (savedMessages.length > 0) {
          // Always show welcome message first, then previous messages
          const welcomeMsg = {
            id: "welcome",
            sender: "assistant",
            text: "Hi! I'm AcademiGuard, How can I help you today?",
            createdAt: new Date().toISOString(),
          };
          setMessages([welcomeMsg, ...savedMessages]);
          console.log("Loaded chat history from Firebase");
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, []);

  // Save messages to Firebase whenever they change (except initial load)
  useEffect(() => {
    if (!historyLoaded) return;

    // Save the last message if it's not the welcome message
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.id !== "welcome" &&
        lastMessage.text &&
        !lastMessage.isPersonalizedReminder &&
        !lastMessage.savedToFirebase
      ) {
        lastMessage.savedToFirebase = true; // Mark to avoid re-saving
        chatHistoryService.saveMessage(lastMessage).catch((err) => {
          console.error("Failed to save message:", err);
          lastMessage.savedToFirebase = false; // Reset on error
        });
      }
    }
  }, [messages, historyLoaded]);

  // Add personalized intervention reminder as the first dynamic message.
  useEffect(() => {
    if (!historyLoaded) return;
    if (reminderLoadedRef.current) return;

    const insertReminderMessage = (reminderMessage) => {
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m.isPersonalizedReminder);
        if (alreadyExists) return prev;

        const welcomeIndex = prev.findIndex((m) => m.id === "welcome");
        if (welcomeIndex === -1) {
          return [reminderMessage, ...prev];
        }

        const next = [...prev];
        next.splice(welcomeIndex + 1, 0, reminderMessage);
        return next;
      });
    };

    const addFallbackReminder = () => {
      const fallbackMessage = {
        id: `intervention-${Date.now()}`,
        sender: "assistant",
        text: "Your recent academic activity suggests there may be some areas for improvement. \n\n- Reviewing your lecture materials and improving your attendance and assignment participation can help you stay on track and enhance your performance.",
        createdAt: new Date().toISOString(),
        isPersonalizedReminder: true,
        classification: "GENERAL GUIDANCE",
      };
      insertReminderMessage(fallbackMessage);
    };

    const studentId = resolveStudentId();
    if (!studentId) {
      addFallbackReminder();
      reminderLoadedRef.current = true;
      return;
    }

    const loadReminder = async () => {
      try {
        console.log(
          `[REMINDER] Fetching from API: ${appConfig.ML_INTERVENTION_REMINDER_URL}/${encodeURIComponent(studentId)}`,
        );
        const res = await fetch(
          `${appConfig.ML_INTERVENTION_REMINDER_URL}/${encodeURIComponent(studentId)}`,
        );

        if (!res.ok) {
          console.log(
            `[REMINDER] API returned status ${res.status}, falling back to Firebase`,
          );
          const localMetrics = await fetchStudentMetricsFromFirestore();
          if (localMetrics) {
            console.log("[REMINDER] Firebase metrics retrieved:", localMetrics);
            const localReminder = buildInterventionFromMetrics(localMetrics);
            console.log(
              `[REMINDER] Classification: ${localReminder.classification}`,
              localReminder,
            );
            insertReminderMessage({
              id: `intervention-${Date.now()}`,
              sender: "assistant",
              text: `${localReminder.reminderText}`,
              createdAt: new Date().toISOString(),
              isPersonalizedReminder: true,
              classification: localReminder.classification,
            });
          } else {
            console.log("[REMINDER] No Firebase metrics found, using fallback");
            addFallbackReminder();
          }
          reminderLoadedRef.current = true;
          return;
        }

        const data = await res.json();
        console.log("[REMINDER] API response:", data);
        const reminderText = data?.reminder_message;
        if (!reminderText) {
          console.log(
            "[REMINDER] API returned empty reminder_message, falling back to Firebase",
          );
          const localMetrics = await fetchStudentMetricsFromFirestore();
          if (localMetrics) {
            console.log("[REMINDER] Firebase metrics retrieved:", localMetrics);
            const localReminder = buildInterventionFromMetrics(localMetrics);
            console.log(
              `[REMINDER] Classification: ${localReminder.classification}`,
              localReminder,
            );
            insertReminderMessage({
              id: `intervention-${Date.now()}`,
              sender: "assistant",
              text: `${localReminder.reminderText}`,
              createdAt: new Date().toISOString(),
              isPersonalizedReminder: true,
              classification: localReminder.classification,
            });
          } else {
            console.log("[REMINDER] No Firebase metrics found, using fallback");
            addFallbackReminder();
          }
          reminderLoadedRef.current = true;
          return;
        }

        const reminderMessage = {
          id: `intervention-${Date.now()}`,
          sender: "assistant",
          text: `${reminderText}`,
          createdAt: new Date().toISOString(),
          isPersonalizedReminder: true,
          classification: data?.classification || null,
        };

        console.log("[REMINDER] Using API reminder:", reminderMessage);
        insertReminderMessage(reminderMessage);
      } catch (err) {
        console.error("[REMINDER] API fetch error:", err);
        try {
          const localMetrics = await fetchStudentMetricsFromFirestore();
          if (localMetrics) {
            console.log(
              "[REMINDER] Firebase metrics retrieved (error fallback):",
              localMetrics,
            );
            const localReminder = buildInterventionFromMetrics(localMetrics);
            console.log(
              `[REMINDER] Classification (error fallback): ${localReminder.classification}`,
              localReminder,
            );
            insertReminderMessage({
              id: `intervention-${Date.now()}`,
              sender: "assistant",
              text: `${localReminder.reminderText}`,
              createdAt: new Date().toISOString(),
              isPersonalizedReminder: true,
              classification: localReminder.classification,
            });
          } else {
            console.log(
              "[REMINDER] No Firebase metrics found (error fallback), using fallback",
            );
            addFallbackReminder();
          }
        } catch (fallbackError) {
          console.error(
            "[REMINDER] Fallback reminder generation failed:",
            fallbackError,
          );
          addFallbackReminder();
        }
      } finally {
        reminderLoadedRef.current = true;
      }
    };

    loadReminder();
  }, [historyLoaded, currentUser, userData]);

  const handleAsk = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = question.trim();
    if (!trimmed) {
      setError("Please enter a question.");
      return;
    }

    // Add user message to the conversation
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("question", trimmed);

      const res = await fetch(appConfig.ML_CHAT_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Chat request failed with status ${res.status}`);
      }

      const data = await res.json();
      const answerText = data.answer || "No answer returned.";
      const assistantId = `assistant-${Date.now()}`;

      // Add an empty assistant message and then fill it word-by-word
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          sender: "assistant",
          text: "",
          createdAt: new Date().toISOString(),
          downloadable_pdf: data.downloadable_pdf || null,
          download_url: data.download_url || null,
          is_pdf_request: data.is_pdf_request || false,
        },
      ]);
      setTypingState({
        id: assistantId,
        segments: answerText.split(/(\s+)/),
        index: 0,
      });
    } catch (err) {
      console.error(err);
      setError(
        "Failed to get answer from chatbot. Make sure ML service is running and PDFs are uploaded.",
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          text: "I ran into a problem while answering. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom whenever messages or loading state change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Typewriter-style animation for assistant responses (word-by-word)
  useEffect(() => {
    if (!typingState) return;

    const { id, segments, index } = typingState;
    if (!segments || index >= segments.length) {
      setTypingState(null);
      return;
    }

    const timeout = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                text: segments.slice(0, index + 1).join(""),
              }
            : m,
        ),
      );

      setTypingState(
        (prev) =>
          prev && {
            ...prev,
            index: prev.index + 1,
          },
      );
    }, 25); // faster word-by-word animation for snappier responses

    return () => clearTimeout(timeout);
  }, [typingState]);

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceListening(true);
    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript || "";
      setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  const handleImageSelect = async (file) => {
    if (!file) return;
    setImageProcessing(true);
    setError("");
    try {
      const { data } = await Tesseract.recognize(file, "eng");
      const text = (data && data.text && data.text.trim()) || "";
      if (!text) {
        setError(
          "Could not read any text from the image. Please try another image.",
        );
      } else {
        setQuestion((prev) =>
          prev ? `${prev}\n\n[From image]\n${text}` : `[From image]\n${text}`,
        );
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process the image. Please try again.");
    } finally {
      setImageProcessing(false);
    }
  };

  const handlePdfSelect = async (file) => {
    if (!file) return;
    setPdfProcessing(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      const text = fullText.trim();
      if (!text) {
        setError(
          "Could not read any text from the PDF. Please try another PDF.",
        );
      } else {
        setQuestion((prev) =>
          prev ? `${prev}\n\n[From PDF]\n${text}` : `[From PDF]\n${text}`,
        );
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process the PDF. Please try again.");
    } finally {
      setPdfProcessing(false);
    }
  };

  const handleResetChat = async () => {
    try {
      // Clear Firebase history
      await chatHistoryService.clearHistory();
      console.log("Chat history cleared from Firebase");
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }

    // Reset local state
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: "Hi! I'm AcademiGuard, How can I help you today?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setQuestion("");
    setError("");
    setTypingState(null);
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl border border-slate-200 flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
        <div>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              AG
            </span>
            AcademiGuard chatbot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetChat}
            className="hidden md:inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowFeedback((prev) => !prev)}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
              showFeedback
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Feedback
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        messages={messages}
      />

      {/* Conversation area */}
      <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto bg-slate-50/60">
        {Array.from(new Set(messages.map((m) => m.id)))
          .map((id) => messages.find((m) => m.id === id))
          .map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="mr-2 mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
                  AG
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : msg.isPersonalizedReminder
                      ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-sm"
                      : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                }`}
              >
                {msg.isPersonalizedReminder && msg.classification && (
                  <p className="mb-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    {msg.classification}
                  </p>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Show download button for PDF requests */}
                {msg.sender === "assistant" &&
                  msg.download_url &&
                  msg.downloadable_pdf && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <a
                        href={msg.download_url}
                        download
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-blue-700 transition-colors"
                      >
                        📥 Download {msg.downloadable_pdf}
                      </a>
                    </div>
                  )}

                {msg.createdAt && (
                  <p
                    className={`mt-1 text-[10px] opacity-70 ${
                      msg.sender === "user" ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                )}
              </div>
              {msg.sender === "user" && (
                <div className="ml-2 mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-slate-300 text-[11px] font-semibold text-slate-800 shadow-sm">
                  You
                </div>
              )}
            </div>
          ))}

        {loading && (
          <div className="flex items-center justify-start mt-1">
            <div className="mr-2 mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
              AG
            </div>
            <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm bg-white text-slate-900 border border-slate-200 rounded-bl-sm">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-1 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
            <p className="text-[11px] font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* dummy div for scroll-into-view */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleAsk}
        className="border-t border-slate-200 px-3 py-3 rounded-b-2xl bg-white space-y-2"
      >
        <textarea
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-20"
          placeholder="Type your message..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!loading && !typingState) {
                // mimic form submit
                handleAsk(e);
              }
            }
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <button
              type="button"
              onClick={handleVoiceInput}
              aria-label="Voice input"
              title="Voice input"
              className={`inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 text-[11px] font-semibold ${
                voiceListening
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M6 11a6 6 0 0 0 12 0" />
                <path d="M12 17v4" />
                <path d="M9 21h6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              aria-label="Upload image"
              title="Upload image"
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="12" cy="12" r="3" />
                <path d="M8 5l1.2-2h5.6L16 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => pdfInputRef.current && pdfInputRef.current.click()}
              aria-label="Upload PDF"
              title="Upload PDF"
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
                <path d="M9 14h6" />
                <path d="M9 17h6" />
              </svg>
            </button>
            <span className="ml-1 hidden md:inline">
              Powered by PDFs, voice, and images.
            </span>
          </div>
          <button
            type="submit"
            disabled={loading || !!typingState}
            className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading || typingState ? "Thinking..." : "Ask"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageSelect(file);
              e.target.value = "";
            }
          }}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handlePdfSelect(file);
              e.target.value = "";
            }
          }}
        />
        {imageProcessing && (
          <p className="text-[10px] text-slate-400">
            Extracting text from image…
          </p>
        )}
        {pdfProcessing && (
          <p className="text-[10px] text-slate-400">
            Extracting text from PDF…
          </p>
        )}
      </form>
    </div>
  );
}
