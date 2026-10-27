import { useState } from "react";
import { api, formatINR, formatDate, isOverdue } from "../api.js";
import ProjectForm from "./ProjectForm.jsx";
import InvoiceForm from "./InvoiceForm.jsx";
import TasksSection from "./TasksSection.jsx";

const TABS = [
  { key: "", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "ACTIVE", label: "Active" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

const NEXT_STATUS = { DRAFT: "ACTIVE", ACTIVE: "DELIVERED" };
const NEXT_LABEL = { DRAFT: "Start", ACTIVE: "Deliver" };

export default function ProjectBoard({ projects, invoices, tasks, clients, selectedClientId, filter, onFilter, loading, onChanged }) {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [invoiceFor, setInvoiceFor] = useState(null); // project object
  const [boardError, setBoardError] = useState("");

  async function run(fn) {
    setBoardError("");
    try {
      await fn();
      onChanged();
    } catch (err) {
      setBoardError(err.message);
    }
  }

  const invoicesFor = (projectId) => invoices.filter((i) => i.projectId === projectId);
  const tasksFor = (projectId) => tasks.filter((t) => t.projectId === projectId);

  return (
    <main className="board">
      <div className="board-head">
        <h2>
          Projects {selectedClientId ? `(${projects.length})` : `- all clients (${projects.length})`}
        </h2>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${filter === t.key ? "active" : ""}`}
              onClick={() => onFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button className="primary" onClick={() => { setEditingProject(null); setShowProjectForm(true); }}>
          + New project
        </button>
      </div>

      {boardError && <div className="banner error small">{boardError}</div>}
      {loading && <p className="muted pad">Loading...</p>}

      {!loading && projects.length === 0 && (
        <div className="empty-state">
          <p>No projects here yet.</p>
          <p className="muted">Add one with the "New project" button, or change the filter.</p>
        </div>
      )}

      {projects.map((p) => (
        <div className={`project-card status-${p.status.toLowerCase()}`} key={p.id}>
          <div className="project-main">
            <div className="project-title-row">
              <h3>{p.title}</h3>
              <span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span>
              {isOverdue(p.deadline, p.status) && <span className="badge overdue">OVERDUE</span>}
            </div>
            {p.brief && <p className="brief">{p.brief}</p>}
            <div className="project-meta">
              <span className="chip">{p.client?.name}</span>
              <span>Deadline: {formatDate(p.deadline)}</span>
              <span>Budget: {formatINR(p.budgetPaise)}</span>
              <span>{p.invoiceCount} invoice{p.invoiceCount === 1 ? "" : "s"}</span>
            </div>
            <div className="project-actions">
              {NEXT_STATUS[p.status] && (
                <button className="link-btn" onClick={() => run(() => api.setProjectStatus(p.id, NEXT_STATUS[p.status]))}>
                  Mark {NEXT_LABEL[p.status] === "Start" ? "active" : "delivered"}
                </button>
              )}
              {p.status !== "CANCELLED" && p.status !== "DELIVERED" && (
                <button className="link-btn" onClick={() => run(() => api.setProjectStatus(p.id, "CANCELLED"))}>
                  Cancel
                </button>
              )}
              <button className="link-btn" onClick={() => { setEditingProject(p); setShowProjectForm(true); }}>Edit</button>
              <button className="link-btn" onClick={() => setInvoiceFor(p)}>+ Invoice</button>
              <button
                className="link-btn danger"
                onClick={() => window.confirm(`Delete project "${p.title}" and its invoices?`) && run(() => api.deleteProject(p.id))}
              >
                Delete
              </button>
            </div>

            <TasksSection project={p} tasks={tasksFor(p.id)} onChanged={onChanged} />

            {invoicesFor(p.id).length > 0 && (
              <table className="invoice-table">
                <thead>
                  <tr><th>#</th><th>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {invoicesFor(p.id).map((inv) => (
                    <tr key={inv.id} className={`inv-${inv.status.toLowerCase()}`}>
                      <td>{inv.id}</td>
                      <td>{formatINR(inv.amountPaise)}</td>
                      <td>{formatDate(inv.issuedOn)}</td>
                      <td>{formatDate(inv.dueOn)}</td>
                      <td><span className={`badge inv ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                      <td className="inv-actions">
                        {inv.status === "UNPAID" && (
                          <>
                            <button className="link-btn" onClick={() => run(() => api.markInvoicePaid(inv.id))}>Mark paid</button>
                            <button className="link-btn" onClick={() => run(() => api.voidInvoice(inv.id))}>Void</button>
                          </>
                        )}
                        <button
                          className="link-btn danger"
                          onClick={() => window.confirm(`Delete invoice #${inv.id}?`) && run(() => api.deleteInvoice(inv.id))}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}

      {showProjectForm && (
        <ProjectForm
          clients={clients}
          project={editingProject}
          defaultClientId={selectedClientId}
          onClose={() => setShowProjectForm(false)}
          onSaved={() => { setShowProjectForm(false); onChanged(); }}
        />
      )}
      {invoiceFor && (
        <InvoiceForm
          project={invoiceFor}
          onClose={() => setInvoiceFor(null)}
          onSaved={() => { setInvoiceFor(null); onChanged(); }}
        />
      )}
    </main>
  );
}
