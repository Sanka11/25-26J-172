const express = require("express");
const router = express.Router();
const controller = require("./controller");

// GET /api/rl/decide/:studentId
router.get("/decide/:studentId", controller.decideRL);

module.exports = router;
