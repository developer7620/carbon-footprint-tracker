const express = require("express");
const router = express.Router();
const {
  createLog,
  getLogs,
  getLogById,
  deleteLog,
} = require("../controllers/logs.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All log routes are protected
router.post("/", authenticate, createLog);
router.get("/", authenticate, getLogs);
router.get("/:id", authenticate, getLogById);
router.delete("/:id", authenticate, deleteLog);

module.exports = router;
