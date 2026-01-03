import { useEffect, useState } from "react";
import { appConfig } from "../config/env";
import {
  fetchChatFeedbackList,
  deleteChatFeedback,
} from "../services/api/chatFeedbackApi";

function formatDate(ts) {
  if (!ts) return "";
  try {
    if (ts.toDate) {
      return ts.toDate().toLocaleString();
    }
    if (ts._seconds) {
      return new Date(ts._seconds * 1000).toLocaleString();
    }
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function Stars({ value }) {
  const v = Number(value) || 0;
  return (
    <div className="inline-flex items-center gap-0.5 text-xs">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= v ? "text-yellow-500" : "text-slate-300"}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-[11px] text-slate-500">{v.toFixed(1)}</span>
    </div>
  );
}

export default function AdminFeedback() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [filterRating, setFilterRating] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  const loadStats = async () => {
    try {
      const res = await fetch(appConfig.GET_CHAT_FEEDBACK_STATS_URL);
      if (!res.ok) return;
      const data = await res.json();
      setAvgRating(
        typeof data.average_rating === "number" ? data.average_rating : null
      );
      setRatingCount(
        typeof data.total_ratings === "number" ? data.total_ratings : 0
      );
    } catch (err) {
      console.error("Failed to load feedback stats", err);
    }
  };

  const loadList = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchChatFeedbackList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load feedback list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadList();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback entry? This cannot be undone.")) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteChatFeedback(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      await loadStats();
    } catch (err) {
      console.error(err);
      alert("Failed to delete feedback. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterRating === "all") return true;
    const r = Number(item.rating) || 0;
    if (filterRating === "high") return r >= 4;
    if (filterRating === "low") return r <= 2;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">
            Chatbot feedback & reviews
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 max-w-xl">
            Review what students are saying about the chatbot, monitor the
            overall satisfaction score, and clean up inappropriate feedback.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white flex items-center gap-2">
            <span className="font-semibold text-xs">
              {avgRating != null ? avgRating.toFixed(1) : "-"}
            </span>
            <span className="text-xs">/ 5</span>
            <span className="ml-1 text-[10px] text-slate-300">
              {ratingCount} rating{ratingCount === 1 ? "" : "s"}
            </span>
          </div>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="border border-slate-300 bg-white rounded-lg px-2 py-1 text-[11px] text-slate-700"
          >
            <option value="all">All ratings</option>
            <option value="high">High (4-5)</option>
            <option value="low">Low (1-2)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80">
          <span>
            {loading
              ? "Loading feedback…"
              : `${filteredItems.length} feedback entries`}
          </span>
          <button
            type="button"
            onClick={() => {
              loadStats();
              loadList();
            }}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>
        {filteredItems.length === 0 && !loading ? (
          <div className="px-4 py-6 text-center text-[11px] text-slate-500">
            No feedback entries match this filter yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs">
            {filteredItems.map((item) => (
              <li key={item.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <Stars value={item.rating} />
                  <span className="text-[10px] text-slate-400">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                {item.comment && (
                  <p className="text-slate-800 text-[11px] leading-snug">
                    {item.comment}
                  </p>
                )}
                <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-600">
                  {item.last_question && (
                    <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1">
                      <p className="font-semibold text-[10px] text-slate-500 mb-0.5">
                        Last question
                      </p>
                      <p className="line-clamp-3 whitespace-pre-line">
                        {item.last_question}
                      </p>
                    </div>
                  )}
                  {item.last_answer && (
                    <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1">
                      <p className="font-semibold text-[10px] text-slate-500 mb-0.5">
                        Bot answer
                      </p>
                      <p className="line-clamp-3 whitespace-pre-line">
                        {item.last_answer}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
