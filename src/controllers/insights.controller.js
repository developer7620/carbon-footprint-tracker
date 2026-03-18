const prisma = require("../config/prisma");
const { generateMonthlyInsights } = require("../services/insights.service");

// GET /api/v1/insights
const getInsights = async (req, res) => {
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

    const insights = await prisma.emissionInsight.findMany({
      where: { businessId: business.id, month, year },
      orderBy: { createdAt: "desc" },
    });

    // Map insight types to priority levels for frontend
    const priorityMap = {
      anomaly: 1,
      benchmark_warning: 2,
      consecutive_increase: 3,
      scope_imbalance: 4,
      top_emitter: 5,
    };

    const sorted = insights.sort(
      (a, b) => (priorityMap[a.type] || 9) - (priorityMap[b.type] || 9),
    );

    res.status(200).json({
      success: true,
      message: `Insights for ${month}/${year}`,
      data: {
        business: { name: business.name, industry: business.industry },
        month,
        year,
        total: sorted.length,
        insights: sorted,
      },
    });
  } catch (error) {
    console.error("Get insights error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/insights/generate — manually trigger insight generation
const generateInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const insights = await generateMonthlyInsights(business.id);

    res.status(200).json({
      success: true,
      message: `Generated ${insights.length} insights`,
      data: { insights },
    });
  } catch (error) {
    console.error("Generate insights error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getInsights, generateInsights };
