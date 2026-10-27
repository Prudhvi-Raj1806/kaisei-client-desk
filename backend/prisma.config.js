// Prisma 7 CLI configuration: points the CLI at the schema, the migrations
// folder and the database URL (read from backend/.env).
require("dotenv/config");
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
