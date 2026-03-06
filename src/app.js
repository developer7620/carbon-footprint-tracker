const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { errorHandler, notFound } = require("./middleware/error.middleware");

const app = express();
app.use(express.json());

// ─── Swagger UI ───────────────────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "🌱 Carbon Tracker API Docs",
    customCss: ".swagger-ui .topbar { background-color: #065f46; }",
    swaggerOptions: { persistAuthorization: true },
  }),
);

// Expose raw swagger JSON for external tools
app.get("/api/docs.json", (req, res) => {
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

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/queue", queueRoutes);

// ─── Health Check ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Carbon Tracker API is running",
    docs: "/api/docs",
    version: "1.0.0",
  });
});

// ─── Error Handling (must be last) ───────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
