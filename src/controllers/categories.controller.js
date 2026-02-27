const prisma = require("../config/prisma");

// GET /api/categories
// Returns all categories with their emission factors
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.activityCategory.findMany({
      include: {
        emissionFactor: true,
      },
      orderBy: { scope: "asc" }, // Scope 1 first, then 2, then 3
    });

    // Group by scope for better readability
    const grouped = {
      scope1: categories.filter((c) => c.scope === 1),
      scope2: categories.filter((c) => c.scope === 2),
      scope3: categories.filter((c) => c.scope === 3),
    };

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: {
        total: categories.length,
        grouped,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/categories/scope/:scope
// Returns categories filtered by scope (1, 2, or 3)
const getCategoriesByScope = async (req, res) => {
  try {
    const scope = parseInt(req.params.scope);

    if (![1, 2, 3].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scope. Must be 1, 2, or 3",
      });
    }

    const categories = await prisma.activityCategory.findMany({
      where: { scope },
      include: { emissionFactor: true },
    });

    const scopeNames = {
      1: "Direct Emissions",
      2: "Indirect Energy",
      3: "Value Chain",
    };

    res.status(200).json({
      success: true,
      message: `Scope ${scope} categories fetched successfully`,
      data: {
        scope,
        scopeName: scopeNames[scope],
        total: categories.length,
        categories,
      },
    });
  } catch (error) {
    console.error("Get categories by scope error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/categories/:id
// Returns a single category with its emission factor
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.activityCategory.findUnique({
      where: { id },
      include: { emissionFactor: true },
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Show what the calculation will look like
    const exampleCalculation = {
      example: `If you use 100 ${category.unit} of ${category.name}`,
      co2Produced: `${(100 * category.emissionFactor.factor).toFixed(2)} kg CO₂`,
      formula: `100 × ${category.emissionFactor.factor} = ${(100 * category.emissionFactor.factor).toFixed(2)} kg CO₂`,
    };

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: { category, exampleCalculation },
    });
  } catch (error) {
    console.error("Get category by id error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getAllCategories, getCategoriesByScope, getCategoryById };
