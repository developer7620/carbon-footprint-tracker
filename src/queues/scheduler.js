const cron = require("node-cron");
const prisma = require("../config/prisma");
const { addMonthlyReportJob } = require("./emailQueue");

/**
 * Runs on the 1st of every month at 9:00 AM
 * Queues monthly report emails for ALL businesses
 */
const startScheduler = () => {
  cron.schedule("0 9 1 * *", async () => {
    console.log("Monthly report scheduler triggered");

    const now = new Date();
    // Report is for the PREVIOUS month
    const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const reportYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    console.log(`Generating reports for ${reportMonth}/${reportYear}`);

    // Fetch all businesses
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true },
    });

    console.log(`Queuing reports for ${businesses.length} businesses`);

    // Add a job for each business with a 2 second delay between them
    // to avoid overwhelming the email service
    for (let i = 0; i < businesses.length; i++) {
      await addMonthlyReportJob(
        businesses[i].id,
        reportMonth,
        reportYear,
        { delay: i * 2000 }, // stagger by 2 seconds each
      );
    }

    console.log(`Queued ${businesses.length} monthly report jobs`);
  });

  console.log(
    "Monthly report scheduler started — runs on 1st of every month at 9:00 AM",
  );
};

module.exports = { startScheduler };
