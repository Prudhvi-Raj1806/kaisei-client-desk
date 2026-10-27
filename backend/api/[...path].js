// Vercel serverless entry: forward every /api/* request to the Express app.
require("dotenv/config");
const app = require("../src/app");
module.exports = app;
