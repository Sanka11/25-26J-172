import React, { useState } from "react";
import { appConfig } from "../config/env";

export default function PdfUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadPhase, setUploadPhase] = useState("idle"); // idle | converting | uploading | done | error

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
    } catch (err) {
      const errorMsg = err?.message || "Unknown error occurred";
      setUploadStatus(`Error: ${errorMsg}`);
      console.error("Upload error:", err);
      setUploadPhase("error");
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Upload PDFs to Knowledge Base
        </h2>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          Add official policy documents, course handbooks, and other academic
          PDFs. These will be chunked, embedded, and stored in the ML service
          for the chatbot to answer student questions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] items-start">
        {/* Upload card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl px-6 py-10 text-center bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          >
            <p className="text-sm font-medium text-slate-800">
              Drag & drop PDFs here
            </p>
            <p className="mt-1 text-xs text-slate-500">
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

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              Max file size depends on your browser and backend limits.
            </p>
            <button
              onClick={handleUpload}
              disabled={
                uploadPhase === "converting" || uploadPhase === "uploading"
              }
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {uploadPhase === "converting" && "Converting…"}
              {uploadPhase === "uploading" && "Uploading…"}
              {uploadPhase === "idle" && "Upload to ML Service"}
              {uploadPhase === "done" && "Upload again"}
            </button>
          </div>
        </div>

        {/* Status / debug card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-800 mb-2">
            Upload status
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
          <pre className="text-[11px] text-slate-700 bg-slate-50 rounded-xl p-3 max-h-64 overflow-auto">
            {uploadStatus || "No uploads yet. Select a PDF to begin."}
          </pre>
        </div>
      </div>
    </div>
  );
}
