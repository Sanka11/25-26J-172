const express = require("express");
const fileUpload = require("express-fileupload");
const { uploadWeeklyCSV } = require("./weeklyUploadController");

const router = express.Router();

router.use(fileUpload());

router.post("/upload-weekly-csv", uploadWeeklyCSV);

module.exports = router;