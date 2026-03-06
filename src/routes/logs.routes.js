const express = require("express");
const router = express.Router();
const {
  createLog,
  getLogs,
  getLogById,
  deleteLog,
} = require("../controllers/logs.controller");
const { authenticate } = require("../middleware/auth.middleware");
const {
  createLogValidator,
  logIdValidator,
} = require("../middleware/validators");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: Log business activities and track CO₂ emissions
 */

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Log a new activity with auto CO₂ calculation
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLogRequest'
 *     responses:
 *       201:
 *         description: Activity logged with CO₂ calculation breakdown
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business or category not found
 */
router.post("/", authenticate, createLogValidator, validate, createLog);

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all activity logs with optional filters
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: Filter by emission scope
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to this date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of activity logs with CO₂ summary
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getLogs);

/**
 * @swagger
 * /api/logs/{id}:
 *   get:
 *     summary: Get a single activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Activity log details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Log not found
 */
router.get("/:id", authenticate, logIdValidator, validate, getLogById);

/**
 * @swagger
 * /api/logs/{id}:
 *   delete:
 *     summary: Delete an activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Log deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Log not found
 */
router.delete("/:id", authenticate, logIdValidator, validate, deleteLog);

module.exports = router;
