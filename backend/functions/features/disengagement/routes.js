const express = require("express");
const router = express.Router();
const controller = require("./controller");

/* ---------------------------------------
   ASYNC (MAIN – SAFE FOR FIREBASE)
--------------------------------------- */
router.get("/risk/all", controller.startAllStudentsJob);
router.get("/risk/all/result/:jobId", controller.getAllStudentsResult);

/* ---------------------------------------
   SYNC (TESTING ONLY – CAN TIMEOUT)
--------------------------------------- */
router.get("/risk/all-sync", controller.getAllStudentsSync);

/* ---------------------------------------
   SINGLE STUDENT
--------------------------------------- */
router.get("/risk/:id", controller.getSingleStudent);

module.exports = router;
