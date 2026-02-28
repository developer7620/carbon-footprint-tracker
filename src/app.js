const express = require("express");
const app = express();

app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const businessRoutes = require("./routes/business.routes");
const categoriesRoutes = require("./routes/categories.routes");
const logsRoutes = require("./routes/logs.routes");
const analyticsRoutes = require("./routes/analytics.routes");

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Carbon Tracker API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;
