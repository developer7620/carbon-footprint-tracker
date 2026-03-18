require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  // ─── SCOPE 1 — Direct Emissions ───────────────────────────────
  {
    name: "Petrol (Gasoline)",
    unit: "litres",
    description: "Fuel combustion in company-owned petrol vehicles",
    scope: 1,
    factor: 2.31,
    factorUnit: "kg CO2 per litre",
    source: "IPCC 2023",
  },
  {
    name: "Diesel",
    unit: "litres",
    description:
      "Fuel combustion in company-owned diesel vehicles or generators",
    scope: 1,
    factor: 2.68,
    factorUnit: "kg CO2 per litre",
    source: "IPCC 2023",
  },
  {
    name: "LPG",
    unit: "litres",
    description: "Liquefied petroleum gas used in cooking or heating",
    scope: 1,
    factor: 1.56,
    factorUnit: "kg CO2 per litre",
    source: "IPCC 2023",
  },
  {
    name: "Natural Gas",
    unit: "cubic metres",
    description: "Natural gas used for heating or cooking on-site",
    scope: 1,
    factor: 2.04,
    factorUnit: "kg CO2 per cubic metre",
    source: "EPA 2023",
  },
  {
    name: "Coal",
    unit: "kg",
    description: "Coal combustion for on-site energy generation",
    scope: 1,
    factor: 2.42,
    factorUnit: "kg CO2 per kg",
    source: "IPCC 2023",
  },

  // ─── SCOPE 2 — Indirect Energy Emissions ──────────────────────
  {
    name: "Electricity",
    unit: "kWh",
    description:
      "Purchased electricity from the Indian national grid (CEA average emission factor)",
    scope: 2,
    factor: 0.716,
    factorUnit: "kg CO2 per kWh",
    source:
      "Central Electricity Authority (CEA) India — CO2 Baseline Database v18 2023",
  },
  {
    name: "Electricity — Northern Grid (Delhi/UP/Punjab)",
    unit: "kWh",
    description: "Grid electricity for Northern Regional Load Dispatch Centre",
    scope: 2,
    factor: 0.739,
    factorUnit: "kg CO2 per kWh",
    source: "CEA India Regional Grid Emission Factors 2023 — Northern Region",
  },
  {
    name: "Electricity — Western Grid (Maharashtra/Gujarat/MP)",
    unit: "kWh",
    description: "Grid electricity for Western Regional Load Dispatch Centre",
    scope: 2,
    factor: 0.741,
    factorUnit: "kg CO2 per kWh",
    source: "CEA India Regional Grid Emission Factors 2023 — Western Region",
  },
  {
    name: "Electricity — Southern Grid (Karnataka/TN/AP/Kerala)",
    unit: "kWh",
    description: "Grid electricity for Southern Regional Load Dispatch Centre",
    scope: 2,
    factor: 0.647,
    factorUnit: "kg CO2 per kWh",
    source: "CEA India Regional Grid Emission Factors 2023 — Southern Region",
  },
  {
    name: "Electricity — Eastern Grid (WB/Bihar/Odisha)",
    unit: "kWh",
    description: "Grid electricity for Eastern Regional Load Dispatch Centre",
    scope: 2,
    factor: 0.869,
    factorUnit: "kg CO2 per kWh",
    source: "CEA India Regional Grid Emission Factors 2023 — Eastern Region",
  },
  {
    name: "Steam/Heat Purchased",
    unit: "kWh",
    description: "Purchased steam or heat from external suppliers",
    scope: 2,
    factor: 0.27,
    factorUnit: "kg CO2 per kWh",
    source: "GHG Protocol 2023",
  },

  // ─── SCOPE 3 — Value Chain Emissions ──────────────────────────
  {
    name: "Road Freight Shipping",
    unit: "tonne-km",
    description: "Goods transported by road (weight × distance)",
    scope: 3,
    factor: 0.062,
    factorUnit: "kg CO2 per tonne-km",
    source: "GHG Protocol 2023",
  },
  {
    name: "Air Freight Shipping",
    unit: "tonne-km",
    description: "Goods transported by air (weight × distance)",
    scope: 3,
    factor: 0.602,
    factorUnit: "kg CO2 per tonne-km",
    source: "GHG Protocol 2023",
  },
  {
    name: "Business Air Travel",
    unit: "km",
    description: "Employee flights for business purposes",
    scope: 3,
    factor: 0.255,
    factorUnit: "kg CO2 per km per passenger",
    source: "ICAO 2023",
  },
  {
    name: "Employee Commute (Car)",
    unit: "km",
    description: "Employee commuting by personal car",
    scope: 3,
    factor: 0.171,
    factorUnit: "kg CO2 per km",
    source: "GHG Protocol 2023",
  },
  {
    name: "Waste to Landfill",
    unit: "kg",
    description: "General waste sent to landfill",
    scope: 3,
    factor: 0.45,
    factorUnit: "kg CO2 per kg waste",
    source: "EPA 2023",
  },
  {
    name: "Waste Recycled",
    unit: "kg",
    description: "Waste sent for recycling",
    scope: 3,
    factor: 0.02,
    factorUnit: "kg CO2 per kg waste",
    source: "EPA 2023",
  },
  {
    name: "Water Consumption",
    unit: "cubic metres",
    description: "Municipal water supply and treatment",
    scope: 3,
    factor: 0.344,
    factorUnit: "kg CO2 per cubic metre",
    source: "GHG Protocol 2023",
  },
];

async function seedCategories() {
  console.log("🌱 Seeding activity categories and emission factors...");

  for (const cat of categories) {
    // Create or update the category
    const category = await prisma.activityCategory.upsert({
      where: { name: cat.name },
      update: {
        unit: cat.unit,
        description: cat.description,
        scope: cat.scope,
      },
      create: {
        name: cat.name,
        unit: cat.unit,
        description: cat.description,
        scope: cat.scope,
      },
    });

    // Create or update the emission factor linked to this category
    await prisma.emissionFactor.upsert({
      where: { categoryId: category.id },
      update: { factor: cat.factor, unit: cat.factorUnit, source: cat.source },
      create: {
        factor: cat.factor,
        unit: cat.factorUnit,
        source: cat.source,
        categoryId: category.id,
      },
    });

    console.log(
      `  ✅ [Scope ${cat.scope}] ${cat.name} — ${cat.factor} ${cat.factorUnit}`,
    );
  }

  console.log(
    `\n✅ Seeded ${categories.length} categories with emission factors`,
  );
  await prisma.$disconnect();
}

seedCategories().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
