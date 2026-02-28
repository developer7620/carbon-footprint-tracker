const prisma = require("../config/prisma");
const {
  getMonthlyEmissions,
  getEmissionsTrend,
  calculateCarbonIntensityScore,
} = require("../services/carbon.service");

// GET /api/analytics/monthly?month=2&year=2026
const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();

    if (targetMonth < 1 || targetMonth > 12) {
      return res
        .status(400)
        .json({ success: false, message: "Month must be between 1 and 12" });
    }

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const summary = await getMonthlyEmissions(
      business.id,
      targetMonth,
      targetYear,
    );

    // Get the month name for display
    const monthName = new Date(targetYear, targetMonth - 1).toLocaleString(
      "default",
      {
        month: "long",
        year: "numeric",
      },
    );

    res.status(200).json({
      success: true,
      message: `Monthly summary for ${monthName}`,
      data: {
        business: { name: business.name, industry: business.industry },
        ...summary,
      },
    });
  } catch (error) {
    console.error("Monthly summary error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/analytics/trends?months=6
const getTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const months = Math.min(parseInt(req.query.months) || 6, 12); // max 12 months

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const trend = await getEmissionsTrend(business.id, months);

    // Overall trend direction
    const firstMonth = trend[0].totalCO2;
    const lastMonth = trend[trend.length - 1].totalCO2;
    const overallChange =
      firstMonth > 0
        ? parseFloat((((lastMonth - firstMonth) / firstMonth) * 100).toFixed(2))
        : null;

    res.status(200).json({
      success: true,
      message: `Emission trends for last ${months} months`,
      data: {
        business: { name: business.name, industry: business.industry },
        trend,
        summary: {
          months,
          overallChangePercent: overallChange,
          overallDirection:
            overallChange !== null
              ? overallChange > 0
                ? "Emissions increased"
                : "Emissions decreased"
              : "Insufficient data",
          totalCO2InPeriod: parseFloat(
            trend.reduce((s, t) => s + t.totalCO2, 0).toFixed(4),
          ),
        },
      },
    });
  } catch (error) {
    console.error("Trends error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/analytics/breakdown?month=2&year=2026
const getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const { byCategory, byScope, totalCO2 } = await getMonthlyEmissions(
      business.id,
      month,
      year,
    );

    // Sort categories by emission amount (highest first)
    const sortedCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([name, data]) => ({ name, ...data }));

    // Top emitter insight
    const topEmitter = sortedCategories[0] || null;

    res.status(200).json({
      success: true,
      message: "Category breakdown fetched successfully",
      data: {
        month,
        year,
        totalCO2,
        byScope,
        categories: sortedCategories,
        insight: topEmitter
          ? `${topEmitter.name} is your biggest emission source at ${topEmitter.percentage}% of total emissions`
          : "No emissions logged for this period",
      },
    });
  } catch (error) {
    console.error("Breakdown error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/analytics/benchmark?month=2&year=2026
const getBenchmarkComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const scoreData = await calculateCarbonIntensityScore(
      business.id,
      month,
      year,
    );

    // Get score history
    const scoreHistory = await prisma.carbonIntensityScore.findMany({
      where: { businessId: business.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
    });

    res.status(200).json({
      success: true,
      message: "Benchmark comparison fetched successfully",
      data: {
        business: { name: business.name, industry: business.industry },
        currentMonth: { month, year, ...scoreData },
        scoreHistory,
      },
    });
  } catch (error) {
    console.error("Benchmark error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/analytics/score
const getCarbonScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const scoreData = await calculateCarbonIntensityScore(
      business.id,
      month,
      year,
    );

    res.status(200).json({
      success: true,
      message: "Carbon intensity score fetched successfully",
      data: {
        business: { name: business.name, industry: business.industry },
        month,
        year,
        ...scoreData,
      },
    });
  } catch (error) {
    console.error("Score error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getMonthlySummary,
  getTrends,
  getCategoryBreakdown,
  getBenchmarkComparison,
  getCarbonScore,
};
