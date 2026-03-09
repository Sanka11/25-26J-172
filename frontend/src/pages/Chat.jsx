import React, { useEffect, useRef, useState } from "react";
import { appConfig } from "../config/env";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import FeedbackModal from "./FeedbackModal";
import DocumentsList from "../componets/DocumentsList";
import { chatHistoryService } from "../services/chatHistoryService";
import { ROLES, useAuth } from "../context/AuthContext";
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
import { useNavigate } from "react-router-dom";

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

const APP_AUTOMATION_COMMANDS = [
  {
    route: "/WorkloadDashboard",
    label: "Workload Dashboard",
    description: "View and manage your academic workload",
    category: "Dashboards",
    icon: "📊",
    patterns: [
      /\bwork\s*load\s*dashboard\b/i,
      /\bworkloaddashboard\b/i,
      /\bopen\s+workload\b/i,
    ],
  },
  {
    route: "/recommendation",
    label: "Recommendation Dashboard",
    description: "Get personalized study recommendations",
    category: "Dashboards",
    icon: "💡",
    patterns: [/\brecommendation\b/i, /\brecommendations\b/i],
  },
  {
    route: "/live-risk",
    label: "Live Risk Dashboard",
    description: "Monitor real-time academic risk indicators",
    category: "Analytics",
    icon: "⚠️",
    patterns: [/\blive\s*risk\b/i, /\brisk\s*dashboard\b/i],
  },
  {
    route: "/student-risk",
    label: "Student Risk Timeline",
    description: "Track your risk history over time",
    category: "Analytics",
    icon: "📈",
    patterns: [/\bstudent\s*risk\b/i, /\brisk\s*timeline\b/i, /\bmy\s*risk\b/i],
  },
  {
    route: "/gru",
    label: "GRU Dashboard",
    description: "Advanced analytics with GRU models",
    category: "Analytics",
    icon: "🧠",
    patterns: [/\bgru\b/i],
  },
  {
    route: "/rl",
    label: "RL Dashboard",
    description: "Reinforcement learning insights",
    category: "Analytics",
    icon: "🤖",
    patterns: [/\brl\b/i, /\breinforcement\s*learning\b/i],
  },
  {
    route: "/peer",
    label: "Peer Dashboard",
    description: "Compare with peer performance",
    category: "Community",
    icon: "👥",
    patterns: [/\bpeer\b/i, /\bpeer\s*dashboard\b/i],
  },
  {
    route: "/support",
    label: "Human Support",
    description: "Connect with support team",
    category: "Community",
    icon: "🆘",
    patterns: [/\bsupport\b/i, /\bhuman\s*support\b/i],
  },
  {
    route: "/chat",
    label: "Chat Assistant",
    description: "AI-powered chat assistant",
    category: "Tools",
    icon: "💬",
    patterns: [/\bopen\s+chat\b/i, /\bgo\s+to\s+chat\b/i],
  },
  {
    route: "/create-quiz",
    label: "Create Quiz",
    description: "Build custom quizzes",
    category: "Tools",
    icon: "✏️",
    patterns: [/\bcreate\s*quiz\b/i, /\bquiz\s*creator\b/i],
  },
  {
    route: "/upload",
    label: "PDF Upload",
    description: "Upload and manage PDFs",
    category: "Tools",
    icon: "📄",
    patterns: [/\bupload\s*pdf\b/i, /\bpdf\s*upload\b/i],
  },
  {
    route: "/careerReadiness",
    label: "Career Readiness",
    description: "Prepare for your career",
    category: "Development",
    icon: "🎯",
    patterns: [/\bcareer\s*readiness\b/i, /\bcareer\b/i],
  },
  {
    route: "/levels",
    label: "Levels",
    description: "Track your learning levels",
    category: "Development",
    icon: "🏆",
    patterns: [/\blevels\b/i, /\bopen\s+levels\b/i],
  },
  {
    route: "/announcements",
    label: "Announcements",
    description: "View latest announcements",
    category: "Information",
    icon: "📢",
    patterns: [/\bannouncement\b/i, /\bannouncements\b/i],
  },
  {
    route: "/admin/announcements",
    label: "Admin Announcements",
    description: "Manage system announcements",
    category: "Admin",
    icon: "🔐",
    patterns: [/\badmin\s*announcement\b/i],
  },
];

