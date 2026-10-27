import { useState } from "react";
import { api } from "../api.js";

// Modal form to raise an invoice against one project.
export default function InvoiceForm({ project, onClose, onSaved }) {
  const [amountRupees, setAmountRupees] = useState("");
  const [issuedOn, setIssuedOn] = useState(new Date().toISOString().slice(0, 10));
  const [dueOn, setDueOn] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    const local = {};
    if (!(Number(amountRupees) > 0)) local.amount = "Amount must be a positive number";
    if (!dueOn) local.dueOn = "Due date is required";
    else if (issuedOn && dueOn < issuedOn) local.dueOn = "Due date cannot be before the issue date";
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      return;
    }

    setSaving(true);
    try {
      await api.createInvoice({
        projectId: project.id,
        amountRupees: Number(amountRupees),
        issuedOn,
        dueOn,
        note,
      });
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
        <h3>New invoice - {project.title}</h3>
        {formError && <div className="banner error small">{formError}</div>}

        <label>
          Amount (₹) *
          <input type="number" min="0" step="0.01" value={amountRupees} onChange={(e) => setAmountRupees(e.target.value)} className={fieldErrors.amount ? "invalid" : ""} />
          {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
        </label>

        <label>
          Issued on
          <input type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
        </label>

        <label>
          Due on *
          <input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={fieldErrors.dueOn ? "invalid" : ""} />
          {fieldErrors.dueOn && <span className="field-error">{fieldErrors.dueOn}</span>}
        </label>

        <label>
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Advance, milestone 1..." />
        </label>

        <div className="modal-actions">
          <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? "Saving..." : "Create invoice"}</button>
        </div>
      </form>
    </div>
  );
}
