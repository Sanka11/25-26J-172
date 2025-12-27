import React, { useState } from "react";

export default function PdfUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Convert a PDF file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64String = reader.result.split(",")[1]; // remove prefix
        resolve(base64String);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a PDF file.");
      return;
    }

    setUploadStatus("Converting PDF to Base64...");

    try {
      const base64 = await convertToBase64(selectedFile);

      const formData = new FormData();
      formData.append("file_b64", base64);
      formData.append("filename", selectedFile.name);

      setUploadStatus("Uploading to ML backend...");

      const response = await fetch("http://127.0.0.1:8000/upload_pdf", {
        method: "POST",
        body: formData,
      });

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
