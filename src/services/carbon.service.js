const prisma = require("../config/prisma");

/**
 * Calculate CO₂ emission for a given category and quantity
 */
const calculateCO2 = async (categoryId, quantity) => {
  const category = await prisma.activityCategory.findUnique({
    where: { id: categoryId },
    include: { emissionFactor: true },
  });

  if (!category) throw new Error(`Category not found: ${categoryId}`);
  if (!category.emissionFactor)
    throw new Error(`No emission factor found for category: ${category.name}`);

  const co2Emission = parseFloat(
    (quantity * category.emissionFactor.factor).toFixed(4),
  );

  return {
    co2Emission,
    scope: category.scope,
    categoryName: category.name,
    factor: category.emissionFactor.factor,
    unit: category.unit,
    breakdown: {
      formula: `${quantity} ${category.unit} × ${category.emissionFactor.factor} kg CO₂/${category.unit}`,
      result: `${co2Emission} kg CO₂`,
      source: category.emissionFactor.source,
    },
  };
};

/**
 * Get monthly emission totals broken down by scope and category
 */
const getMonthlyEmissions = async (businessId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const logs = await prisma.activityLog.findMany({
    where: {
      businessId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      category: { include: { emissionFactor: true } },
    },
  });

  const totalCO2 = logs.reduce((sum, log) => sum + log.co2Emission, 0);

  const byScope = { scope1: 0, scope2: 0, scope3: 0 };
  logs.forEach((log) => {
    if (log.scope === 1) byScope.scope1 += log.co2Emission;
    if (log.scope === 2) byScope.scope2 += log.co2Emission;
    if (log.scope === 3) byScope.scope3 += log.co2Emission;
  });

  // Category breakdown with percentages
  const byCategory = {};
  logs.forEach((log) => {
    const name = log.category.name;
    if (!byCategory[name])
      byCategory[name] = { total: 0, scope: log.scope, logCount: 0 };
    byCategory[name].total += log.co2Emission;
    byCategory[name].logCount++;
  });

  // Add percentage contribution for each category
  Object.keys(byCategory).forEach((name) => {
    byCategory[name].percentage =
      totalCO2 > 0
        ? parseFloat(((byCategory[name].total / totalCO2) * 100).toFixed(2))
        : 0;
    byCategory[name].total = parseFloat(byCategory[name].total.toFixed(4));
  });

  // Scope percentages
  const scopePercentages = {
    scope1:
      totalCO2 > 0
        ? parseFloat(((byScope.scope1 / totalCO2) * 100).toFixed(2))
        : 0,
    scope2:
      totalCO2 > 0
        ? parseFloat(((byScope.scope2 / totalCO2) * 100).toFixed(2))
        : 0,
    scope3:
      totalCO2 > 0
        ? parseFloat(((byScope.scope3 / totalCO2) * 100).toFixed(2))
        : 0,
  };

  return {
    month,
    year,
    totalCO2: parseFloat(totalCO2.toFixed(4)),
    byScope: {
      scope1: parseFloat(byScope.scope1.toFixed(4)),
      scope2: parseFloat(byScope.scope2.toFixed(4)),
      scope3: parseFloat(byScope.scope3.toFixed(4)),
      percentages: scopePercentages,
    },
    byCategory,
    logCount: logs.length,
  };
};

/**
 * Get emissions trend across multiple months
 */
const getEmissionsTrend = async (businessId, months = 6) => {
  const trend = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const data = await getMonthlyEmissions(businessId, month, year);
    trend.push({
      month,
      year,
      label: date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      totalCO2: data.totalCO2,
      byScope: data.byScope,
      logCount: data.logCount,
    });
  }

  // Calculate month-over-month change
  for (let i = 1; i < trend.length; i++) {
    const prev = trend[i - 1].totalCO2;
    const curr = trend[i].totalCO2;
    if (prev > 0) {
      trend[i].changeFromPrevMonth = parseFloat(
        (((curr - prev) / prev) * 100).toFixed(2),
      );
      trend[i].changeDirection = curr > prev ? "increased" : "decreased";
    } else {
      trend[i].changeFromPrevMonth = null;
      trend[i].changeDirection = "no previous data";
    }
  }

  return trend;
};

/**
 * Calculate Carbon Intensity Score (0-100)
 * Higher score = better (emitting less than industry average)
 */
const calculateCarbonIntensityScore = async (businessId, month, year) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  const benchmark = await prisma.industryBenchmark.findUnique({
    where: { industry: business.industry },
  });

  const { totalCO2 } = await getMonthlyEmissions(businessId, month, year);

  if (totalCO2 === 0) {
    return {
      score: 100,
      totalCO2,
      benchmarkCO2: benchmark.avgMonthlyEmissions,
      message: "No emissions logged this month",
    };
  }

  // Score formula: higher is better
  // If you emit exactly at benchmark = score of 50
  // If you emit 0 = score of 100
  // If you emit 2x benchmark = score of 0
  let score = 100 - (totalCO2 / benchmark.avgMonthlyEmissions) * 50;
  score = Math.max(0, Math.min(100, parseFloat(score.toFixed(2))));

  const percentageVsBenchmark = parseFloat(
    ((totalCO2 / benchmark.avgMonthlyEmissions) * 100).toFixed(2),
  );
  const difference = parseFloat(
    (totalCO2 - benchmark.avgMonthlyEmissions).toFixed(4),
  );

  let performanceLabel;
  if (score >= 75) performanceLabel = "Excellent";
  else if (score >= 50) performanceLabel = "Good";
  else if (score >= 25) performanceLabel = "Needs Improvement";
  else performanceLabel = "Critical";

  // Store the score in database
  await prisma.carbonIntensityScore.upsert({
    where: { businessId_month_year: { businessId, month, year } },
    update: { score },
    create: { score, month, year, businessId },
  });

  return {
    score,
    performanceLabel,
    totalCO2,
    benchmarkCO2: benchmark.avgMonthlyEmissions,
    percentageVsBenchmark,
    difference,
    interpretation:
      difference > 0
        ? `You emit ${Math.abs(difference).toFixed(2)} kg CO₂ MORE than your industry average`
        : `You emit ${Math.abs(difference).toFixed(2)} kg CO₂ LESS than your industry average`,
  };
};

module.exports = {
  calculateCO2,
  getMonthlyEmissions,
  getEmissionsTrend,
  calculateCarbonIntensityScore,
};
