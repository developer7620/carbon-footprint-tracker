const express = require("express");
const router = express.Router();
const emailQueue = require("../queues/emailQueue");
const { authenticate } = require("../middleware/auth.middleware");
const prisma = require("../config/prisma");

// POST /api/queue/test — manually trigger a test job
router.post("/test", authenticate, async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    const job = await emailQueue.add({
      type: "TEST_EMAIL",
      businessId: business.id,
      email: business.user.email,
      data: { message: "Queue is working correctly", timestamp: new Date() },
    });

    res.status(200).json({
      success: true,
      message: "Test job added to queue",
      data: { jobId: job.id, status: "queued" },
    });
  } catch (error) {
    console.error("Queue test error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/queue/status — check queue health
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
