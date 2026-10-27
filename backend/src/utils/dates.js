// Accepts only a real calendar date in YYYY-MM-DD form.
// Returns a Date at UTC midnight, or null for anything invalid
// (including impossible dates such as 2026-02-31).
function parseDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
  return d;
}

function formatDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

module.exports = { parseDateOnly, formatDateOnly };
