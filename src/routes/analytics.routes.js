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
const {
  monthYearValidator,
  trendsValidator,
} = require("../middleware/validators");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Carbon emissions analytics and reporting
 */

/**
 * @swagger
 * /api/analytics/monthly:
 *   get:
 *     summary: Monthly emissions summary broken down by Scope 1/2/3
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (defaults to current month)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (defaults to current year)
 *     responses:
 *       200:
 *         description: Monthly CO₂ summary with scope breakdown and percentages
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/monthly",
  authenticate,
  monthYearValidator,
  validate,
  getMonthlySummary,
);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Historical emission trends with month-over-month change
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Trend data with month-over-month percentage change
 *       401:
 *         description: Unauthorized
 */
router.get("/trends", authenticate, trendsValidator, validate, getTrends);

/**
 * @swagger
 * /api/analytics/breakdown:
 *   get:
 *     summary: Category-wise emission breakdown sorted by highest emitter
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categories sorted by CO₂ contribution with percentages and insight
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/breakdown",
  authenticate,
  monthYearValidator,
  validate,
  getCategoryBreakdown,
);

/**
 * @swagger
 * /api/analytics/benchmark:
 *   get:
 *     summary: Compare emissions against industry benchmark
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Benchmark comparison with carbon intensity score history
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/benchmark",
  authenticate,
  monthYearValidator,
  validate,
  getBenchmarkComparison,
);

/**
 * @swagger
 * /api/analytics/score:
 *   get:
 *     summary: Get carbon intensity score (0-100)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carbon intensity score with performance label and interpretation
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/score",
  authenticate,
  monthYearValidator,
  validate,
  getCarbonScore,
);

module.exports = router;
