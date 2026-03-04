import React, { useState, useEffect } from "react";
import { appConfig } from "../config/env";

export default function FeedbackModal({ isOpen, onClose, messages }) {
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadFeedbackStats = async () => {
    try {
      setStatsLoading(true);

      const statsUrls = [
        appConfig.GET_CHAT_FEEDBACK_STATS_URL,
        appConfig.ML_FEEDBACK_STATS_URL,
      ].filter(Boolean);

      let bestStats = null;

      for (const statsUrl of statsUrls) {
        try {
          const res = await fetch(statsUrl);
          if (!res.ok) {
            continue;
          }

          const data = await res.json();
          const total =
            typeof data.total_ratings === "number" ? data.total_ratings : 0;
          const average =
            typeof data.average_rating === "number" ? data.average_rating : 0;

          if (!bestStats || total > bestStats.total_ratings) {
            bestStats = { average_rating: average, total_ratings: total };
          }
        } catch {
          // try next source
        }
      }

      const data = bestStats || { average_rating: 0, total_ratings: 0 };
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
    if (isOpen) {
      loadFeedbackStats();
    }
  }, [isOpen]);

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
      const submitUrls = [
        appConfig.SUBMIT_CHAT_FEEDBACK_URL,
        appConfig.ML_FEEDBACK_URL,
      ].filter(Boolean);

      let submitted = false;
      let lastError = null;

      for (const submitUrl of submitUrls) {
        try {
          const res = await fetch(submitUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            lastError = new Error(
              `Feedback request failed with status ${res.status}`,
            );
            continue;
          }

          submitted = true;
          break;
        } catch (submitErr) {
          lastError = submitErr;
        }
      }

      if (!submitted) {
        throw lastError || new Error("Feedback request failed");
      }

      setFeedbackStatus("Thank you, your feedback has been recorded.");
      setFeedbackComment("");
      setFeedbackRating(null);
      await loadFeedbackStats();

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setFeedbackStatus("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setFeedbackStatus(
        "Unable to send feedback right now. Please try again later.",
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Share Your Feedback
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Help us improve AcademiGuard
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
            aria-label="Close feedback modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Stats */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">
              Community Rating
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {statsLoading
                ? "Loading…"
                : ratingCount > 0 && avgRating != null
                  ? `${avgRating.toFixed(1)} / 5.0`
                  : "No ratings yet"}
            </p>
            {ratingCount > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                Based on {ratingCount} rating{ratingCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              How would you rate your experience?
            </label>
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  className={`flex flex-col items-center transition-all ${
                    feedbackRating && star <= feedbackRating
                      ? "scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold transition-colors ${
                      feedbackRating && star <= feedbackRating
                        ? "bg-yellow-400 border-yellow-400 text-white shadow-lg"
                        : "border-slate-300 text-slate-600 hover:border-blue-400"
                    }`}
                  >
                    {star}
                  </div>
                  <span className="text-xs text-slate-600 mt-1">
                    {star === 1 && "Poor"}
                    {star === 2 && "Fair"}
                    {star === 3 && "Good"}
                    {star === 4 && "Very Good"}
                    {star === 5 && "Excellent"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Your Feedback
              </label>
              <textarea
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300 resize-none h-24"
                placeholder="Tell us what you think. What worked well? What could we improve?…"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>

            {/* Status Message */}
            {feedbackStatus && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  feedbackStatus.includes("Thank you")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : feedbackStatus.includes("Please")
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {feedbackStatus}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={feedbackLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {feedbackLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending…
                </span>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </form>

          {/* Footer Info */}
          <p className="text-xs text-slate-500 text-center">
            Your feedback is valuable and remains anonymous. Thank you for
            helping us improve!
          </p>
        </div>
      </div>
    </div>
  );
}
