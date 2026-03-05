const express = require("express");
const router = express.Router();
const {
  emailQueue,
  addMonthlyReportJob,
  addNotificationJob,
} = require("../queues/emailQueue");
const { authenticate } = require("../middleware/auth.middleware");
const prisma = require("../config/prisma");

// POST /api/queue/report — manually trigger monthly report email
router.post("/report", authenticate, async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const business = await prisma.business.findUnique({
      where: { userId: req.user.id },
    });

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }

    const job = await addMonthlyReportJob(business.id, month, year);

    res.status(200).json({
      success: true,
      message: "Monthly report email queued successfully",
      data: {
        jobId: job.id,
        businessName: business.name,
        reportPeriod: `${month}/${year}`,
        status: "queued",
      },
    });
  } catch (error) {
    console.error("Queue report error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// POST /api/queue/notify — send a quick notification
router.post("/notify", authenticate, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const business = await prisma.business.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    const job = await addNotificationJob(business.user.email, subject, message);

    res.status(200).json({
      success: true,
      message: "Notification queued",
      data: { jobId: job.id, email: business.user.email },
    });
  } catch (error) {
    console.error("Notify error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/queue/status
router.get("/status", authenticate, async (req, res) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);

    res.status(200).json({
      success: true,
      message: "Queue status fetched successfully",
      data: { waiting, active, completed, failed },
    });
  } catch (error) {
    console.error("Queue status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
