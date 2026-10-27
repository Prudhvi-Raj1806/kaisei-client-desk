import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import StatsBar from "./components/StatsBar.jsx";
import ClientSidebar from "./components/ClientSidebar.jsx";
import ProjectBoard from "./components/ProjectBoard.jsx";


export default function App() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null); // null = all clients
  const [projectFilter, setProjectFilter] = useState(""); // "" = every status
  const [clientSearch, setClientSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // One function reloads everything shown on screen, straight from the DB.
  const loadAll = useCallback(async () => {
    const [c, p, i, s, t] = await Promise.all([
      api.listClients(clientSearch),
      api.listProjects({
        status: projectFilter,
        clientId: selectedClientId || "",
      }),
      api.listInvoices(),
      api.stats(),
      api.listTasks(selectedClientId ? {} : {}),
    ]);
    setClients(c);
    setProjects(p);
    setInvoices(i);
    setStats(s);
    setTasks(t);
  }, [clientSearch, projectFilter, selectedClientId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAll()
      .then(() => !cancelled && setPageError(""))
      .catch((e) => !cancelled && setPageError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  // After any change, re-pull from the server so the screen always shows
  // what is actually stored.
  const refresh = () => loadAll().catch((e) => setPageError(e.message));

  if (pageError && !stats) {
    return (
      <div className="page-error">
        <h1>Kaisei Client Desk</h1>
        <p>Could not load data: {pageError}</p>
        <p className="muted">Is the backend running on port 5000? Is PostgreSQL up?</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Kaisei Client Desk</h1>
          <p className="tagline">Clients, projects and invoices for a freelance web studio.</p>
        </div>
      </header>

      <StatsBar stats={stats} />

      {pageError && <div className="banner error">{pageError}</div>}

      <div className="layout">
        <ClientSidebar
          clients={clients}
          selectedClientId={selectedClientId}
          onSelect={setSelectedClientId}
          search={clientSearch}
          onSearch={setClientSearch}
          onChanged={refresh}
        />
        <ProjectBoard
          projects={projects}
          invoices={invoices}
          tasks={tasks}
          clients={clients}
          selectedClientId={selectedClientId}
          filter={projectFilter}
          onFilter={setProjectFilter}
          loading={loading}
          onChanged={refresh}
        />
      </div>
    </div>
  );
}
