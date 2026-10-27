// Studio-task endpoints: the plain CRUD heart of the app.
// A task is one piece of work inside a project ("Design homepage hero").
const prisma = require("../prisma");
const HttpError = require("../utils/httpError");
const { parseId } = require("../utils/validation");
const { parseDateOnly } = require("../utils/dates");

const MAX_TITLE = 140;
const MAX_NOTES = 600;

function getValidId(req) {
  const id = parseId(req.params.id);
  if (id === null) throw new HttpError(400, "Task id must be a positive whole number");
  return id;
}

function validateTask(body) {
  const input = body && typeof body === "object" ? body : {};
  const errors = {};

  const projectId = parseId(input.projectId);
  if (projectId === null) errors.projectId = "projectId must be a positive whole number";

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) errors.title = "Title is required";
  else if (title.length > MAX_TITLE) errors.title = `Title must be at most ${MAX_TITLE} characters`;

  let notes = "";
  if (input.notes !== undefined && input.notes !== null) {
    if (typeof input.notes !== "string") errors.notes = "Notes must be text";
    else {
      notes = input.notes.trim();
      if (notes.length > MAX_NOTES) errors.notes = `Notes must be at most ${MAX_NOTES} characters`;
    }
  }

  const dueDate = parseDateOnly(input.dueDate);
  if (dueDate === null) errors.dueDate = "dueDate must be a real date written YYYY-MM-DD";

  return { errors, data: { projectId, title, notes, dueDate } };
}

// GET /api/tasks?projectId=3&done=false
async function listTasks(req, res) {
  let projectId;
  if (req.query.projectId !== undefined) {
    projectId = parseId(req.query.projectId);
    if (projectId === null) throw new HttpError(400, "projectId must be a positive whole number");
  }
  let done;
  if (req.query.done !== undefined) {
    if (!["true", "false"].includes(req.query.done))
      throw new HttpError(400, "done must be true or false");
    done = req.query.done === "true";
  }
  const tasks = await prisma.studioTask.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(done !== undefined ? { done } : {}),
    },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { id: "asc" }],
    include: { project: { select: { id: true, title: true } } },
  });
  res.json(tasks);
}

// GET /api/tasks/:id
async function getTask(req, res) {
  const id = getValidId(req);
  const task = await prisma.studioTask.findUnique({
    where: { id },
    include: { project: { select: { id: true, title: true } } },
  });
  if (!task) throw new HttpError(404, `Task ${id} not found`);
  res.json(task);
}

// POST /api/tasks
async function createTask(req, res) {
  const { errors, data } = validateTask(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);

  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) throw new HttpError(404, `Project ${data.projectId} not found`);

  const task = await prisma.studioTask.create({ data });
  res.status(201).json(task);
}

// PUT /api/tasks/:id
async function updateTask(req, res) {
  const id = getValidId(req);
  const { errors, data } = validateTask(req.body);
  if (Object.keys(errors).length > 0) throw new HttpError(400, "Validation failed", errors);

  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) throw new HttpError(404, `Project ${data.projectId} not found`);

  const task = await prisma.studioTask.update({ where: { id }, data });
  res.json(task);
}

// PATCH /api/tasks/:id/toggle  (done <-> not done)
async function toggleTask(req, res) {
  const id = getValidId(req);
  const task = await prisma.studioTask.findUnique({ where: { id } });
  if (!task) throw new HttpError(404, `Task ${id} not found`);
  const updated = await prisma.studioTask.update({
    where: { id },
    data: { done: !task.done },
  });
  res.json(updated);
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
  const id = getValidId(req);
  const task = await prisma.studioTask.delete({ where: { id } });
  res.json({ message: `Task ${id} deleted`, task });
}

module.exports = { listTasks, getTask, createTask, updateTask, toggleTask, deleteTask };
