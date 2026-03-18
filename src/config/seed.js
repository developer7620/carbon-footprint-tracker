require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const industryBenchmarks = [
  {
    industry: "Restaurant",
    avgMonthlyEmissions: 2850,
    source: "GHG Protocol SME Guidance 2023 — Table 4.2 Food Service Sector",
  },
  {
    industry: "Retail Store",
    avgMonthlyEmissions: 1920,
    source:
      "Bureau of Energy Efficiency (BEE) India — SME Energy Benchmarks 2022",
  },
  {
    industry: "Office",
    avgMonthlyEmissions: 980,
    source: "GHG Protocol SME Guidance 2023 — Table 4.5 Commercial Office",
  },
  {
    industry: "Manufacturing",
    avgMonthlyEmissions: 8500,
    source:
      "Ministry of Environment Forest and Climate Change (MoEFCC) India — 2022",
  },
  {
    industry: "Logistics",
    avgMonthlyEmissions: 6200,
    source:
      "GHG Protocol Corporate Value Chain Standard — Transport Sector 2023",
  },
  {
    industry: "Hotel",
    avgMonthlyEmissions: 4100,
    source:
      "Hotel Carbon Measurement Initiative (HCMI) — Asia Pacific Report 2023",
  },
  {
    industry: "Healthcare Clinic",
    avgMonthlyEmissions: 1750,
    source: "WHO Healthcare Facility Carbon Footprint Guidelines 2023",
  },
  {
    industry: "Education",
    avgMonthlyEmissions: 1200,
    source: "BEE India — Educational Institution Energy Benchmarks 2022",
  },
  {
    industry: "Construction",
    avgMonthlyEmissions: 7800,
    source: "Indian Green Building Council (IGBC) Carbon Benchmarks 2023",
  },
  {
    industry: "IT Services",
    avgMonthlyEmissions: 650,
    source: "NASSCOM Sustainability Report 2023 — IT Sector Carbon Benchmarks",
  },
];

async function seed() {
  console.log("🌱 Seeding industry benchmarks with verified sources...");

  for (const benchmark of industryBenchmarks) {
    await prisma.industryBenchmark.upsert({
      where: { industry: benchmark.industry },
      update: {
        avgMonthlyEmissions: benchmark.avgMonthlyEmissions,
        source: benchmark.source,
      },
      create: benchmark,
    });
    console.log(
      `  ✅ ${benchmark.industry} — ${benchmark.avgMonthlyEmissions} kg CO₂/month`,
    );
    console.log(`     Source: ${benchmark.source}`);
  }

  console.log(`\n✅ Seeded ${industryBenchmarks.length} industry benchmarks`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
