/*
  Warnings:

  - Added the required column `scope` to the `ActivityCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scope` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeCount` to the `Business` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `EmissionFactor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `EmissionFactor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivityCategory" ADD COLUMN     "scope" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "scope" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "annualRevenue" DOUBLE PRECISION,
ADD COLUMN     "employeeCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "EmissionFactor" ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "IndustryBenchmark" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "avgMonthlyEmissions" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg CO2',
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarbonIntensityScore" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbonIntensityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReductionGoal" (
    "id" TEXT NOT NULL,
    "targetReduction" DOUBLE PRECISION NOT NULL,
    "baselineEmission" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReductionGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndustryBenchmark_industry_key" ON "IndustryBenchmark"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "CarbonIntensityScore_businessId_month_year_key" ON "CarbonIntensityScore"("businessId", "month", "year");

-- AddForeignKey
ALTER TABLE "CarbonIntensityScore" ADD CONSTRAINT "CarbonIntensityScore_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReductionGoal" ADD CONSTRAINT "ReductionGoal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionInsight" ADD CONSTRAINT "EmissionInsight_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
