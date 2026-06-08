export function RiskBadge({ risk }) {
  const map = {
    high:   "bg-flux-error/10 text-flux-error border-flux-error/20",
    medium: "bg-flux-tertiary/10 text-flux-tertiary border-flux-tertiary/20",
    low:    "bg-flux-secondary/10 text-flux-secondary border-flux-secondary/20",
    none:   "bg-flux-surface-container-high/40 text-flux-on-surface-variant border-flux-outline/20",
  };
  const cls = map[(risk || "none").toLowerCase()] || map.none;
  return (
    <span className={`border px-2 py-0.5 rounded-[4px] text-xs font-mono font-semibold uppercase ${cls}`}>
      {risk || "none"}
    </span>
  );
}

export function ClassBadge({ classification }) {
  const map = {
    breaking:             "bg-flux-error/10 text-flux-error border-flux-error/20",
    additive:             "bg-flux-secondary/10 text-flux-secondary border-flux-secondary/20",
    potentially_breaking: "bg-flux-tertiary/10 text-flux-tertiary border-flux-tertiary/20",
  };
  const cls = map[(classification || "").toLowerCase()] || "bg-flux-surface-container-high/40 text-flux-on-surface-variant border-flux-outline/20";
  return (
    <span className={`border px-2 py-0.5 rounded-[4px] text-xs font-mono font-semibold uppercase ${cls}`}>
      {(classification || "unknown").replace("_", " ")}
    </span>
  );
}
