const COLORS = {
  high:   "bg-tier-high text-white",
  medium: "bg-tier-medium/15 text-tier-medium border border-tier-medium/30",
  low:    "bg-tier-low/15 text-tier-low border border-tier-low/30",
  none:   "bg-ink-100 text-ink-600",
};

export default function ConfidenceBadge({ tier, score }) {
  const cls = COLORS[tier] || COLORS.none;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase ${cls}`}>
      {tier} · {Number(score).toFixed(2)}
    </span>
  );
}
