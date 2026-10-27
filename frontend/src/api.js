// Tiny fetch wrapper. Every function returns parsed JSON or throws an Error
// whose message comes from the API's { error, details } shape.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = body.details || null;
    throw err;
  }
  return body;
}

export const api = {
  health: () => request("/health"),
  stats: () => request("/stats"),
  listClients: (search) => request(`/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) => request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),
  listProjects: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/projects${qs ? `?${qs}` : ""}`);
  },
  createProject: (data) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setProjectStatus: (id, status) =>
    request(`/projects/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  listInvoices: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/invoices${qs ? `?${qs}` : ""}`);
  },
  createInvoice: (data) => request("/invoices", { method: "POST", body: JSON.stringify(data) }),
  markInvoicePaid: (id) => request(`/invoices/${id}/mark-paid`, { method: "PATCH" }),
  voidInvoice: (id) => request(`/invoices/${id}/void`, { method: "PATCH" }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: "DELETE" }),
  listTasks: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined)).toString();
    return request(`/tasks${qs ? `?${qs}` : ""}`);
  },
  createTask: (data) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: "PATCH" }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};

// Shared display helpers
export function formatINR(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
}

export function formatDate(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

export function isOverdue(deadline, status) {
  if (status !== "ACTIVE" && status !== "DRAFT") return false;
  const today = new Date().toISOString().slice(0, 10);
  return String(deadline).slice(0, 10) < today;
}
