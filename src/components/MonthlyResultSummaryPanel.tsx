import { EffectDeltaBadge } from "@/components/EffectDeltaBadge";
import { formatYearMonth } from "@/utils/date";
import { Children, type ReactNode } from "react";
import type { MonthlyResultSummary } from "@/types/game";

interface MonthlyResultSummaryPanelProps {
  summary: MonthlyResultSummary;
  onDismiss: () => void;
  compact?: boolean;
}

export function MonthlyResultSummaryPanel({
  summary,
  onDismiss,
  compact = false,
}: MonthlyResultSummaryPanelProps) {
  const netFinance = summary.financeLogs.reduce((total, log) => total + log.amount, 0);
  const officialMatches = summary.matches.filter((match) => match.type === "league" || match.type === "cup");
  const trainingMatches = summary.matches.filter((match) => match.type === "training");

  return (
    <section className="rounded-md border border-emerald-400/35 bg-emerald-950/20 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-200">先月の振り返り</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">
            {formatYearMonth(summary.year, summary.month)}
          </h2>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="h-9 rounded-md border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
        >
          確認しました
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {summary.keyChanges.map((change) => (
          <EffectDeltaBadge
            key={change.label}
            label={change.label}
            value={formatDelta(change.delta)}
            direction={change.direction}
            tone={change.tone}
          />
        ))}
        <EffectDeltaBadge
          label="財務変化"
          value={formatMoney(netFinance)}
          direction={netFinance > 0 ? "up" : netFinance < 0 ? "down" : "neutral"}
          tone={netFinance > 0 ? "positive" : netFinance < 0 ? "negative" : "neutral"}
        />
      </div>

      {!compact ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <SummaryList title="主な行動" empty="行動ログはありません。">
            {summary.actionLogs.slice(0, 5).map((log) => (
              <li key={log.id}>{log.actorName}: {log.actionName}</li>
            ))}
          </SummaryList>
          <SummaryList title="試合結果" empty="試合はありません。">
            {summary.matches.map((match) => (
              <li key={match.id}>
                {match.type === "training" ? "練習" : "公式"}: {match.opponentName} {match.goalsFor}-{match.goalsAgainst}
              </li>
            ))}
            {officialMatches.length > 0 ? <li className="text-emerald-200">公式戦 {officialMatches.length}試合</li> : null}
            {trainingMatches.length > 0 ? <li className="text-sky-200">練習試合 {trainingMatches.length}試合</li> : null}
          </SummaryList>
          <SummaryList title="警告と次の行動" empty="重大な警告はありません。">
            {[...summary.warnings.slice(0, 2), ...summary.recommendations.slice(0, 2)].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </SummaryList>
        </div>
      ) : null}
    </section>
  );
}

function SummaryList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Children.count(children) > 0;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <ul className="mt-2 grid gap-1 text-sm text-zinc-300">
        {hasChildren ? children : <li className="text-zinc-500">{empty}</li>}
      </ul>
    </div>
  );
}

function formatDelta(value: number | undefined): string {
  if (!value) {
    return "0";
  }

  return `${value > 0 ? "+" : ""}${value.toLocaleString()}`;
}

function formatMoney(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}円`;
}
