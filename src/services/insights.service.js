const prisma = require("../config/prisma");

const ANOMALY_THRESHOLD = 3.0; // flag if 3x above average

/**
 * Detect anomaly for a newly created log
 * Compares against 3-month historical average for same category
 */
const detectAnomaly = async (log, businessId) => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Get historical logs for same category
  const historicalLogs = await prisma.activityLog.findMany({
    where: {
      businessId,
      categoryId: log.categoryId,
      date: { gte: threeMonthsAgo },
      id: { not: log.id }, // exclude the current log
    },
  });

  if (historicalLogs.length < 2) return null; // not enough history

  const avgQuantity =
    historicalLogs.reduce((s, l) => s + l.quantity, 0) / historicalLogs.length;
  const ratio = log.quantity / avgQuantity;

  if (ratio >= ANOMALY_THRESHOLD) {
    return {
      type: "anomaly",
      severity: ratio >= 5 ? "critical" : "warning",
      message: `Your ${log.category.name} usage this entry (${log.quantity} ${log.category.unit}) is ${((ratio - 1) * 100).toFixed(0)}% higher than your ${historicalLogs.length}-entry average (${avgQuantity.toFixed(2)} ${log.category.unit}). Was this expected?`,
      data: {
        currentQuantity: log.quantity,
        historicalAverage: parseFloat(avgQuantity.toFixed(2)),
        ratio: parseFloat(ratio.toFixed(2)),
        categoryName: log.category.name,
        unit: log.category.unit,
      },
    };
  }

  return null;
};

/**
 * Generate proactive insights for current month
 * Runs automatically after every log creation
 */
const generateMonthlyInsights = async (businessId) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const insights = [];

  // Get current month logs
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const logs = await prisma.activityLog.findMany({
    where: { businessId, date: { gte: startDate, lte: endDate } },
    include: { category: true },
  });

  if (logs.length === 0) return [];

  const totalCO2 = logs.reduce((s, l) => s + l.co2Emission, 0);

  // ── Insight 1: Top Emitter ──────────────────────────────────────
  const byCategory = {};
  logs.forEach((log) => {
    const name = log.category.name;
    if (!byCategory[name]) byCategory[name] = 0;
    byCategory[name] += log.co2Emission;
  });

  const topCategory = Object.entries(byCategory).sort(
    ([, a], [, b]) => b - a,
  )[0];

  if (topCategory) {
    const percentage = ((topCategory[1] / totalCO2) * 100).toFixed(1);
    insights.push({
      type: "top_emitter",
      message: `${topCategory[0]} is your biggest emission source this month at ${percentage}% of total emissions (${topCategory[1].toFixed(2)} kg CO₂).`,
      data: {
        category: topCategory[0],
        co2: topCategory[1],
        percentage: parseFloat(percentage),
      },
    });
  }

  // ── Insight 2: Benchmark Warning ───────────────────────────────
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  const benchmark = await prisma.industryBenchmark.findUnique({
    where: { industry: business.industry },
  });

  if (benchmark) {
    const percentageUsed = (totalCO2 / benchmark.avgMonthlyEmissions) * 100;
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedMonthly = (totalCO2 / dayOfMonth) * daysInMonth;

    if (
      projectedMonthly > benchmark.avgMonthlyEmissions &&
      percentageUsed > 60
    ) {
      insights.push({
        type: "benchmark_warning",
        message: `At your current rate you are projected to emit ${projectedMonthly.toFixed(2)} kg CO₂ this month — ${((projectedMonthly / benchmark.avgMonthlyEmissions) * 100 - 100).toFixed(1)}% above your industry average of ${benchmark.avgMonthlyEmissions} kg CO₂.`,
        data: {
          currentCO2: parseFloat(totalCO2.toFixed(2)),
          projectedCO2: parseFloat(projectedMonthly.toFixed(2)),
          benchmarkCO2: benchmark.avgMonthlyEmissions,
          percentageUsed: parseFloat(percentageUsed.toFixed(2)),
        },
      });
    }
  }

  // ── Insight 3: Scope Imbalance ─────────────────────────────────
  const byScope = { 1: 0, 2: 0, 3: 0 };
  logs.forEach((log) => {
    byScope[log.scope] += log.co2Emission;
  });

  const dominantScope = Object.entries(byScope).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const dominantPercentage =
    totalCO2 > 0 ? ((dominantScope[1] / totalCO2) * 100).toFixed(1) : 0;

  if (parseFloat(dominantPercentage) > 70) {
    const scopeNames = {
      1: "Direct emissions (Scope 1) — Consider fuel-efficient vehicles or on-site renewable energy",
      2: "Purchased electricity (Scope 2) — Consider switching to a renewable energy tariff",
      3: "Value chain emissions (Scope 3) — Consider optimizing logistics and waste management",
    };
    insights.push({
      type: "scope_imbalance",
      message: `${dominantPercentage}% of your emissions come from ${scopeNames[dominantScope[0]]}.`,
      data: {
        dominantScope: parseInt(dominantScope[0]),
        percentage: parseFloat(dominantPercentage),
        byScope,
      },
    });
  }

  // ── Insight 4: Consecutive Monthly Increase ────────────────────
  const lastThreeMonths = [];
  for (let i = 3; i >= 1; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const mLogs = await prisma.activityLog.findMany({
      where: { businessId, date: { gte: mStart, lte: mEnd } },
    });
    lastThreeMonths.push(mLogs.reduce((s, l) => s + l.co2Emission, 0));
  }

  const isConsecutiveIncrease =
    lastThreeMonths[0] > 0 &&
    lastThreeMonths[1] > lastThreeMonths[0] &&
    lastThreeMonths[2] > lastThreeMonths[1];

  if (isConsecutiveIncrease) {
    insights.push({
      type: "consecutive_increase",
      message: `Your emissions have increased 3 months in a row. Review your reduction goals — your current trajectory may make your targets harder to achieve.`,
      data: {
        trend: lastThreeMonths,
        increasePercent: parseFloat(
          (
            ((lastThreeMonths[2] - lastThreeMonths[0]) / lastThreeMonths[0]) *
            100
          ).toFixed(2),
        ),
      },
    });
  }

  // ── Store all insights ─────────────────────────────────────────
  for (const insight of insights) {
    await prisma.emissionInsight.upsert({
      where: {
        // Use a composite approach — delete old same-type insight for this month first
        id:
          (
            await prisma.emissionInsight.findFirst({
              where: { businessId, type: insight.type, month, year },
            })
          )?.id || "new",
      },
      update: { message: insight.message, data: insight.data },
      create: { ...insight, month, year, businessId },
    });
  }

  return insights;
};

module.exports = { detectAnomaly, generateMonthlyInsights };
