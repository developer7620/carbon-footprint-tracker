const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoriesByScope,
  getCategoryById,
} = require("../controllers/categories.controller");

// All category routes are public
// Anyone needs to know what categories exist before logging activities
router.get("/", getAllCategories);
router.get("/scope/:scope", getCategoriesByScope);
router.get("/:id", getCategoryById);

module.exports = router;
