// Project endpoints: list (filter/sort), stats-ready reads, create, update,
// status changes, delete.
const prisma = require("../prisma");
const HttpError = require("../utils/httpError");
const {
  validateProject,
  validateProjectStatus,
  parseId,
  PROJECT_STATUSES,
} = require("../utils/validation");

const SORTABLE = ["deadline", "createdAt", "title", "budgetPaise"];

function getValidId(req) {
  const id = parseId(req.params.id);
  if (id === null) throw new HttpError(400, "Project id must be a positive whole number");
  return id;
}

// GET /api/projects?status=ACTIVE&clientId=2&sort=deadline&order=asc
async function listProjects(req, res) {
  const { status, sort = "deadline", order = "asc" } = req.query;

  if (status !== undefined && !PROJECT_STATUSES.includes(status))
    throw new HttpError(400, `status must be one of ${PROJECT_STATUSES.join(", ")}`);
  if (!SORTABLE.includes(sort))
    throw new HttpError(400, `sort must be one of ${SORTABLE.join(", ")}`);
  if (!["asc", "desc"].includes(order))
    throw new HttpError(400, "order must be asc or desc");

  let clientId;
  if (req.query.clientId !== undefined) {
    clientId = parseId(req.query.clientId);
    if (clientId === null) throw new HttpError(400, "clientId must be a positive whole number");
  }

  const projects = await prisma.project.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: [{ [sort]: order }, { id: "asc" }],
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { invoices: true } },
    },
  });
  res.json(
    projects.map(({ _count, ...p }) => ({ ...p, invoiceCount: _count.invoices }))
  );
}

// GET /api/projects/:id
async function getProject(req, res) {
  const id = getValidId(req);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
      invoices: { orderBy: [{ issuedOn: "desc" }, { id: "desc" }] },
    },
  });
  if (!project) throw new HttpError(404, `Project ${id} not found`);
  res.json(project);
}

// POST /api/projects  (clientId must point at a real client)
async function createProject(req, res) {
  const { errors, data } = validateProject(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);

  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new HttpError(404, `Client ${data.clientId} not found`);

  const project = await prisma.project.create({ data });
  res.status(201).json(project);
}

// PUT /api/projects/:id
async function updateProject(req, res) {
  const id = getValidId(req);
  const { errors, data } = validateProject(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);

  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new HttpError(404, `Client ${data.clientId} not found`);

  const project = await prisma.project.update({ where: { id }, data });
  res.json(project);
}

// PATCH /api/projects/:id/status  body: { "status": "ACTIVE" }
async function updateProjectStatus(req, res) {
  const id = getValidId(req);
  const { errors, status } = validateProjectStatus(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);
  const project = await prisma.project.update({ where: { id }, data: { status } });
  res.json(project);
}

// DELETE /api/projects/:id  (its invoices go with it: they make no sense alone)
async function deleteProject(req, res) {
  const id = getValidId(req);
  const project = await prisma.project.delete({ where: { id } });
  res.json({ message: `Project ${id} deleted`, project });
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};
