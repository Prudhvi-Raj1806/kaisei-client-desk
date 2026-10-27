// Entry point: loads .env and starts listening.
require("dotenv/config");
const app = require("./app");
const prisma = require("./prisma");

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`Kaisei Client Desk API on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is busy. Change PORT in backend/.env or stop the other process.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

// Tidy shutdown on Ctrl+C: close HTTP, then the database pool.
async function shutdown() {
  console.log("\nShutting down...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
