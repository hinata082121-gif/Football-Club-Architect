import { EffectDeltaBadge } from "@/components/EffectDeltaBadge";
import { getCurrentMonthProgressConfirmation } from "@/game/monthlySummaryEngine";
import { formatYearMonth } from "@/utils/date";
import { Children, type ReactNode } from "react";
import type { GameState } from "@/types/game";

interface MonthAdvanceConfirmModalProps {
  gameState: GameState;
  onCancel: () => void;
  onConfirm: () => void;
}

export function MonthAdvanceConfirmModal({
  gameState,
  onCancel,
  onConfirm,
}: MonthAdvanceConfirmModalProps) {
  const confirmation = getCurrentMonthProgressConfirmation(gameState);
  const hasMatches = confirmation.matches.length > 0;
  const pendingEventCount = gameState.events.filter((event) => event.status === "pending").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-md border border-zinc-700 bg-zinc-950/96 p-5 text-zinc-100 shadow-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">翌月へ進む前の確認</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {formatYearMonth(confirmation.year, confirmation.month)}
            </h2>
          </div>
          <EffectDeltaBadge
            label={confirmation.remainingAp > 0 ? "まだ行動できます" : "AP使用済み"}
            value={`AP ${confirmation.remainingAp}`}
            direction={confirmation.remainingAp > 0 ? "up" : "neutral"}
            tone={confirmation.remainingAp > 0 ? "negative" : "positive"}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoSection title="今月の社長・AI行動" empty="今月の行動ログはまだありません。">
            {confirmation.actionLogs.slice(0, 6).map((log) => (
              <li key={log.id}>{log.actorName}: {log.actionName}</li>
            ))}
          </InfoSection>
          <InfoSection title="今月の試合" empty="今月は試合をしていません。">
            {hasMatches
              ? confirmation.matches.map((match) => (
                  <li key={match.id}>
                    {match.type === "training" ? "練習試合" : "公式戦"}: {match.opponentName} {match.goalsFor}-{match.goalsAgainst}
                  </li>
                ))
              : null}
          </InfoSection>
          <InfoSection title="イベント" empty="解決済みイベントはありません。">
            {confirmation.resolvedEvents.slice(0, 4).map((log) => (
              <li key={log.id}>{log.actionName}</li>
            ))}
            {pendingEventCount > 0 ? (
              <li className="text-amber-200">未解決イベントが{pendingEventCount}件あります。</li>
            ) : null}
          </InfoSection>
          <InfoSection title="公式戦エントリー" empty="">
            <li>
              {gameState.officialCompetitionEntry?.active
                ? `参加中: 残り${gameState.officialCompetitionEntry.remainingMonths}か月`
                : "未エントリー。試合画面または行動画面から参加できます。"}
            </li>
          </InfoSection>
        </div>

        <div className="mt-5 grid gap-3">
          {confirmation.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-400/35 bg-amber-950/25 p-3">
              <h3 className="text-sm font-semibold text-amber-100">警告</h3>
              <ul className="mt-2 grid gap-1 text-sm text-amber-50">
                {confirmation.warnings.slice(0, 5).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
            <h3 className="text-sm font-semibold text-zinc-100">おすすめ</h3>
            <ul className="mt-2 grid gap-1 text-sm text-zinc-300">
              {confirmation.recommendations.slice(0, 4).map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            戻って行動を続ける
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            翌月へ進む
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoSection({
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
    <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      {hasChildren ? (
        <ul className="mt-2 grid gap-1 text-sm text-zinc-300">{children}</ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">{empty}</p>
      )}
    </div>
  );
}
