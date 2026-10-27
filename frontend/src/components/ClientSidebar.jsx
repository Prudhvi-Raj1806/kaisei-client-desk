import { useState } from "react";
import { api } from "../api.js";

// Left column: client search, the client list, and the add-client form.
export default function ClientSidebar({ clients, selectedClientId, onSelect, search, onSearch, onChanged }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    // Quick client-side check; the API checks everything again.
    const local = {};
    if (!name.trim()) local.name = "Name is required";
    if (!email.trim()) local.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) local.email = "Email must look like name@example.com";
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      return;
    }

    setSaving(true);
    try {
      await api.createClient({ name, company, email, phone });
      setName(""); setCompany(""); setEmail(""); setPhone("");
      onChanged();
    } catch (err) {
      if (err.details) setFieldErrors(err.details);
      else setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client) {
    if (!window.confirm(`Delete client "${client.name}"?`)) return;
    try {
      await api.deleteClient(client.id);
      if (selectedClientId === client.id) onSelect(null);
      onChanged();
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <aside className="sidebar">
      <input
        className="search-box"
        placeholder="Search clients..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />

      <div className="client-list">
        <button
          className={`client-row ${selectedClientId === null ? "selected" : ""}`}
          onClick={() => onSelect(null)}
        >
          <span className="client-name">All clients</span>
        </button>
        {clients.map((c) => (
          <div
            key={c.id}
            className={`client-row ${selectedClientId === c.id ? "selected" : ""}`}
            onClick={() => onSelect(c.id)}
            role="button"
            tabIndex={0}
          >
            <span className="client-name">{c.name}</span>
            <span className="client-company">{c.company || c.email}</span>
            <span className="chip">{c.projectCount} project{c.projectCount === 1 ? "" : "s"}</span>
            <button
              className="link-btn danger"
              onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
            >
              Delete
            </button>
          </div>
        ))}
        {clients.length === 0 && <p className="muted pad">No clients match.</p>}
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h3>Add client</h3>
        {formError && <div className="banner error small">{formError}</div>}
        <label>
          Name *
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldErrors.name ? "invalid" : ""} />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </label>
        <label>
          Company
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
        <label>
          Email *
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldErrors.email ? "invalid" : ""} />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldErrors.phone ? "invalid" : ""} />
          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
        </label>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Saving..." : "Add client"}
        </button>
      </form>
    </aside>
  );
}
