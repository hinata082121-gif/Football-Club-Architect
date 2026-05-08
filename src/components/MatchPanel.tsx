import { MatchResultCard } from "@/components/MatchResultCard";
import { MATCH_BALANCE } from "@/game/balance";
import { canEnterOfficialCompetition } from "@/game/matchEngine";
import { formatDatedRecord } from "@/utils/date";
import type { GameState, Match, MatchReport } from "@/types/game";

interface MatchPanelProps {
  gameState: GameState;
  latestMatch: Match | undefined;
  report: MatchReport | null;
  onEnterOfficialCompetition: () => void;
}

export function MatchPanel({
  gameState,
  latestMatch,
  report,
  onEnterOfficialCompetition,
}: MatchPanelProps) {
  const canEnter = canEnterOfficialCompetition(gameState);

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">公式戦・試合レポート</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            公式戦は翌月に自動実行されます。未参加でも練習試合で育成できます。
          </p>
        </div>
        <button
          type="button"
          disabled={!canEnter}
          onClick={onEnterOfficialCompetition}
          className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          公式戦にエントリー
        </button>
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-300">
        <p>
          状態:{" "}
          {gameState.hasEnteredOfficialCompetition
            ? "エントリー済み"
            : "未エントリー"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          参加費 {MATCH_BALANCE.officialEntryFee.toLocaleString()}円
          {gameState.scheduledOfficialMatch
            ? ` / 次戦: ${formatDatedRecord(gameState.scheduledOfficialMatch)} ${gameState.scheduledOfficialMatch.opponentName} 戦`
            : " / 予定なし"}
        </p>
        {gameState.scheduledOfficialMatch ? (
          <p className="mt-2 text-xs text-zinc-400">
            相手社長: {gameState.scheduledOfficialMatch.opponentOwnerName ?? "不明"} / Lv{" "}
            {gameState.scheduledOfficialMatch.opponentClubLevel ?? "-"} / 方針{" "}
            {gameState.scheduledOfficialMatch.opponentPlayStyle ?? "-"}
          </p>
        ) : null}
      </div>

      {!latestMatch || !report ? (
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          まだ試合結果はありません。練習試合または公式戦後にレポートを表示します。
        </p>
      ) : (
        <div className="mt-4">
          <MatchResultCard match={latestMatch} clubName={gameState.club.name} />
        </div>
      )}
    </section>
  );
}
