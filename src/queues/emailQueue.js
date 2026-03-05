const Bull = require("bull");
const {
  sendMonthlyReport,
  sendNotification,
} = require("../services/email.service");
const {
  getMonthlyEmissions,
  calculateCarbonIntensityScore,
} = require("../services/carbon.service");
const prisma = require("../config/prisma");

const emailQueue = new Bull("email-reports", {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3, // retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // wait 5s, 10s, 20s between retries
    },
    removeOnComplete: 50, // keep last 50 completed jobs
    removeOnFail: 100, // keep last 100 failed jobs for debugging
  },
});

// ─── Job Processors ──────────────────────────────────────────────

emailQueue.process("monthly_report", async (job) => {
  const { businessId, month, year } = job.data;
  console.log(
    `📧 Processing monthly report for business ${businessId} — ${month}/${year}`,
  );

  // Fetch business and user details
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { user: true },
  });

  if (!business) throw new Error(`Business not found: ${businessId}`);

  // Gather all report data
  const [emissionsData, scoreData] = await Promise.all([
    getMonthlyEmissions(businessId, month, year),
    calculateCarbonIntensityScore(businessId, month, year),
  ]);

  // Send the email
  await sendMonthlyReport({
    to: business.user.email,
    business: { name: business.name, industry: business.industry },
    reportData: {
      month,
      year,
      totalCO2: emissionsData.totalCO2,
      byScope: emissionsData.byScope,
      byCategory: emissionsData.byCategory,
      scoreData,
    },
  });

  return {
    success: true,
    email: business.user.email,
    month,
    year,
    totalCO2: emissionsData.totalCO2,
  };
});

emailQueue.process("notification", async (job) => {
  const { to, subject, message } = job.data;
  await sendNotification({ to, subject, message });
  return { success: true, email: to };
});

// ─── Event Listeners ─────────────────────────────────────────────

emailQueue.on("completed", (job, result) => {
  console.log(
    ` Job [${job.name}] #${job.id} completed — sent to ${result.email}`,
  );
});

emailQueue.on("failed", (job, err) => {
  console.error(
    ` Job [${job.name}] #${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`,
  );
});

emailQueue.on("stalled", (job) => {
  console.warn(`  Job [${job.name}] #${job.id} stalled — will retry`);
});

// ─── Helper to add jobs ───────────────────────────────────────────

const addMonthlyReportJob = async (businessId, month, year, options = {}) => {
  return emailQueue.add("monthly_report", { businessId, month, year }, options);
};

const addNotificationJob = async (to, subject, message) => {
  return emailQueue.add("notification", { to, subject, message });
};

module.exports = { emailQueue, addMonthlyReportJob, addNotificationJob };
