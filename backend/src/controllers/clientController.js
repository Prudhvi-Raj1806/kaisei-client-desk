// Client endpoints: list (with search), create, read one (with its projects
// and invoices), update, delete.
const prisma = require("../prisma");
const HttpError = require("../utils/httpError");
const { validateClient, parseId } = require("../utils/validation");

function getValidId(req) {
  const id = parseId(req.params.id);
  if (id === null) throw new HttpError(400, "Client id must be a positive whole number");
  return id;
}

// GET /api/clients?search=silk
async function listClients(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const clients = await prisma.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: { _count: { select: { projects: true } } },
  });
  res.json(
    clients.map(({ _count, ...c }) => ({ ...c, projectCount: _count.projects }))
  );
}

// GET /api/clients/:id  -> client plus its projects, each with its invoices
async function getClient(req, res) {
  const id = getValidId(req);
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: [{ deadline: "asc" }, { id: "asc" }],
        include: { invoices: { orderBy: [{ issuedOn: "desc" }, { id: "desc" }] } },
      },
    },
  });
  if (!client) throw new HttpError(404, `Client ${id} not found`);
  res.json(client);
}

// POST /api/clients
async function createClient(req, res) {
  const { errors, data } = validateClient(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);
  const client = await prisma.client.create({ data });
  res.status(201).json(client);
}

// PUT /api/clients/:id
async function updateClient(req, res) {
  const id = getValidId(req);
  const { errors, data } = validateClient(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);
  const client = await prisma.client.update({ where: { id }, data });
  res.json(client);
}

// DELETE /api/clients/:id
// Refuses while the client still has projects: project history is business
// data, so deleting a client is blocked rather than silently cascading.
async function deleteClient(req, res) {
  const id = getValidId(req);
  const projectCount = await prisma.project.count({ where: { clientId: id } });
  if (projectCount > 0)
    throw new HttpError(
      409,
      `Client ${id} still has ${projectCount} project(s); remove or reassign them first`
    );
  const client = await prisma.client.delete({ where: { id } });
  res.json({ message: `Client ${id} deleted`, client });
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
