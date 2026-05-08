import { LogPanel } from "@/components/LogPanel";
import type { ActionLog } from "@/types/game";

interface LogsScreenProps {
  logs: ActionLog[];
}

export function LogsScreen({ logs }: LogsScreenProps) {
  const aiLogCount = logs.filter((log) => log.actorType === "staff").length;
  const eventLogCount = logs.filter((log) => log.actionName.includes("イベント")).length;

  return (
    <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <h2 className="text-lg font-semibold">ログ分類</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <Info label="AI行動ログ" value={`${aiLogCount}件`} />
          <Info label="イベントログ" value={`${eventLogCount}件`} />
          <Info label="全ログ" value={`${logs.length}件`} />
        </dl>
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          スタッフAIの理由、イベント結果、システム警告をまとめて確認できます。
        </p>
      </aside>
      <LogPanel logs={logs} />
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 font-semibold text-zinc-100">{value}</dd>
    </div>
  );
}
