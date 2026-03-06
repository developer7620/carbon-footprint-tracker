const { validationResult } = require("express-validator");

/**
 * Runs after express-validator checks
 * If errors exist, returns 400 with all validation errors
 * If no errors, calls next() to proceed to controller
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

module.exports = { validate };
