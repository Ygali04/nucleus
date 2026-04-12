interface LogFiltersProps {
  search: string;
  level: string;
  agent: string;
  agents: string[];
  onSearch: (value: string) => void;
  onLevel: (value: string) => void;
  onAgent: (value: string) => void;
}

export function LogFilters({
  search,
  level,
  agent,
  agents,
  onSearch,
  onLevel,
  onAgent,
}: LogFiltersProps) {
  return (
    <div className="gs-card mb-5 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto_auto]">
      <input
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search logs"
        className="rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-brass)]"
      />
      <select
        value={level}
        onChange={(event) => onLevel(event.target.value)}
        className="rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-brass)]"
      >
        <option value="all">All levels</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Error</option>
      </select>
      <select
        value={agent}
        onChange={(event) => onAgent(event.target.value)}
        className="rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-brass)]"
      >
        <option value="all">All agents</option>
        {agents.map((agentName) => (
          <option key={agentName} value={agentName}>
            {agentName}
          </option>
        ))}
      </select>
    </div>
  );
}
