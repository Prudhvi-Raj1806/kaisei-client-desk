// Assembles the Express app (middleware + routes) without starting it.
// server.js owns startup; keeping them separate makes the app testable.
const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
const clientRoutes = require("./routes/clientRoutes");
const projectRoutes = require("./routes/projectRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { getStats } = require("./controllers/statsController");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// The React dev server is a different origin (port 5173), so the browser
// needs this CORS header before it will show API responses to the page.
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));

app.use(express.json({ limit: "100kb" }));

// Request log: one line per request, printed when the response finishes.
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started} ms)`);
  });
  next();
});

// Health check that also proves the database connection is alive.
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("Health check failed:", err.message);
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/tasks", taskRoutes);
app.get("/api/stats", getStats);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
