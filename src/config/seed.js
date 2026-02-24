require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const industryBenchmarks = [
  {
    industry: "Restaurant",
    avgMonthlyEmissions: 2850,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Retail Store",
    avgMonthlyEmissions: 1920,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Office",
    avgMonthlyEmissions: 980,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Manufacturing",
    avgMonthlyEmissions: 8500,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Logistics",
    avgMonthlyEmissions: 6200,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Hotel",
    avgMonthlyEmissions: 4100,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Healthcare Clinic",
    avgMonthlyEmissions: 1750,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Education",
    avgMonthlyEmissions: 1200,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "Construction",
    avgMonthlyEmissions: 7800,
    source: "GHG Protocol SME Report 2023",
  },
  {
    industry: "IT Services",
    avgMonthlyEmissions: 650,
    source: "GHG Protocol SME Report 2023",
  },
];

async function seed() {
  console.log("Seeding industry benchmarks...");

  for (const benchmark of industryBenchmarks) {
    await prisma.industryBenchmark.upsert({
      where: { industry: benchmark.industry },
      update: {},
      create: benchmark,
    });
  }

  console.log(`Seeded ${industryBenchmarks.length} industry benchmarks`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
