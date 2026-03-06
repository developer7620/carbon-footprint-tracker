const { body, param, query } = require("express-validator");

// ─── Auth Validators ──────────────────────────────────────────────

const registerValidator = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// ─── Business Validators ──────────────────────────────────────────

const createBusinessValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Business name must be between 2 and 100 characters"),
  body("industry").trim().notEmpty().withMessage("Industry is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("employeeCount")
    .isInt({ min: 1 })
    .withMessage("Employee count must be a positive integer"),
  body("annualRevenue")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Annual revenue must be a positive number"),
];

const updateBusinessValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Business name must be between 2 and 100 characters"),
  body("employeeCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Employee count must be a positive integer"),
  body("annualRevenue")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Annual revenue must be a positive number"),
];

// ─── Log Validators ───────────────────────────────────────────────

const createLogValidator = [
  body("categoryId").isUUID().withMessage("Category ID must be a valid UUID"),
  body("quantity")
    .isFloat({ min: 0.01 })
    .withMessage("Quantity must be a positive number"),
  body("date")
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date (e.g. 2026-02-01)")
    .toDate(),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

const logIdValidator = [
  param("id").isUUID().withMessage("Log ID must be a valid UUID"),
];

// ─── Analytics Validators ─────────────────────────────────────────

const monthYearValidator = [
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),
  query("year")
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage("Year must be between 2020 and 2100"),
];

const trendsValidator = [
  query("months")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Months must be between 1 and 12"),
];

module.exports = {
  registerValidator,
  loginValidator,
  createBusinessValidator,
  updateBusinessValidator,
  createLogValidator,
  logIdValidator,
  monthYearValidator,
  trendsValidator,
};
