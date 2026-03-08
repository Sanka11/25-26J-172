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
    patterns: [
      /\bwork\s*load\s*dashboard\b/i,
      /\bworkloaddashboard\b/i,
      /\bopen\s+workload\b/i,
    ],
  },
  {
    route: "/recommendation",
    label: "Recommendation Dashboard",
    patterns: [/\brecommendation\b/i, /\brecommendations\b/i],
  },
  {
    route: "/announcements",
    label: "Announcements",
    patterns: [/\bannouncement\b/i, /\bannouncements\b/i],
  },
  {
    route: "/live-risk",
    label: "Live Risk Dashboard",
    patterns: [/\blive\s*risk\b/i, /\brisk\s*dashboard\b/i],
  },
  {
    route: "/student-risk",
    label: "Student Risk Timeline",
    patterns: [/\bstudent\s*risk\b/i, /\brisk\s*timeline\b/i, /\bmy\s*risk\b/i],
  },
  {
    route: "/chat",
    label: "Chat Page",
    patterns: [/\bopen\s+chat\b/i, /\bgo\s+to\s+chat\b/i],
  },
  {
    route: "/careerReadiness",
    label: "Career Readiness",
    patterns: [/\bcareer\s*readiness\b/i, /\bcareer\b/i],
  },
  {
    route: "/levels",
    label: "Levels",
    patterns: [/\blevels\b/i, /\bopen\s+levels\b/i],
  },
  {
    route: "/create-quiz",
    label: "Create Quiz",
    patterns: [/\bcreate\s*quiz\b/i, /\bquiz\s*creator\b/i],
  },
  {
    route: "/upload",
    label: "PDF Upload",
    patterns: [/\bupload\s*pdf\b/i, /\bpdf\s*upload\b/i],
  },
  {
    route: "/peer",
    label: "Peer Dashboard",
    patterns: [/\bpeer\b/i, /\bpeer\s*dashboard\b/i],
  },
  {
    route: "/support",
    label: "Human Support Dashboard",
    patterns: [/\bsupport\b/i, /\bhuman\s*support\b/i],
  },
  {
    route: "/admin/announcements",
    label: "Admin Announcements",
    patterns: [/\badmin\s*announcement\b/i],
  },
  {
    route: "/gru",
    label: "GRU Dashboard",
    patterns: [/\bgru\b/i],
  },
  {
    route: "/rl",
    label: "RL Dashboard",
    patterns: [/\brl\b/i, /\breinforcement\s*learning\b/i],
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
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [expandedPdfId, setExpandedPdfId] = useState(null);
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

  const handleDocumentOpen = (doc) => {
    setActiveRagPdf({
      docId: doc?.doc_id || "",
      pdfName: doc?.pdf_name || doc?.doc_id || "Document.pdf",
    });
    setShowDocuments(false);
    setTimeout(() => questionInputRef.current?.focus(), 0);
  };

  const clearActiveRagPdf = () => {
    setActiveRagPdf(null);
    setTimeout(() => questionInputRef.current?.focus(), 0);
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
                {msg.text && (
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
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-line flex-1">{msg.text}</p>
                      {msg.sender === "assistant" && msg.text && (
                        <button
                          type="button"
                          onClick={() => handleTextToSpeech(msg.id, msg.text)}
                          className={`flex-shrink-0 p-1.5 rounded-full transition-all hover:bg-slate-100 ${
                            speakingMessageId === msg.id
                              ? "text-blue-600 bg-blue-50"
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
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-2.5 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📄</span>
                            <div>
                              <p className="text-xs font-semibold text-slate-700">
                                {msg.downloadable_pdf}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                PDF Document
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePdfPreview(msg.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-white border border-slate-300 text-slate-700 px-3 py-1.5 text-[10px] font-semibold hover:bg-slate-50 transition-colors"
                          >
                            {expandedPdfId === msg.id ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5"
                                >
                                  <path d="M7 10l5 5 5-5z" />
                                </svg>
                                Hide Preview
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5"
                                >
                                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                                Preview
                              </>
                            )}
                          </button>
                          <a
                            href={msg.download_url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-blue-700 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>

                      {/* PDF Preview */}
                      {expandedPdfId === msg.id && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                          <div className="text-center mb-2">
                            <p className="text-xs font-semibold text-slate-600">
                              PDF Preview
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Click download to open full document
                            </p>
                          </div>
                          <div className="bg-white rounded border border-slate-200 p-2 text-center">
                            <p className="text-xs text-slate-600 mb-2">
                              📖 {msg.downloadable_pdf}
                            </p>
                            <p className="text-[10px] text-slate-500 mb-2">
                              This PDF document contains important academic
                              policies and procedures. Click the download button
                              to view the complete file in your PDF reader.
                            </p>
                            <a
                              href={msg.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Open PDF
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-3 w-3"
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3v10m0 0l-3-3m3 3l3-3" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}
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

        {/* Documents Sidebar */}
        {showDocuments && (
          <div className="border-l border-slate-200 w-80 bg-white flex flex-col flex-shrink-0 overflow-hidden">
            <DocumentsList
              documents={documents}
              loading={docsLoading}
              onRefresh={fetchDocuments}
              onUploadClick={() => setShowPdfUploadModal(true)}
              onDocumentOpen={handleDocumentOpen}
              showUploadButton={canUploadPdf}
            />
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleAsk}
        className="border-t border-slate-200 px-3 py-3 rounded-b-2xl bg-white space-y-2"
      >
        <textarea
          ref={questionInputRef}
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
                <div className="absolute bottom-10 left-0 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-semibold text-slate-700">
                      Quick Navigation
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Click any command to navigate
                    </p>
                  </div>
                  <div className="py-1">
                    {APP_AUTOMATION_COMMANDS.map((cmd, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          navigate(cmd.route);
                          setShowCommandMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2 group"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <div>
                          <div className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                            {cmd.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {cmd.route}
                          </div>
                        </div>
                      </button>
                    ))}
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
