import { useState } from "react";
import { api, formatDate } from "../api.js";

// The task list inside one project card: add, view, toggle done, edit, delete.
export default function TasksSection({ project, tasks, onChanged }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  async function run(fn) {
    setError("");
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFieldErrors({});
    const local = {};
    if (!title.trim()) local.title = "Title is required";
    if (!dueDate) local.dueDate = "Pick a due date";
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      return;
    }
    setSaving(true);
    try {
      await api.createTask({ projectId: project.id, title, notes, dueDate });
      setTitle(""); setDueDate(""); setNotes("");
      onChanged();
    } catch (err) {
      if (err.details) setFieldErrors(err.details);
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDueDate(formatDate(t.dueDate));
    setEditNotes(t.notes || "");
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    await run(async () => {
      await api.updateTask(editingId, {
        projectId: project.id,
        title: editTitle,
        notes: editNotes,
        dueDate: editDueDate,
      });
      setEditingId(null);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="tasks-section">
      <h4>Studio tasks ({tasks.length})</h4>
      {error && <div className="banner error small">{error}</div>}

      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id} className={`task-row ${t.done ? "done" : ""}`}>
            {editingId === t.id ? (
              <form className="task-edit" onSubmit={saveEdit}>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes" />
                <button type="submit" className="link-btn">Save</button>
                <button type="button" className="link-btn" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <label className="task-check">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => run(() => api.toggleTask(t.id))}
                  />
                  <span className="task-title">{t.title}</span>
                </label>
                {t.notes && <span className="task-notes">{t.notes}</span>}
                <span className={`task-due ${!t.done && formatDate(t.dueDate) < today ? "late" : ""}`}>
                  {formatDate(t.dueDate)}
                </span>
                <span className="task-actions">
                  <button className="link-btn" onClick={() => startEdit(t)}>Edit</button>
                  <button
                    className="link-btn danger"
                    onClick={() => window.confirm(`Delete task "${t.title}"?`) && run(() => api.deleteTask(t.id))}
                  >
                    Delete
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
        {tasks.length === 0 && <li className="muted">No tasks yet for this project.</li>}
      </ul>

      <form className="task-add" onSubmit={handleAdd} noValidate>
        <input
          placeholder="New task title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldErrors.title ? "invalid" : ""}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={fieldErrors.dueDate ? "invalid" : ""}
        />
        <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit" className="primary small" disabled={saving}>{saving ? "Adding..." : "Add task"}</button>
        {(fieldErrors.title || fieldErrors.dueDate) && (
          <span className="field-error">{fieldErrors.title || fieldErrors.dueDate}</span>
        )}
      </form>
    </div>
  );
}
