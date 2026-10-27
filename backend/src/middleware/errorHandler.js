// Every thrown error lands here and becomes a consistent JSON shape:
// { "error": "...", "details": { ... } }
const HttpError = require("../utils/httpError");

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express spots an error-handling middleware by its 4 arguments.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // 1. Errors thrown deliberately (validation, conflicts, bad ids)
  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  // 2. Body that is not valid JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }

  // 3. Prisma known errors
  if (err.code === "P2002") {
    // unique constraint - here that means the client email is already taken
    return res.status(409).json({ error: "A client with this email already exists" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }
  if (err.code === "P2003") {
    return res.status(409).json({ error: "Related record constraint failed" });
  }

  // 4. Database unreachable or misconfigured
  const dbDown =
    ["P1000", "P1001", "P1002", "P1003", "P1017"].includes(err.code) ||
    err.name === "PrismaClientInitializationError" ||
    ["ECONNREFUSED", "ENOTFOUND", "28P01", "3D000"].includes(err.code) ||
    ["ECONNREFUSED", "ENOTFOUND", "28P01", "3D000"].includes(err.cause?.code) ||
    ["ECONNREFUSED", "ENOTFOUND"].includes(err.cause?.cause?.code);
  if (dbDown) {
    console.error("Database unavailable:", err.message);
    return res.status(503).json({ error: "Database is unavailable. Please try again later." });
  }

  // 5. Unexpected bug: log it, keep internals away from the client
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = { notFound, errorHandler };
