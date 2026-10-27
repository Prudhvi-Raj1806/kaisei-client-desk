// One shared Prisma Client for the whole API.
// Prisma 7 connects to PostgreSQL through the `pg` driver adapter.
const { PrismaClient } = require("./generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Copy backend/.env.example to backend/.env and fill it in."
  );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// LOG_QUERIES=true in .env prints every generated SQL statement - handy in a demo.
const prisma = new PrismaClient({
  adapter,
  log: process.env.LOG_QUERIES === "true" ? ["query"] : [],
});

module.exports = prisma;
