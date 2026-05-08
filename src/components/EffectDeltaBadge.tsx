import type { SummaryChange } from "@/types/game";

interface EffectDeltaBadgeProps {
  label: string;
  value?: string | number;
  direction: SummaryChange["direction"];
  tone?: SummaryChange["tone"];
}

export function EffectDeltaBadge({
  label,
  value,
  direction,
  tone = "neutral",
}: EffectDeltaBadgeProps) {
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const toneClass = {
    positive: "border-emerald-400/35 bg-emerald-950/35 text-emerald-100",
    negative: "border-rose-400/35 bg-rose-950/35 text-rose-100",
    neutral: "border-zinc-700 bg-zinc-900/70 text-zinc-200",
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${toneClass}`}>
      <span>{label}</span>
      <span>{arrow}</span>
      {value !== undefined ? <span>{value}</span> : null}
    </span>
  );
}
