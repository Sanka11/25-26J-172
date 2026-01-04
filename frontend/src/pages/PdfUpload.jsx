import React, { useEffect, useState } from "react";
import { appConfig } from "../config/env";

export default function PdfUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadPhase, setUploadPhase] = useState("idle"); // idle | converting | uploading | done | error
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");

  // Validate file is PDF
  const validatePDF = (file) => {
    if (!file) return { valid: false, error: "No file selected" };
    if (file.type !== "application/pdf") {
      return { valid: false, error: "Only PDF files are allowed" };
    }
    return { valid: true, error: null };
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a PDF file.");
      setUploadPhase("error");
      return;
    }

    setUploadPhase("uploading");
    setUploadStatus("Uploading to backend…");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(appConfig.ML_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        setUploadStatus(
          `Upload failed (status ${response.status}):\n${
            text || "No error body returned."
          }`
        );
        setUploadPhase("error");
        return;
      }

      let json;
      try {
        json = await response.json();
      } catch (parseErr) {
        console.error(parseErr);
        setUploadStatus(
          "Upload succeeded but the server returned invalid JSON. Check ML service logs."
        );
        setUploadPhase("error");
        return;
      }
      setUploadStatus(JSON.stringify(json, null, 2));
      setUploadPhase("done");

      // Refresh document list after successful upload
      await loadDocuments();
    } catch (err) {
      const errorMsg = err?.message || "Unknown error occurred";
      setUploadStatus(`Error: ${errorMsg}`);
      console.error("Upload error:", err);
      setUploadPhase("error");
    }
  };

  const loadDocuments = async () => {
    try {
      setDocsLoading(true);
      setDocsError("");
      const res = await fetch(appConfig.ML_LIST_DOCS_URL);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to load documents (${res.status}): ${text || ""}`
        );
      }
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (err) {
      console.error("Load documents error:", err);
      setDocsError(
        err?.message || "Failed to load uploaded document list from ML service."
      );
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewDocument = (doc) => {
    if (!doc?.doc_id) return;
    const url = `${appConfig.ML_BASE_URL}/documents/${encodeURIComponent(
      doc.doc_id
    )}`;
    window.open(url, "_blank");
  };

  const handleDeleteDocument = async (doc) => {
    if (!doc?.doc_id) return;
    const label = doc.pdf_name || doc.doc_id;
    const confirmed = window.confirm(
      `Delete document "${label}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${appConfig.ML_BASE_URL}/documents/${encodeURIComponent(doc.doc_id)}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to delete document (${res.status}): ${text || ""}`
        );
      }

      // Refresh list after deletion
      await loadDocuments();
    } catch (err) {
      console.error("Delete document error:", err);
      setDocsError(err?.message || "Failed to delete document on ML service.");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      const validation = validatePDF(file);
      if (!validation.valid) {
        setUploadStatus(validation.error);
        setUploadPhase("error");
        return;
      }
      setSelectedFile(file);
      setUploadStatus("");
      setUploadPhase("idle");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50 px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Upload Knowledge Base PDFs
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            Add course handbooks, policy documents, and other academic PDFs.
            These will be chunked and embedded so the chatbot can answer
            detailed student questions.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-7 mb-6 md:mb-8 transform transition-all duration-300 hover:shadow-3xl">
          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] items-start">
            {/* Upload card */}
            <div className="space-y-5">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl px-6 py-10 text-center bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                <p className="text-sm md:text-base font-semibold text-slate-800">
                  Drag & drop PDFs here
                </p>
                <p className="mt-1 text-xs md:text-sm text-slate-500">
                  or click to browse a single file
                </p>
                <label className="mt-4 inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0] || null;
                      if (file) {
                        const validation = validatePDF(file);
                        if (!validation.valid) {
                          setUploadStatus(validation.error);
                          setUploadPhase("error");
                          return;
                        }
                      }
                      setSelectedFile(file);
                      setUploadStatus("");
                      setUploadPhase("idle");
                    }}
                  />
                  <span>Choose PDF</span>
                </label>
                {selectedFile && (
                  <p className="mt-3 text-xs text-slate-600">
                    Selected:{" "}
                    <span className="font-medium">{selectedFile.name}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] md:text-xs">
                <p className="text-slate-500">
                  Max file size depends on your browser and backend limits.
                </p>
                <button
                  onClick={handleUpload}
                  disabled={
                    uploadPhase === "converting" || uploadPhase === "uploading"
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 transition-all"
                >
                  {uploadPhase === "converting" && "Converting…"}
                  {uploadPhase === "uploading" && "Uploading…"}
                  {uploadPhase === "idle" && "Upload to ML Service"}
                  {uploadPhase === "done" && "Upload again"}
                </button>
              </div>
            </div>

            {/* Status / debug card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-5">
              <p className="text-xs font-semibold text-slate-800 mb-2 flex items-center justify-between">
                <span>Upload status</span>
              </p>
              <div className="mb-2 flex items-center gap-2 text-[11px]">
                {uploadPhase === "done" && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                    ✓ Upload completed
                  </span>
                )}
                {uploadPhase === "error" && uploadStatus && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                    ⚠ Error
                  </span>
                )}
                {uploadPhase === "idle" && !uploadStatus && (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-600 border border-slate-200">
                    No uploads yet
                  </span>
                )}
              </div>
              <pre className="text-[11px] md:text-xs text-slate-700 bg-white rounded-xl p-3 max-h-64 overflow-auto border border-slate-100">
                {uploadStatus || "No uploads yet. Select a PDF to begin."}
              </pre>
            </div>
          </div>
        </div>

        {/* Uploaded documents list */}
        <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-900">
                Uploaded documents
              </h2>
              <p className="text-[11px] md:text-xs text-slate-500">
                These PDFs are stored locally on the ML service and indexed in
                the vector database for chatbot retrieval.
              </p>
            </div>
            <button
              type="button"
              onClick={loadDocuments}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              Refresh
            </button>
          </div>

          {docsError && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700">
              {docsError}
            </div>
          )}

          {docsLoading ? (
            <p className="text-[11px] text-slate-500">Loading documents…</p>
          ) : documents.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              No documents uploaded yet. Once you upload PDFs, they will appear
              here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 text-[11px] md:text-xs">
              {documents.map((doc) => {
                const ts = doc.uploaded_at;
                let formatted = "";
                if (typeof ts === "number") {
                  formatted = new Date(ts * 1000).toLocaleString();
                }
                return (
                  <li
                    key={doc.doc_id}
                    className="py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {doc.pdf_name || doc.doc_id}
                      </p>
                      {formatted && (
                        <p className="text-[10px] text-slate-500">
                          Uploaded at {formatted}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
                        className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-100 shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
