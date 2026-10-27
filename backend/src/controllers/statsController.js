// GET /api/stats: headline numbers for the dashboard.
// All counting and summing happens in PostgreSQL (aggregate queries),
// not in JavaScript loops.
const prisma = require("../prisma");

async function getStats(req, res) {
  const [
    clientCount,
    draft, active, delivered, cancelled,
    unpaidCount, paidCount,
    billed, collected, outstanding,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count({ where: { status: "DRAFT" } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "DELIVERED" } }),
    prisma.project.count({ where: { status: "CANCELLED" } }),
    prisma.invoice.count({ where: { status: "UNPAID" } }),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.invoice.aggregate({ _sum: { amountPaise: true }, where: { status: { not: "VOID" } } }),
    prisma.invoice.aggregate({ _sum: { amountPaise: true }, where: { status: "PAID" } }),
    prisma.invoice.aggregate({ _sum: { amountPaise: true }, where: { status: "UNPAID" } }),
  ]);

  res.json({
    clients: clientCount,
    projects: {
      total: draft + active + delivered + cancelled,
      draft, active, delivered, cancelled,
    },
    invoices: { total: unpaidCount + paidCount, unpaid: unpaidCount, paid: paidCount },
    moneyPaise: {
      billed: billed._sum.amountPaise || 0,
      collected: collected._sum.amountPaise || 0,
      outstanding: outstanding._sum.amountPaise || 0,
    },
  });
}

module.exports = { getStats };
