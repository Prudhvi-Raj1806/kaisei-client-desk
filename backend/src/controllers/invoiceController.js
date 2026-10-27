// Invoice endpoints: list (filter), create, mark paid, void, delete.
const prisma = require("../prisma");
const HttpError = require("../utils/httpError");
const { validateInvoice, parseId, INVOICE_STATUSES } = require("../utils/validation");
const { formatDateOnly } = require("../utils/dates");

function getValidId(req) {
  const id = parseId(req.params.id);
  if (id === null) throw new HttpError(400, "Invoice id must be a positive whole number");
  return id;
}

// GET /api/invoices?status=UNPAID&projectId=3
async function listInvoices(req, res) {
  const { status } = req.query;
  if (status !== undefined && !INVOICE_STATUSES.includes(status))
    throw new HttpError(400, `status must be one of ${INVOICE_STATUSES.join(", ")}`);

  let projectId;
  if (req.query.projectId !== undefined) {
    projectId = parseId(req.query.projectId);
    if (projectId === null) throw new HttpError(400, "projectId must be a positive whole number");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(projectId ? { projectId } : {}),
    },
    orderBy: [{ issuedOn: "desc" }, { id: "desc" }],
    include: {
      project: { select: { id: true, title: true, client: { select: { id: true, name: true } } } },
    },
  });
  res.json(invoices);
}

// POST /api/invoices  (projectId must point at a real project)
async function createInvoice(req, res) {
  const { errors, data } = validateInvoice(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);

  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) throw new HttpError(404, `Project ${data.projectId} not found`);

  const invoice = await prisma.invoice.create({ data });
  res.status(201).json(invoice);
}

// PATCH /api/invoices/:id/mark-paid
// Only an UNPAID invoice can be paid; paying stamps today's date in paidOn.
async function markInvoicePaid(req, res) {
  const id = getValidId(req);
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new HttpError(404, `Invoice ${id} not found`);
  if (invoice.status === "PAID")
    throw new HttpError(409, `Invoice ${id} is already paid (paid on ${formatDateOnly(invoice.paidOn)})`);
  if (invoice.status === "VOID")
    throw new HttpError(409, `Invoice ${id} is void and cannot be paid`);

  const today = new Date();
  const paid = await prisma.invoice.update({
    where: { id },
    data: { status: "PAID", paidOn: today },
  });
  res.json(paid);
}

// PATCH /api/invoices/:id/void  (cancels an unpaid invoice)
async function voidInvoice(req, res) {
  const id = getValidId(req);
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new HttpError(404, `Invoice ${id} not found`);
  if (invoice.status === "PAID")
    throw new HttpError(409, `Invoice ${id} is already paid and cannot be voided`);

  const voided = await prisma.invoice.update({ where: { id }, data: { status: "VOID" } });
  res.json(voided);
}

// DELETE /api/invoices/:id
async function deleteInvoice(req, res) {
  const id = getValidId(req);
  const invoice = await prisma.invoice.delete({ where: { id } });
  res.json({ message: `Invoice ${id} deleted`, invoice });
}

module.exports = { listInvoices, createInvoice, markInvoicePaid, voidInvoice, deleteInvoice };
