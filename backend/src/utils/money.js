// Money is stored in paise (integer) to avoid floating-point rounding bugs.
// 1 rupee = 100 paise. These helpers convert and check amounts.

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

// A valid amount is a finite number > 0 with at most 2 decimal places.
function isValidRupees(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (value <= 0) return false;
  return Number.isInteger(Math.round(value * 100)) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

module.exports = { toPaise, isValidRupees };
