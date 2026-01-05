import React, { useState } from "react";
import { appConfig } from "../config/env";

export default function PdfUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a PDF file.");
      return;
    }

    setUploadStatus("Uploading to ML backend...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile); // FastAPI expects `file` for multipart uploads

      const response = await fetch(appConfig.ML_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        setUploadStatus(
          `Upload failed (status ${response.status}): ${
            text || "No error body returned."
          }`
        );
        return;
      }

      const result = await response.json();
      setUploadStatus(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("Error uploading PDF.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload PDF to ML Service</h2>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />
      <br />
      <br />

      <button onClick={handleUpload}>Upload PDF</button>

      <pre
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f3f3f3",
          borderRadius: "8px",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {uploadStatus}
      </pre>
    </div>
  );
}