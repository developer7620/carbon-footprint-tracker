const express = require("express");
const router = express.Router();
const {
  createBusiness,
  getBusiness,
  updateBusiness,
  getIndustries,
} = require("../controllers/business.controller");
const { authenticate } = require("../middleware/auth.middleware");
const {
  createBusinessValidator,
  updateBusinessValidator,
} = require("../middleware/validators");
const { validate } = require("../middleware/validate.middleware");

/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Business profile management
 */

/**
 * @swagger
 * /api/business/industries:
 *   get:
 *     summary: Get all available industries with benchmark data
 *     tags: [Business]
 *     responses:
 *       200:
 *         description: List of industries with average monthly emissions
 */
router.get("/industries", getIndustries);

/**
 * @swagger
 * /api/business:
 *   post:
 *     summary: Create a business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBusinessRequest'
 *     responses:
 *       201:
 *         description: Business profile created successfully
 *       400:
 *         description: Validation failed or invalid industry
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Business profile already exists
 */
router.post(
  "/",
  authenticate,
  createBusinessValidator,
  validate,
  createBusiness,
);

/**
 * @swagger
 * /api/business:
 *   get:
 *     summary: Get your business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business profile with benchmark data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Business profile not found
 */
router.get("/", authenticate, getBusiness);

/**
 * @swagger
 * /api/business:
 *   put:
 *     summary: Update your business profile
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               employeeCount:
 *                 type: integer
 *               annualRevenue:
 *                 type: number
 *     responses:
 *       200:
 *         description: Business profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/",
  authenticate,
  updateBusinessValidator,
  validate,
  updateBusiness,
);

module.exports = router;
