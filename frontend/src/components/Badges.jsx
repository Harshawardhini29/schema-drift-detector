export function RiskBadge({ risk }) {
  const map = {
    high:   "bg-red-900/50 text-red-400 border-red-700",
    medium: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
    low:    "bg-green-900/50 text-neon-green border-green-700",
    none:   "bg-slate-800 text-slate-400 border-slate-600",
  };
  const cls = map[(risk || "none").toLowerCase()] || map.none;
  return (
    <span className={`border px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase ${cls}`}>
      {risk || "none"}
    </span>
  );
}

export function ClassBadge({ classification }) {
  const map = {
    breaking:             "bg-red-900/50 text-red-400 border-red-700",
    additive:             "bg-green-900/50 text-neon-green border-green-700",
    potentially_breaking: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
  };
  const cls = map[(classification || "").toLowerCase()] || "bg-slate-800 text-slate-400 border-slate-600";
  return (
    <span className={`border px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase ${cls}`}>
      {(classification || "unknown").replace("_", " ")}
    </span>
  );
}
