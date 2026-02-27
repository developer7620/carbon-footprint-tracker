const prisma = require("../config/prisma");

/**
 * Calculate CO₂ emission for a given category and quantity
 * Formula: CO₂ (kg) = quantity × emission_factor
 */
const calculateCO2 = async (categoryId, quantity) => {
  const category = await prisma.activityCategory.findUnique({
    where: { id: categoryId },
    include: { emissionFactor: true },
  });

  if (!category) {
    throw new Error(`Category not found: ${categoryId}`);
  }

  if (!category.emissionFactor) {
    throw new Error(`No emission factor found for category: ${category.name}`);
  }

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
 * Get monthly emission totals for a business
 * broken down by scope and category
 */
const getMonthlyEmissions = async (businessId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); // last day of month

  const logs = await prisma.activityLog.findMany({
    where: {
      businessId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      category: { include: { emissionFactor: true } },
    },
  });

  // Total emissions
  const totalCO2 = logs.reduce((sum, log) => sum + log.co2Emission, 0);

  // Break down by scope
  const byScope = { scope1: 0, scope2: 0, scope3: 0 };
  logs.forEach((log) => {
    if (log.scope === 1) byScope.scope1 += log.co2Emission;
    if (log.scope === 2) byScope.scope2 += log.co2Emission;
    if (log.scope === 3) byScope.scope3 += log.co2Emission;
  });

  // Break down by category
  const byCategory = {};
  logs.forEach((log) => {
    const name = log.category.name;
    if (!byCategory[name]) byCategory[name] = 0;
    byCategory[name] += log.co2Emission;
  });

  return {
    month,
    year,
    totalCO2: parseFloat(totalCO2.toFixed(4)),
    byScope: {
      scope1: parseFloat(byScope.scope1.toFixed(4)),
      scope2: parseFloat(byScope.scope2.toFixed(4)),
      scope3: parseFloat(byScope.scope3.toFixed(4)),
    },
    byCategory,
    logCount: logs.length,
  };
};

module.exports = { calculateCO2, getMonthlyEmissions };
