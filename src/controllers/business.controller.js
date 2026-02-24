const prisma = require("../config/prisma");

// GET /api/business/industries
const getIndustries = async (req, res) => {
  try {
    const benchmarks = await prisma.industryBenchmark.findMany({
      select: { industry: true, avgMonthlyEmissions: true, unit: true },
    });

    res.status(200).json({
      success: true,
      message: "Industries fetched successfully",
      data: benchmarks,
    });
  } catch (error) {
    console.error("Get industries error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/business
const createBusiness = async (req, res) => {
  try {
    const { name, industry, location, employeeCount, annualRevenue } = req.body;
    const userId = req.user.id;

    // Check if user already has a business
    const existingBusiness = await prisma.business.findUnique({
      where: { userId },
    });
    if (existingBusiness) {
      return res
        .status(409)
        .json({ success: false, message: "Business profile already exists" });
    }

    // Validate industry exists in our benchmark data
    const benchmark = await prisma.industryBenchmark.findUnique({
      where: { industry },
    });
    if (!benchmark) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid industry. Use GET /api/business/industries to see valid options",
      });
    }

    // Create business
    const business = await prisma.business.create({
      data: {
        name,
        industry,
        location,
        employeeCount: parseInt(employeeCount),
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        userId,
      },
      include: {
        user: { select: { email: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Business profile created successfully",
      data: {
        business,
        benchmark: {
          avgMonthlyEmissions: benchmark.avgMonthlyEmissions,
          unit: benchmark.unit,
          message: `Your industry average is ${benchmark.avgMonthlyEmissions} kg CO₂/month`,
        },
      },
    });
  } catch (error) {
    console.error("Create business error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/business
const getBusiness = async (req, res) => {
  try {
    const userId = req.user.id;

    const business = await prisma.business.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true } },
        _count: {
          select: { activityLogs: true }, // total number of logs
        },
      },
    });

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    // Fetch benchmark for this industry
    const benchmark = await prisma.industryBenchmark.findUnique({
      where: { industry: business.industry },
    });

    res.status(200).json({
      success: true,
      message: "Business profile fetched successfully",
      data: {
        business,
        benchmark: {
          avgMonthlyEmissions: benchmark.avgMonthlyEmissions,
          unit: benchmark.unit,
        },
      },
    });
  } catch (error) {
    console.error("Get business error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/business
const updateBusiness = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, location, employeeCount, annualRevenue, industry } = req.body;

    // Check business exists
    const existing = await prisma.business.findUnique({ where: { userId } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    // If industry is being changed, validate it
    if (industry && industry !== existing.industry) {
      const benchmark = await prisma.industryBenchmark.findUnique({
        where: { industry },
      });
      if (!benchmark) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid industry. Use GET /api/business/industries to see valid options",
        });
      }
    }

    // Build update object dynamically — only update fields that were sent
    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (employeeCount) updateData.employeeCount = parseInt(employeeCount);
    if (annualRevenue !== undefined)
      updateData.annualRevenue = parseFloat(annualRevenue);
    if (industry) updateData.industry = industry;

    const business = await prisma.business.update({
      where: { userId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      data: { business },
    });
  } catch (error) {
    console.error("Update business error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createBusiness, getBusiness, updateBusiness, getIndustries };
