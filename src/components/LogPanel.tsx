import { formatDatedRecord } from "@/utils/date";
import type { ActionLog, StatEffects } from "@/types/game";

export function LogPanel({ logs }: { logs: ActionLog[] }) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">行動ログ</h2>
      <ul className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">
        {logs.map((log) => (
          <li key={log.id} className="border-b border-zinc-800 pb-3 last:border-0">
            <p className="text-xs text-zinc-500">
              {formatDatedRecord(log)} / {log.actorName}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{log.actionName}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{log.reason}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">{log.result}</p>
            <p className="mt-2 text-xs text-zinc-500">{formatEffects(log.effects)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatEffects(effects: StatEffects): string {
  const items = Object.entries(effects).filter(([, value]) => value !== undefined && value !== 0);

  if (items.length === 0) {
    return "effects: none";
  }

  return `effects: ${items
    .map(([key, value]) => `${key} ${Number(value) > 0 ? "+" : ""}${value}`)
    .join(" / ")}`;
}
