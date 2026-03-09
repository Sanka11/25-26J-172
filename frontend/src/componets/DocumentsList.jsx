import React from "react";
import { appConfig } from "../config/env";

export default function DocumentsList({
  documents = [],
  loading = false,
  onRefresh = () => {},
  onUploadClick = () => {},
  onDocumentOpen = () => {},
  showUploadButton = false,
}) {
  const resolveDocumentUrl = (doc) =>
    doc?.doc_id
      ? `${appConfig.ML_BASE_URL}/documents/${encodeURIComponent(doc.doc_id)}`
      : "#";

  const openDocument = (doc) => {
    const url = resolveDocumentUrl(doc);
    if (url === "#") return;
    window.open(url, "_blank", "noopener,noreferrer");
    onDocumentOpen(doc, { action: "open", url });
  };

  const downloadDocument = (doc) => {
    const url = resolveDocumentUrl(doc);
    if (url === "#") return;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc?.pdf_name || doc?.doc_id || "document.pdf";
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onDocumentOpen(doc, { action: "download", url });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 text-blue-600"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <p className="text-sm font-semibold text-slate-900">
            PDFs ({documents.length})
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {showUploadButton && (
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              title="Upload new PDF"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Add
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
            title="Refresh"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2-8.12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex h-32 flex-col items-center justify-center">
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 [animation-delay:0.1s]" />
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 [animation-delay:0.2s]" />
            </div>
            <p className="text-xs text-slate-500">Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-2 h-10 w-10 text-slate-300"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            <p className="text-xs font-medium text-slate-600">
              No PDFs uploaded
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.doc_id}
                className="rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-300 hover:bg-blue-50"
                title={doc.pdf_name || doc.doc_id}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="h-6 w-6"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    </svg>
                    <span className="absolute bottom-1 text-[6px] font-bold text-white">
                      PDF
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {doc.pdf_name || "Document.pdf"}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      RAG source document
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openDocument(doc)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-3 w-3"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocument(doc)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-3 w-3"
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

      {documents.length > 0 && !loading && (
        <div className="shrink-0 border-t border-slate-200 bg-blue-50 px-3 py-2">
          <p className="text-xs font-medium text-blue-700">
            {documents.length} PDF{documents.length !== 1 ? "s" : ""} ready for
            RAG
          </p>
        </div>
      )}
    </div>
  );
}
