const Bull = require("bull");
const redis = require("../config/redis");

// Create the email queue
const emailQueue = new Bull("email-reports", {
  redis: process.env.REDIS_URL,
});

// Process jobs from the queue
emailQueue.process(async (job) => {
  const { type, businessId, email, data } = job.data;
  console.log(`Processing email job: ${type} for ${email}`);

  // We'll add actual email sending on Day 8
  // For now just log the job details
  console.log(`   Business ID: ${businessId}`);
  console.log(`   Job data:`, JSON.stringify(data, null, 2));

  return { success: true, processedAt: new Date() };
});

// Queue event listeners for monitoring
emailQueue.on("completed", (job, result) => {
  console.log(`Email job ${job.id} completed`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

emailQueue.on("stalled", (job) => {
  console.warn(`Email job ${job.id} stalled`);
});

module.exports = emailQueue;
