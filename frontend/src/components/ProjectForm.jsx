import { useState } from "react";
import { api, formatDate } from "../api.js";

// One form for creating and editing a project (a modal).
export default function ProjectForm({ clients, project, defaultClientId, onClose, onSaved }) {
  const editing = Boolean(project);
  const [clientId, setClientId] = useState(project?.clientId || defaultClientId || "");
  const [title, setTitle] = useState(project?.title || "");
  const [brief, setBrief] = useState(project?.brief || "");
  const [deadline, setDeadline] = useState(project ? formatDate(project.deadline) : "");
  const [budgetRupees, setBudgetRupees] = useState(project ? project.budgetPaise / 100 : "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    const local = {};
    if (!clientId) local.clientId = "Pick a client";
    if (!title.trim()) local.title = "Title is required";
    if (!deadline) local.deadline = "Deadline is required";
    if (budgetRupees !== "" && !(Number(budgetRupees) > 0)) local.budget = "Budget must be a positive number";
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      return;
    }

    const payload = {
      clientId: Number(clientId),
      title,
      brief,
      deadline,
      budgetRupees: budgetRupees === "" ? undefined : Number(budgetRupees),
    };

    setSaving(true);
    try {
      if (editing) await api.updateProject(project.id, payload);
      else await api.createProject(payload);
      onSaved();
    } catch (err) {
      if (err.details) setFieldErrors(err.details);
      else setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal card form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <h3>{editing ? `Edit project #${project.id}` : "New project"}</h3>
        {formError && <div className="banner error small">{formError}</div>}

        <label>
          Client *
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={fieldErrors.clientId ? "invalid" : ""}>
            <option value="">Choose...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>
            ))}
          </select>
          {fieldErrors.clientId && <span className="field-error">{fieldErrors.clientId}</span>}
        </label>

        <label>
          Title *
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldErrors.title ? "invalid" : ""} />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </label>

        <label>
          Brief
          <textarea rows="3" value={brief} onChange={(e) => setBrief(e.target.value)} />
        </label>

        <label>
          Deadline *
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldErrors.deadline ? "invalid" : ""} />
          {fieldErrors.deadline && <span className="field-error">{fieldErrors.deadline}</span>}
        </label>

        <label>
          Budget (₹)
          <input type="number" min="0" step="0.01" value={budgetRupees} onChange={(e) => setBudgetRupees(e.target.value)} className={fieldErrors.budget ? "invalid" : ""} />
          {fieldErrors.budget && <span className="field-error">{fieldErrors.budget}</span>}
        </label>

        <div className="modal-actions">
          <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create project"}</button>
        </div>
      </form>
    </div>
  );
}
