const prisma = require("../config/prisma");
const {
  getMonthlyEmissions,
  getEmissionsTrend,
  calculateCarbonIntensityScore,
} = require("../services/carbon.service");
const { getCache, setCache, buildKey } = require("../services/cache.service");

// Cache TTL constants
const CACHE_TTL = {
  MONTHLY: 3600, // 1 hour
  TRENDS: 1800, // 30 minutes
  BREAKDOWN: 3600, // 1 hour
  BENCHMARK: 3600, // 1 hour
  SCORE: 3600, // 1 hour
};

// GET /api/analytics/monthly?month=2&year=2026
const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const targetMonth = parseInt(req.query.month) || now.getMonth() + 1;
    const targetYear = parseInt(req.query.year) || now.getFullYear();

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

    // Check cache first
    const cacheKey = buildKey.monthly(business.id, targetMonth, targetYear);
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: `Monthly summary for ${targetMonth}/${targetYear} (cached)`,
        data: cached,
      });
    }

    // Cache miss — compute from DB
    const summary = await getMonthlyEmissions(
      business.id,
      targetMonth,
      targetYear,
    );
    const monthName = new Date(targetYear, targetMonth - 1).toLocaleString(
      "default",
      { month: "long", year: "numeric" },
    );

    const responseData = {
      business: { name: business.name, industry: business.industry },
      ...summary,
    };

    // Store in cache
    await setCache(cacheKey, responseData, CACHE_TTL.MONTHLY);

    res.status(200).json({
      success: true,
      message: `Monthly summary for ${monthName}`,
      data: responseData,
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
    const months = Math.min(parseInt(req.query.months) || 6, 12);

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    // Check cache
    const cacheKey = buildKey.trends(business.id, months);
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: `Emission trends (cached)`,
        data: cached,
      });
    }

    const trend = await getEmissionsTrend(business.id, months);
    const firstMonth = trend[0].totalCO2;
    const lastMonth = trend[trend.length - 1].totalCO2;
    const overallChange =
      firstMonth > 0
        ? parseFloat((((lastMonth - firstMonth) / firstMonth) * 100).toFixed(2))
        : null;

    const responseData = {
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
    };

    await setCache(cacheKey, responseData, CACHE_TTL.TRENDS);

    res.status(200).json({
      success: true,
      message: `Emission trends for last ${months} months`,
      data: responseData,
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

    const cacheKey = buildKey.breakdown(business.id, month, year);
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Category breakdown (cached)",
        data: cached,
      });
    }

    const { byCategory, byScope, totalCO2 } = await getMonthlyEmissions(
      business.id,
      month,
      year,
    );

    const sortedCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([name, data]) => ({ name, ...data }));

    const topEmitter = sortedCategories[0] || null;

    const responseData = {
      month,
      year,
      totalCO2,
      byScope,
      categories: sortedCategories,
      insight: topEmitter
        ? `${topEmitter.name} is your biggest emission source at ${topEmitter.percentage}% of total emissions`
        : "No emissions logged for this period",
    };

    await setCache(cacheKey, responseData, CACHE_TTL.BREAKDOWN);

    res.status(200).json({
      success: true,
      message: "Category breakdown fetched successfully",
      data: responseData,
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

    const cacheKey = buildKey.benchmark(business.id, month, year);
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Benchmark comparison (cached)",
        data: cached,
      });
    }

    const scoreData = await calculateCarbonIntensityScore(
      business.id,
      month,
      year,
    );
    const scoreHistory = await prisma.carbonIntensityScore.findMany({
      where: { businessId: business.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 6,
    });

    const responseData = {
      business: { name: business.name, industry: business.industry },
      currentMonth: { month, year, ...scoreData },
      scoreHistory,
    };

    await setCache(cacheKey, responseData, CACHE_TTL.BENCHMARK);

    res.status(200).json({
      success: true,
      message: "Benchmark comparison fetched successfully",
      data: responseData,
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

    const cacheKey = buildKey.score(business.id, month, year);
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Carbon intensity score (cached)",
        data: cached,
      });
    }

    const scoreData = await calculateCarbonIntensityScore(
      business.id,
      month,
      year,
    );

    const responseData = {
      business: { name: business.name, industry: business.industry },
      month,
      year,
      ...scoreData,
    };

    await setCache(cacheKey, responseData, CACHE_TTL.SCORE);

    res.status(200).json({
      success: true,
      message: "Carbon intensity score fetched successfully",
      data: responseData,
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
