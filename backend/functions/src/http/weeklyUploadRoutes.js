const express = require("express");
const multer = require("multer");

// Existing (old) CSV upload controller
const { uploadWeeklyCsv } = require("./uploadWeeklyCsvController");

// New (V2) CSV upload controller – SAFE version
const { uploadWeeklyCsvV2 } = require("./uploadWeeklyCsvV2Controller");

const router = express.Router();

// Multer setup (in-memory storage for CSV)
const upload = multer({
  storage: multer.memoryStorage(),
});

/**
 * ----------------------------------------
 * OLD CSV UPLOAD (KEEP AS FALLBACK)
 * POST /api/upload-weekly-csv
 * form-data: file=<csv>
 * ----------------------------------------
 */
router.post(
  "/upload-weekly-csv",
  upload.single("file"),
  uploadWeeklyCsv
);

/**
 * ----------------------------------------
 * NEW CSV UPLOAD (V2 – FINAL VERSION)
 * POST /api/upload-weekly-csv-v2
 * form-data: file=<csv>
 * ----------------------------------------
 */
router.post(
  "/upload-weekly-csv-v2",
  upload.single("file"),
  uploadWeeklyCsvV2
);

module.exports = router;