const resolveAutomationCommand = (input) => {
  const text = (input || "").trim();
  if (!text) return null;

  const normalized = text.toLowerCase();
  const hasNavIntent =
    /\b(open|go|navigate|take me|show|need to see|i need to see|move)\b/i.test(
      normalized,
    ) || normalized.includes("dashboard");

  if (!hasNavIntent) return null;

  for (const command of APP_AUTOMATION_COMMANDS) {
    const matched = command.patterns.some((pattern) => pattern.test(text));
    if (matched) return command;
  }

  return null;
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
  if (belowThreshold.includes("assignments_avg")) {
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
  const navigate = useNavigate();
  const canUploadPdf =
    userData?.role === ROLES.ADMIN || userData?.role === ROLES.SUPER_ADMIN;
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
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [responseMode, setResponseMode] = useState(() => {
    try {
      return localStorage.getItem("chat_response_mode") || "hybrid";
    } catch {
      return "hybrid";
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("chat_theme") || "system";
    } catch {
      return "system";
    }
  });
  const [effectiveTheme, setEffectiveTheme] = useState("light");
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [expandedPdfId, setExpandedPdfId] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [currentPdfData, setCurrentPdfData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [activeRagPdf, setActiveRagPdf] = useState(null);
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);
  const messagesEndRef = useRef(null);
  const questionInputRef = useRef(null);
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

  // Fetch uploaded documents from ML service
  const fetchDocuments = async () => {
    try {
      setDocsLoading(true);
      const res = await fetch(appConfig.ML_LIST_DOCS_URL);
      if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.status}`);
      }
      const data = await res.json();
      const docs = Array.isArray(data.documents) ? data.documents : [];
      setDocuments(docs);
      console.log(`[DOCS] Fetched ${docs.length} documents`);
    } catch (err) {
      console.error("[DOCS] Failed to fetch documents:", err);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  // Upload PDF to ML service
  const uploadPdfDocument = async (file) => {
    if (!file) return;
    if (!canUploadPdf) {
      setError("PDF upload is available only for admins.");
      return;
    }

    setPdfProcessing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(appConfig.ML_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Upload failed (${res.status}): ${text || "Unknown error"}`,
        );
      }

      const result = await res.json();
      console.log("[PDF UPLOAD] Success:", result);
      setError("");
      setShowPdfUploadModal(false);

      // Refresh documents list
      await fetchDocuments();

      // Add success message
      setMessages((prev) => [
        ...prev,
        {
          id: `pdf-upload-${Date.now()}`,
          sender: "assistant",
          text: `✅ PDF "${file.name}" uploaded successfully and added to the knowledge base! I can now answer questions about this document.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("[PDF UPLOAD] Error:", err);
      setError(err.message || "Failed to upload PDF");
    } finally {
      setPdfProcessing(false);
    }
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

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
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

    const automationCommand = resolveAutomationCommand(trimmed);
    if (automationCommand) {
      navigate(automationCommand.route);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-nav-${Date.now()}`,
          sender: "assistant",
          text: `Of course. I'll navigate you to ${automationCommand.label} now.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("question", trimmed);
      formData.append("response_mode", responseMode);

      const res = await fetch(appConfig.ML_CHAT_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Chat request failed with status ${res.status}`);
      }

      const data = await res.json();
      const answerText = data.answer || "Download PDF";
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

  // Close command menu when clicking outside
  useEffect(() => {
    if (!showCommandMenu) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(".command-menu-container")) {
        setShowCommandMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCommandMenu]);

  // Keyboard shortcut (Ctrl+K) for quick navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandMenu((prev) => !prev);
      }
      if (e.key === "Escape" && showCommandMenu) {
        setShowCommandMenu(false);
        setNavSearch("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showCommandMenu]);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
    if (!canUploadPdf) {
      setError("PDF upload is available only for admins.");
      return;
    }
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

    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);

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

  const handleTextToSpeech = (messageId, text) => {
    // Check if browser supports speech synthesis
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    // If already speaking this message, stop it
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    utterance.lang = "en-US"; // English

    // Update state when speech starts
    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };

    // Clear state when speech ends
    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    // Handle errors
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setSpeakingMessageId(null);
      setError("Failed to play audio. Please try again.");
    };

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  const handlePdfPreview = (messageId) => {
    if (expandedPdfId === messageId) {
      setExpandedPdfId(null);
    } else {
      setExpandedPdfId(messageId);
    }
  };

  const openPdfViewer = (pdfUrl, pdfName) => {
    setCurrentPdfData({ url: pdfUrl, name: pdfName });
    setShowPdfViewer(true);
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setCurrentPdfData(null);
  };

  const handleDocumentOpen = (doc) => {
    setActiveRagPdf({
      docId: doc?.doc_id || "",
      pdfName: doc?.pdf_name || doc?.doc_id || "Document.pdf",
    });
    setShowDocuments(false);
    setTimeout(() => questionInputRef.current?.focus(), 0);
  };

  const handleDocumentDownload = (doc) => {
    const url = doc?.doc_id
      ? `${appConfig.ML_BASE_URL}/documents/${encodeURIComponent(doc.doc_id)}`
      : null;
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = doc?.pdf_name || doc?.doc_id || "document.pdf";
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearActiveRagPdf = () => {
    setActiveRagPdf(null);
    setTimeout(() => questionInputRef.current?.focus(), 0);
  };

  useEffect(() => {
    try {
      localStorage.setItem("chat_response_mode", responseMode);
    } catch {
      // No-op when storage is unavailable
    }
  }, [responseMode]);

  // Persist theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("chat_theme", theme);
    } catch {
      // No-op when storage is unavailable
    }
  }, [theme]);

  // Detect system theme and set effective theme
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateEffectiveTheme = () => {
        setEffectiveTheme(mediaQuery.matches ? "dark" : "light");
      };
      updateEffectiveTheme();
      mediaQuery.addEventListener("change", updateEffectiveTheme);
      return () =>
        mediaQuery.removeEventListener("change", updateEffectiveTheme);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  return (
    <div
      className={`shadow-2xl rounded-2xl border flex flex-col h-[520px] overflow-hidden transition-colors ${
        effectiveTheme === "dark"
          ? "bg-gray-900 border-gray-700"
          : "bg-white border-slate-200"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b rounded-t-2xl ${
          effectiveTheme === "dark"
            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900"
            : "border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50"
        }`}
      >
        <div>
          <p
            className={`text-sm font-semibold flex items-center gap-1.5 ${
              effectiveTheme === "dark" ? "text-gray-100" : "text-slate-800"
            }`}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              AG
            </span>
            AcademiGuard chatbot
          </p>
          <p
            className={`text-[11px] mt-0.5 capitalize ${
              effectiveTheme === "dark" ? "text-gray-400" : "text-slate-500"
            }`}
          >
            Mode: {responseMode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettingsPanel((prev) => !prev)}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
              showSettingsPanel
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
            title="Chat settings"
            aria-label="Chat settings"
          >
            <span className="text-xs mr-1" aria-hidden="true">
              ⚙
            </span>
            Settings
          </button>
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

      {/* Professional PDF Viewer Modal */}
      {showPdfViewer && currentPdfData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
            {/* PDF Viewer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-white"
                  >
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {currentPdfData.name || "PDF Document"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Academic Policy Document
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={currentPdfData.url}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-all"
                  title="Download PDF"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  Download
                </a>
                <a
                  href={currentPdfData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
                  title="Open in new tab"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                  </svg>
                  Open in Tab
                </a>
                <button
                  onClick={closePdfViewer}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all"
                  title="Close viewer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Viewer Content */}
            <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
              <div className="bg-white rounded-xl shadow-lg h-full border border-slate-200 overflow-hidden">
                <iframe
                  src={currentPdfData.url}
                  className="w-full h-full"
                  title={currentPdfData.name || "PDF Document"}
                  style={{ border: "none" }}
                />
              </div>
            </div>

            {/* PDF Viewer Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-blue-600"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span className="font-medium">
                  Use browser controls to zoom, navigate pages, and print
                </span>
              </div>
              <button
                onClick={closePdfViewer}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div
          className={`mx-4 my-3 rounded-xl border p-3 ${
            effectiveTheme === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p
            className={`text-xs font-semibold mb-2 ${
              effectiveTheme === "dark" ? "text-gray-200" : "text-slate-700"
            }`}
          >
            Chat Response Mode
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "document", label: "Document" },
              { key: "web", label: "Web" },
              { key: "hybrid", label: "Hybrid" },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setResponseMode(mode.key)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                  responseMode === mode.key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : effectiveTheme === "dark"
                      ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div
            className={`mt-4 pt-4 border-t ${
              effectiveTheme === "dark" ? "border-gray-700" : "border-slate-200"
            }`}
          >
            <p
              className={`text-xs font-semibold mb-2 ${
                effectiveTheme === "dark" ? "text-gray-200" : "text-slate-700"
              }`}
            >
              Theme
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "light", label: "Light Mode", icon: "☀️" },
                { key: "dark", label: "Dark Mode", icon: "🌙" },
                { key: "system", label: "System Default", icon: "💻" },
              ].map((themeOption) => (
                <button
                  key={themeOption.key}
                  type="button"
                  onClick={() => setTheme(themeOption.key)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                    theme === themeOption.key
                      ? "border-blue-600 bg-blue-600 text-white"
                      : effectiveTheme === "dark"
                        ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xs">{themeOption.icon}</span>
                  {themeOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF Upload Modal */}
      {showPdfUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  Upload PDF
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Add PDF to knowledge base for RAG
                </p>
              </div>
              <button
                onClick={() => setShowPdfUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) uploadPdfDocument(file);
                }}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-10 w-10 text-slate-300 mx-auto mb-2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Drag PDF here or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Only PDF files are supported
                </p>

                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPdfDocument(file);
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                  </svg>
                  Choose File
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}

              {pdfProcessing && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.1s]" />
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]" />
                  </div>
                  <p className="text-xs text-slate-500">Uploading PDF...</p>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center">
                📄 PDFs are processed, chunked, embedded, and stored in vector
                database
              </p>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-6 py-3 flex gap-3 bg-slate-50">
              <button
                onClick={() => setShowPdfUploadModal(false)}
                disabled={pdfProcessing}
                className="flex-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages Container */}
        <div
          className={`flex-1 px-4 py-3 space-y-3 overflow-y-auto ${
            effectiveTheme === "dark" ? "bg-gray-800" : "bg-slate-50/60"
          }`}
        >
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
                {msg.text && (
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : msg.isPersonalizedReminder
                          ? effectiveTheme === "dark"
                            ? "bg-amber-900/30 text-amber-200 border border-amber-700 rounded-bl-sm"
                            : "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-sm"
                          : effectiveTheme === "dark"
                            ? "bg-gray-700 text-gray-100 border border-gray-600 rounded-bl-sm"
                            : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.isPersonalizedReminder && msg.classification && (
                      <p className="mb-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        {msg.classification}
                      </p>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-line flex-1">{msg.text}</p>
                      {msg.sender === "assistant" && msg.text && (
                        <button
                          type="button"
                          onClick={() => handleTextToSpeech(msg.id, msg.text)}
                          className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
                            effectiveTheme === "dark"
                              ? "hover:bg-gray-600"
                              : "hover:bg-slate-100"
                          } ${
                            speakingMessageId === msg.id
                              ? "text-blue-600 bg-blue-50"
                              : effectiveTheme === "dark"
                                ? "text-gray-400 hover:text-blue-400"
                                : "text-slate-500 hover:text-blue-600"
                          }`}
                          title={
                            speakingMessageId === msg.id
                              ? "Stop speaking"
                              : "Read aloud"
                          }
                        >
                          {speakingMessageId === msg.id ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Show PDF section for PDF requests */}
                {msg.sender === "assistant" &&
                  msg.is_pdf_request &&
                  msg.download_url &&
                  msg.downloadable_pdf && (
                    <div
                      className={`mt-3 rounded-xl overflow-hidden shadow-lg border-2 ${
                        effectiveTheme === "dark"
                          ? "border-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900"
                          : "border-blue-300/50 bg-gradient-to-br from-white to-blue-50"
                      }`}
                    >
                      {/* PDF Header */}
                      <div
                        className={`px-4 py-3 border-b ${
                          effectiveTheme === "dark"
                            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900"
                            : "border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-md">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-6 w-6 text-white"
                            >
                              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm font-bold ${
                                effectiveTheme === "dark"
                                  ? "text-gray-100"
                                  : "text-slate-900"
                              }`}
                            >
                              {msg.downloadable_pdf}
                            </p>
                            <p
                              className={`text-xs mt-0.5 flex items-center gap-1 ${
                                effectiveTheme === "dark"
                                  ? "text-gray-400"
                                  : "text-slate-500"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-3.5 w-3.5"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                              Academic Policy Document • Ready to view
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* PDF Actions */}
                      <div className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              openPdfViewer(
                                msg.download_url,
                                msg.downloadable_pdf,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-5 w-5"
                            >
                              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                            </svg>
                            View PDF
                          </button>
                          <a
                            href={msg.download_url}
                            download
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02] ${
                              effectiveTheme === "dark"
                                ? "border-blue-500 bg-gray-800 text-blue-400 hover:bg-gray-700"
                                : "border-blue-600 bg-white text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-5 w-5"
                            >
                              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                {msg.createdAt && (
                  <p
                    className={`mt-1 text-[10px] opacity-70 ${
                      msg.sender === "user"
                        ? "text-blue-100"
                        : effectiveTheme === "dark"
                          ? "text-gray-400"
                          : "text-slate-500"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                )}
                {msg.sender === "user" && (
                  <div
                    className={`ml-2 mt-1 h-7 w-7 flex items-center justify-center rounded-full text-[11px] font-semibold shadow-sm ${
                      effectiveTheme === "dark"
                        ? "bg-gray-600 text-gray-200"
                        : "bg-slate-300 text-slate-800"
                    }`}
                  >
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
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm border rounded-bl-sm ${
                  effectiveTheme === "dark"
                    ? "bg-gray-700 text-gray-100 border-gray-600"
                    : "bg-white text-slate-900 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full animate-bounce ${
                      effectiveTheme === "dark" ? "bg-gray-400" : "bg-slate-400"
                    }`}
                  />
                  <span
                    className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:0.15s] ${
                      effectiveTheme === "dark" ? "bg-gray-400" : "bg-slate-400"
                    }`}
                  />
                  <span
                    className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:0.3s] ${
                      effectiveTheme === "dark" ? "bg-gray-400" : "bg-slate-400"
                    }`}
                  />
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
      </div>

      {/* PDF Documents Modal (replaces sidebar) */}
      {showDocuments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div
            className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-2 ${
              effectiveTheme === "dark"
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-slate-200"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                effectiveTheme === "dark"
                  ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900"
                  : "border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-white"
                  >
                    <path d="M7 3h7l5 5v13H7V3z" />
                    <path d="M14 3v5h5" />
                  </svg>
                </div>
                <div>
                  <p
                    className={`text-lg font-bold ${
                      effectiveTheme === "dark"
                        ? "text-gray-100"
                        : "text-slate-900"
                    }`}
                  >
                    PDF Documents Library
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      effectiveTheme === "dark"
                        ? "text-gray-400"
                        : "text-slate-500"
                    }`}
                  >
                    {documents.length}{" "}
                    {documents.length === 1 ? "document" : "documents"}{" "}
                    available for RAG
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDocuments}
                  disabled={docsLoading}
                  className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all ${
                    effectiveTheme === "dark"
                      ? "border-blue-500 bg-gray-800 text-blue-400 hover:bg-gray-700 disabled:opacity-50"
                      : "border-blue-600 bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  }`}
                  title="Refresh documents"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`h-5 w-5 ${docsLoading ? "animate-spin" : ""}`}
                  >
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                  Refresh
                </button>
                {canUploadPdf && (
                  <button
                    onClick={() => {
                      setShowPdfUploadModal(true);
                      setShowDocuments(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Upload PDF
                  </button>
                )}
                <button
                  onClick={() => setShowDocuments(false)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    effectiveTheme === "dark"
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400"
                  }`}
                  title="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - PDF Grid */}
            <div
              className={`flex-1 overflow-y-auto p-6 ${
                effectiveTheme === "dark" ? "bg-gray-800" : "bg-slate-50"
              }`}
            >
              {docsLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse [animation-delay:0.15s]" />
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse [animation-delay:0.3s]" />
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      effectiveTheme === "dark"
                        ? "text-gray-300"
                        : "text-slate-600"
                    }`}
                  >
                    Loading documents...
                  </p>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div
                    className={`p-6 rounded-full mb-4 ${
                      effectiveTheme === "dark" ? "bg-gray-700" : "bg-slate-200"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`h-16 w-16 ${
                        effectiveTheme === "dark"
                          ? "text-gray-500"
                          : "text-slate-400"
                      }`}
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                  </div>
                  <p
                    className={`text-lg font-semibold mb-2 ${
                      effectiveTheme === "dark"
                        ? "text-gray-200"
                        : "text-slate-700"
                    }`}
                  >
                    No documents available
                  </p>
                  <p
                    className={`text-sm ${
                      effectiveTheme === "dark"
                        ? "text-gray-400"
                        : "text-slate-500"
                    }`}
                  >
                    Upload PDFs to get started with RAG-powered responses
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.doc_id || index}
                      className={`rounded-xl overflow-hidden shadow-lg border-2 transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
                        effectiveTheme === "dark"
                          ? "border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-blue-500"
                          : "border-slate-200 bg-gradient-to-br from-white to-blue-50 hover:border-blue-400"
                      }`}
                      onClick={() => handleDocumentOpen(doc)}
                    >
                      <div
                        className={`px-4 py-3 border-b ${
                          effectiveTheme === "dark"
                            ? "border-gray-700 bg-gray-800"
                            : "border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-br from-red-500 to-red-600 p-2.5 rounded-lg shadow-md flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-5 w-5 text-white"
                            >
                              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-bold truncate ${
                                effectiveTheme === "dark"
                                  ? "text-gray-100"
                                  : "text-slate-900"
                              }`}
                              title={doc.pdf_name || doc.doc_id}
                            >
                              {doc.pdf_name ||
                                doc.doc_id ||
                                "Untitled Document"}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                effectiveTheme === "dark"
                                  ? "text-gray-400"
                                  : "text-slate-500"
                              }`}
                            >
                              PDF Document
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 flex gap-2">
                        <button
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 text-xs font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentOpen(doc);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                          </svg>
                          Select
                        </button>
                        <button
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-blue-600 text-blue-600 px-3 py-2 text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentDownload(doc);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-4 w-4"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`flex items-center justify-between px-6 py-3 border-t ${
                effectiveTheme === "dark"
                  ? "border-gray-700 bg-gray-900"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`flex items-center gap-2 text-xs ${
                  effectiveTheme === "dark" ? "text-gray-400" : "text-slate-600"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-blue-600"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span className="font-medium">
                  Click any document to use it in your chat
                </span>
              </div>
              <button
                onClick={() => setShowDocuments(false)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                  effectiveTheme === "dark"
                    ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleAsk}
        className={`border-t px-3 py-3 rounded-b-2xl space-y-2 ${
          effectiveTheme === "dark"
            ? "border-gray-700 bg-gray-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <textarea
          ref={questionInputRef}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-20 ${
            effectiveTheme === "dark"
              ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-500"
              : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
          }`}
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
        {activeRagPdf && (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-blue-800">
                Using PDF: {activeRagPdf.pdfName}
              </p>
              <p className="text-[10px] text-blue-700">RAG context selected</p>
            </div>
            <button
              type="button"
              onClick={clearActiveRagPdf}
              className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
              title="Clear selected PDF"
              aria-label="Clear selected PDF"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
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
              onClick={() => setShowDocuments(!showDocuments)}
              aria-label="View available PDFs"
              title="View available PDFs"
              className={`inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 text-[11px] font-semibold ${
                showDocuments
                  ? "bg-blue-50 text-blue-600 border-blue-200"
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
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5" />
                <path d="M9 14h6" />
                <path d="M9 17h6" />
              </svg>
            </button>

            <div className="relative command-menu-container">
              <button
                type="button"
                onClick={() => setShowCommandMenu(!showCommandMenu)}
                aria-label="Quick navigation commands"
                title="Quick navigation commands"
                className={`inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 text-[11px] font-semibold ${
                  showCommandMenu
                    ? "bg-blue-50 text-blue-600 border-blue-200"
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
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </svg>
              </button>
              {showCommandMenu && (
                <div className="absolute bottom-10 left-0 w-96 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn">
                  {/* Header with gradient */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Quick Navigation
                        </h3>
                        <p className="text-[10px] text-blue-100 mt-0.5">
                          {APP_AUTOMATION_COMMANDS.length} pages available
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCommandMenu(false)}
                        className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                  </div>

                  {/* Search Bar */}
                  <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
                        placeholder="Search pages..."
                        value={navSearch}
                        onChange={(e) => setNavSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {navSearch && (
                        <button
                          onClick={() => setNavSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Navigation Items by Category */}
                  <div className="max-h-96 overflow-y-auto">
                    {(() => {
                      const filteredCommands = APP_AUTOMATION_COMMANDS.filter(
                        (cmd) =>
                          navSearch === "" ||
                          cmd.label
                            .toLowerCase()
                            .includes(navSearch.toLowerCase()) ||
                          cmd.description
                            .toLowerCase()
                            .includes(navSearch.toLowerCase()) ||
                          cmd.category
                            .toLowerCase()
                            .includes(navSearch.toLowerCase()),
                      );

                      const categories = [
                        ...new Set(filteredCommands.map((cmd) => cmd.category)),
                      ];

                      if (filteredCommands.length === 0) {
                        return (
                          <div className="py-12 text-center">
                            <svg
                              className="w-12 h-12 mx-auto text-slate-300 mb-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-xs text-slate-500">
                              No pages found
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Try a different search term
                            </p>
                          </div>
                        );
                      }

                      return categories.map((category, catIdx) => {
                        const categoryCommands = filteredCommands.filter(
                          (cmd) => cmd.category === category,
                        );

                        return (
                          <div key={catIdx} className="py-2">
                            {/* Category Header */}
                            <div className="px-3 py-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {category}
                              </span>
                              <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                {categoryCommands.length}
                              </span>
                            </div>

                            {/* Category Items */}
                            <div className="space-y-0.5 px-2">
                              {categoryCommands.map((cmd, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    navigate(cmd.route);
                                    setShowCommandMenu(false);
                                    setNavSearch("");
                                  }}
                                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 flex items-center gap-3 group border border-transparent hover:border-blue-200 hover:shadow-sm"
                                >
                                  {/* Icon */}
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-blue-100 group-hover:to-indigo-100 rounded-lg flex items-center justify-center text-sm transition-all duration-200 group-hover:scale-110">
                                    {cmd.icon}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                      {cmd.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500 group-hover:text-slate-600 mt-0.5 line-clamp-1">
                                      {cmd.description}
                                    </div>
                                  </div>

                                  {/* Arrow */}
                                  <svg
                                    className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                      <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-mono">
                        Ctrl
                      </kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[9px] font-mono">
                        K
                      </kbd>
                      <span className="ml-1">to search</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCommandMenu(false);
                        setNavSearch("");
                      }}
                      className="text-[9px] text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            {canUploadPdf && (
              <button
                type="button"
                onClick={() =>
                  pdfInputRef.current && pdfInputRef.current.click()
                }
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
            )}
            <span className="ml-1 hidden md:inline">
              Powered by{" "}
              {canUploadPdf ? "PDFs, voice, and images" : "voice and images"}.
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
        {canUploadPdf && (
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
        )}
        {imageProcessing && (
          <p className="text-[10px] text-slate-400">
            Extracting text from image…
          </p>
        )}
        {canUploadPdf && pdfProcessing && (
          <p className="text-[10px] text-slate-400">
            Extracting text from PDF…
          </p>
        )}
      </form>
    </div>
  );
}
