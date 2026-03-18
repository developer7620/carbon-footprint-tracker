const prisma = require("../config/prisma");
const { calculateCO2 } = require("../services/carbon.service");
const { deleteCachePattern } = require("../services/cache.service");
const {
  detectAnomaly,
  generateMonthlyInsights,
} = require("../services/insights.service");

// POST /api/logs
const createLog = async (req, res) => {
  try {
    const { categoryId, quantity, date, notes } = req.body;
    const userId = req.user.id;

    // Get the business for this user
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found. Please create one first.",
      });
    }

    // Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number",
      });
    }

    // Calculate CO₂ using our service
    const calculation = await calculateCO2(categoryId, parseFloat(quantity));

    // Create the log
    const log = await prisma.activityLog.create({
      data: {
        quantity: parseFloat(quantity),
        co2Emission: calculation.co2Emission,
        scope: calculation.scope,
        date: new Date(date),
        notes: notes || null,
        businessId: business.id,
        categoryId,
      },
      include: {
        category: { include: { emissionFactor: true } },
      },
    });

    // Invalidate all analytics cache for this business
    await deleteCachePattern(`analytics:*:${business.id}:*`);

    // Run anomaly detection and insight generation in background
    // We don't await these — they shouldn't slow down the response
    const logWithCategory = await prisma.activityLog.findUnique({
      where: { id: log.id },
      include: { category: true },
    });

    const anomaly = await detectAnomaly(logWithCategory, business.id);

    // Generate insights without blocking response
    generateMonthlyInsights(business.id).catch((err) =>
      console.error("Insight generation error:", err.message),
    );

    // Include anomaly warning in response if detected
    const responseData = {
      log,
      calculation: calculation.breakdown,
    };

    if (anomaly) {
      responseData.anomalyAlert = anomaly;
    }

    return res.status(201).json({
      success: true,
      message: anomaly
        ? `Activity logged — ⚠️ Anomaly detected`
        : "Activity logged successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Create log error:", error);
    if (error.message.includes("Category not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/logs
const getLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      scope,
      categoryId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    // Build dynamic filter
    const where = { businessId: business.id };
    if (scope) where.scope = parseInt(scope);
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await prisma.activityLog.count({ where });

    const logs = await prisma.activityLog.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip,
      take: parseInt(limit),
    });

    // Summary of filtered results
    const totalCO2 = logs.reduce((sum, log) => sum + log.co2Emission, 0);

    res.status(200).json({
      success: true,
      message: "Logs fetched successfully",
      data: {
        logs,
        summary: {
          totalCO2Shown: parseFloat(totalCO2.toFixed(4)),
          unit: "kg CO₂",
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/logs/:id
const getLogById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: { category: { include: { emissionFactor: true } } },
    });

    if (!log) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }

    // Make sure this log belongs to the requesting user's business
    if (log.businessId !== business.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({
      success: true,
      message: "Log fetched successfully",
      data: { log },
    });
  } catch (error) {
    console.error("Get log by id error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /api/logs/:id
const deleteLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const log = await prisma.activityLog.findUnique({ where: { id } });

    if (!log) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }

    // Authorization check — only owner can delete
    if (log.businessId !== business.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await prisma.activityLog.delete({ where: { id } });

    await deleteCachePattern(`analytics:*:${business.id}:*`);

    res.status(200).json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (error) {
    console.error("Delete log error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createLog, getLogs, getLogById, deleteLog };
