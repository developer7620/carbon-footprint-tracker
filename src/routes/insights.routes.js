const express = require("express");
const router = express.Router();
const {
  getInsights,
  generateInsights,
} = require("../controllers/insights.controller");
const { authenticate } = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Insights
 *   description: Proactive carbon emission insights and anomaly detection
 */

/**
 * @swagger
 * /api/v1/insights:
 *   get:
 *     summary: Get proactive insights for current month
 *     tags: [Insights]
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
 *         description: List of insights sorted by priority
 */
router.get("/", authenticate, getInsights);

/**
 * @swagger
 * /api/v1/insights/generate:
 *   post:
 *     summary: Manually trigger insight generation
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Freshly generated insights
 */
router.post("/generate", authenticate, generateInsights);

module.exports = router;
