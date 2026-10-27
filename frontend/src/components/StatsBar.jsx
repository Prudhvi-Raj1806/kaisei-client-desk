import { formatINR } from "../api.js";

export default function StatsBar({ stats }) {
  if (!stats) return null;
  const cards = [
    { label: "CLIENTS", value: stats.clients, cls: "amber" },
    { label: "ACTIVE PROJECTS", value: stats.projects.active, cls: "blue" },
    { label: "OUTSTANDING", value: formatINR(stats.moneyPaise.outstanding), cls: "red" },
    { label: "COLLECTED", value: formatINR(stats.moneyPaise.collected), cls: "green" },
  ];
  return (
    <div className="stats-bar">
      {cards.map((c) => (
        <div className={`stat-card ${c.cls}`} key={c.label}>
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
