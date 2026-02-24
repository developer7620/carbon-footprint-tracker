const express = require("express");
const router = express.Router();
const {
  createBusiness,
  getBusiness,
  updateBusiness,
  getIndustries,
} = require("../controllers/business.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Public route — anyone can see available industries
router.get("/industries", getIndustries);

// Protected routes — must be logged in
router.post("/", authenticate, createBusiness);
router.get("/", authenticate, getBusiness);
router.put("/", authenticate, updateBusiness);

module.exports = router;
