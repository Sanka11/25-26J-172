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
      </div>
    </div>
  );
}
