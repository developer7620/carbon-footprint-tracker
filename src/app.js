const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();

// ─── Request Logging ──────────────────────────────────────────────
app.use(morgan("[:date[clf]] :method :url :status :response-time ms"));

// ─── Body Parser ──────────────────────────────────────────────────
app.use(express.json());

// ─── Rate Limiting ────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // only 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

// Apply global limiter to all routes
app.use(globalLimiter);

// ─── Swagger UI ───────────────────────────────────────────────────
app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "🌱 Carbon Tracker API Docs",
    customCss: ".swagger-ui .topbar { background-color: #065f46; }",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.get("/api/v1/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Routes ───────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const businessRoutes = require("./routes/business.routes");
const categoriesRoutes = require("./routes/categories.routes");
const logsRoutes = require("./routes/logs.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const queueRoutes = require("./routes/queue.routes");
const insightsRoutes = require("./routes/insights.routes");

// Apply stricter rate limit to auth routes only
app.use("/api/v1/auth", authLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/logs", logsRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/queue", queueRoutes);
app.use("/api/v1/insights", insightsRoutes);

// ─── Deep Health Check ────────────────────────────────────────────
app.get("/health", async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    services: {},
  };

  // Check PostgreSQL
  try {
    const prisma = require("./config/prisma");
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = {
      status: "healthy",
      responseTime: `${Date.now() - dbStart}ms`,
    };
  } catch (err) {
    health.services.database = { status: "unhealthy", error: err.message };
    health.status = "degraded";
  }

  // Check Redis
  try {
    const redis = require("./config/redis");
    const redisStart = Date.now();
    await redis.ping();
    health.services.redis = {
      status: "healthy",
      responseTime: `${Date.now() - redisStart}ms`,
    };
  } catch (err) {
    health.services.redis = { status: "unhealthy", error: err.message };
    health.status = "degraded";
  }

  // Check Bull Queue
  try {
    const { emailQueue } = require("./queues/emailQueue");
    const [waiting, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getFailedCount(),
    ]);
    health.services.emailQueue = {
      status: failed > 10 ? "degraded" : "healthy",
      waiting,
      failed,
    };
  } catch (err) {
    health.services.emailQueue = { status: "unhealthy", error: err.message };
  }

  health.responseTime = `${Date.now() - startTime}ms`;
  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});

// ─── Error Handling ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;

// ─── Helpers ──────────────────────────────────────────────────────
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
