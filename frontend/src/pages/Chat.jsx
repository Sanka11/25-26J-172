import React, { useEffect, useRef, useState } from "react";
import { appConfig } from "../config/env";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Chat({ onClose }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hi!I'm Arlo, How can I help you today?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typingState, setTypingState] = useState(null); // for word-by-word animation
  const [voiceListening, setVoiceListening] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

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

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: "Hi, I'm AcademiGuard. Ask me about plagiarism, assessments, or academic integrity based on the documents you've uploaded.",
        createdAt: new Date().toISOString(),
      },
    ]);
    setQuestion("");
    setError("");
    setTypingState(null);
  };

  const loadFeedbackStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(appConfig.GET_CHAT_FEEDBACK_STATS_URL);
      if (!res.ok) {
        throw new Error(`Stats request failed with status ${res.status}`);
      }
      const data = await res.json();
      setAvgRating(
        typeof data.average_rating === "number" ? data.average_rating : null,
      );
      setRatingCount(
        typeof data.total_ratings === "number" ? data.total_ratings : 0,
      );
    } catch (err) {
      console.error("Failed to load feedback stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (showFeedback) {
      loadFeedbackStats();
    }
  }, [showFeedback]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackStatus("");

    const trimmed = feedbackComment.trim();
    if (!feedbackRating) {
      setFeedbackStatus("Please select a rating between 1 and 5.");
      return;
    }

    if (!trimmed) {
      setFeedbackStatus("Please enter your feedback before submitting.");
      return;
    }

    // get last user and assistant messages if available
    const lastUser = [...messages].reverse().find((m) => m.sender === "user");
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.sender === "assistant" && m.id !== "welcome");

    const payload = {
      rating: feedbackRating,
      comment: trimmed,
      created_at: Date.now() / 1000,
      last_question: lastUser?.text || null,
      last_answer: lastAssistant?.text || null,
    };

    try {
      setFeedbackLoading(true);
      const res = await fetch(appConfig.SUBMIT_CHAT_FEEDBACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Feedback request failed with status ${res.status}`);
      }

      setFeedbackStatus("Thank you, your feedback has been recorded.");
      setFeedbackComment("");
      setFeedbackRating(null);
      await loadFeedbackStats();
    } catch (err) {
      console.error(err);
      setFeedbackStatus(
        "Unable to send feedback right now. Please try again later.",
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-2xl border border-slate-200 flex flex-col h-[460px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl">
        <div>
          <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              AG
            </span>
            AcademiGuard chatbot
          </p>
          <p className="text-[11px] text-slate-500">
            Ask about your uploaded academic documents.
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

      {/* Feedback panel */}
      {showFeedback && (
        <div className="px-4 pt-3 pb-2 border-b border-slate-200 bg-white text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800">Rate this chatbot</p>
            <p className="text-[10px] text-slate-500">
              {statsLoading
                ? "Loading rating…"
                : ratingCount > 0 && avgRating != null
                  ? `Average: ${avgRating.toFixed(
                      1,
                    )} / 5 (${ratingCount} ratings)`
                  : "No ratings yet"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFeedbackRating(star)}
                className={`h-6 w-6 flex items-center justify-center rounded-full border text-[11px] ${
                  feedbackRating && star <= feedbackRating
                    ? "bg-yellow-400 border-yellow-400 text-white"
                    : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {star}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmitFeedback} className="space-y-1">
            <textarea
              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none h-14"
              placeholder="Share what worked well or what should be improved…"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                Feedback helps us improve AcademiGuard.
              </p>
              <button
                type="submit"
                disabled={feedbackLoading}
                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {feedbackLoading ? "Sending…" : "Submit"}
              </button>
            </div>
            {feedbackStatus && (
              <p className="mt-1 text-[10px] text-slate-500">
                {feedbackStatus}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Conversation area */}
      <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto bg-slate-50/60">
        {messages.map((msg) => (
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
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
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
            <div className="max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm bg-white text-slate-900 border border-slate-200 rounded-bl-sm">
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
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-16"
          placeholder="Ask a question about plagiarism, assessments, or academic integrity..."
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
              className={`inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 text-[11px] font-semibold ${
                voiceListening
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              🎤
            </button>
            <button
              type="button"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              📷
            </button>
            <button
              type="button"
              onClick={() => pdfInputRef.current && pdfInputRef.current.click()}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              📄
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
