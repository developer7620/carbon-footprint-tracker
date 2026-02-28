const express = require("express");
const router = express.Router();
const {
  getMonthlySummary,
  getTrends,
  getCategoryBreakdown,
  getBenchmarkComparison,
  getCarbonScore,
} = require("../controllers/analytics.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All analytics routes are protected
router.get("/monthly", authenticate, getMonthlySummary);
router.get("/trends", authenticate, getTrends);
router.get("/breakdown", authenticate, getCategoryBreakdown);
router.get("/benchmark", authenticate, getBenchmarkComparison);
router.get("/score", authenticate, getCarbonScore);

module.exports = router;
