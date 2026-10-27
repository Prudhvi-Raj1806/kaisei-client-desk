// Input checking for clients, projects and invoices.
// Pure functions (no Express, no database) so they are easy to reason about
// and to exercise in a viva.

const { parseDateOnly } = require("./dates");
const { isValidRupees, toPaise } = require("./money");

const PROJECT_STATUSES = ["DRAFT", "ACTIVE", "DELIVERED", "CANCELLED"];
const INVOICE_STATUSES = ["UNPAID", "PAID", "VOID"];

const MAX_NAME = 100;
const MAX_COMPANY = 120;
const MAX_EMAIL = 160;
const MAX_PHONE = 20;
const MAX_TITLE = 140;
const MAX_BRIEF = 1200;
const MAX_NOTE = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(v) {
  return typeof v === "string" ? v.trim() : "";
}

// id path parameter -> positive integer, or null
function parseId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function validateClient(body) {
  const input = body && typeof body === "object" ? body : {};
  const errors = {};

  const name = asTrimmedString(input.name);
  if (!name) errors.name = "Name is required";
  else if (name.length > MAX_NAME) errors.name = `Name must be at most ${MAX_NAME} characters`;

  const email = asTrimmedString(input.email).toLowerCase();
  if (!email) errors.email = "Email is required";
  else if (email.length > MAX_EMAIL) errors.email = `Email must be at most ${MAX_EMAIL} characters`;
  else if (!EMAIL_RE.test(email)) errors.email = "Email must look like name@example.com";

  let company = "";
  if (input.company !== undefined && input.company !== null) {
    if (typeof input.company !== "string") errors.company = "Company must be text";
    else {
      company = input.company.trim();
      if (company.length > MAX_COMPANY) errors.company = `Company must be at most ${MAX_COMPANY} characters`;
    }
  }

  let phone = "";
  if (input.phone !== undefined && input.phone !== null) {
    if (typeof input.phone !== "string") errors.phone = "Phone must be text";
    else {
      phone = input.phone.trim();
      if (phone.length > MAX_PHONE) errors.phone = `Phone must be at most ${MAX_PHONE} characters`;
      else if (phone && !/^[0-9+\-\s()]+$/.test(phone))
        errors.phone = "Phone may only contain digits, spaces and + - ( )";
    }
  }

  return { errors, data: { name, company, email, phone } };
}

function validateProject(body) {
  const input = body && typeof body === "object" ? body : {};
  const errors = {};

  const clientId = parseId(input.clientId);
  if (clientId === null) errors.clientId = "clientId must be a positive whole number";

  const title = asTrimmedString(input.title);
  if (!title) errors.title = "Title is required";
  else if (title.length > MAX_TITLE) errors.title = `Title must be at most ${MAX_TITLE} characters`;

  let brief = "";
  if (input.brief !== undefined && input.brief !== null) {
    if (typeof input.brief !== "string") errors.brief = "Brief must be text";
    else {
      brief = input.brief.trim();
      if (brief.length > MAX_BRIEF) errors.brief = `Brief must be at most ${MAX_BRIEF} characters`;
    }
  }

  const deadline = parseDateOnly(input.deadline);
  if (deadline === null) errors.deadline = "Deadline must be a real date written YYYY-MM-DD";

  let budgetPaise = 0;
  if (input.budgetRupees !== undefined && input.budgetRupees !== null) {
    if (!isValidRupees(Number(input.budgetRupees))) {
      errors.budget = "Budget must be a positive amount in rupees (up to 2 decimals)";
    } else {
      budgetPaise = toPaise(input.budgetRupees);
      if (budgetPaise > 100000000000) errors.budget = "Budget is unrealistically large";
    }
  }

  return {
    errors,
    data: { clientId, title, brief, deadline, budgetPaise },
  };
}

function validateProjectStatus(body) {
  const input = body && typeof body === "object" ? body : {};
  const status = asTrimmedString(input.status).toUpperCase();
  if (!PROJECT_STATUSES.includes(status))
    return { errors: { status: `status must be one of ${PROJECT_STATUSES.join(", ")}` }, status: null };
  return { errors: {}, status };
}

function validateInvoice(body) {
  const input = body && typeof body === "object" ? body : {};
  const errors = {};

  const projectId = parseId(input.projectId);
  if (projectId === null) errors.projectId = "projectId must be a positive whole number";

  let amountPaise = null;
  if (!isValidRupees(Number(input.amountRupees))) {
    errors.amount = "Amount must be a positive amount in rupees (up to 2 decimals)";
  } else {
    amountPaise = toPaise(input.amountRupees);
  }

  const issuedOn = input.issuedOn === undefined ? new Date() : parseDateOnly(input.issuedOn);
  if (issuedOn === null) errors.issuedOn = "issuedOn must be a real date written YYYY-MM-DD";

  const dueOn = parseDateOnly(input.dueOn);
  if (dueOn === null) errors.dueOn = "dueOn must be a real date written YYYY-MM-DD";

  if (issuedOn && dueOn && dueOn < issuedOn)
    errors.dueOn = "dueOn cannot be earlier than issuedOn";

  let note = "";
  if (input.note !== undefined && input.note !== null) {
    if (typeof input.note !== "string") errors.note = "Note must be text";
    else {
      note = input.note.trim();
      if (note.length > MAX_NOTE) errors.note = `Note must be at most ${MAX_NOTE} characters`;
    }
  }

  return { errors, data: { projectId, amountPaise, issuedOn, dueOn, note } };
}

module.exports = {
  PROJECT_STATUSES,
  INVOICE_STATUSES,
  parseId,
  validateClient,
  validateProject,
  validateProjectStatus,
  validateInvoice,
};
