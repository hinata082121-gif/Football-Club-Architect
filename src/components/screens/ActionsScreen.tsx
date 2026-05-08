import { ActionPanel } from "@/components/ActionPanel";
import { CurrentMonthSummaryPanel } from "@/components/CurrentMonthSummaryPanel";
import { LoanPanel } from "@/components/LoanPanel";
import { RecoveryActionsPanel } from "@/components/RecoveryActionsPanel";
import { MATCH_BALANCE } from "@/game/balance";
import { canEnterOfficialCompetition } from "@/game/matchEngine";
import { formatDatedRecord } from "@/utils/date";
import type { GameState, PlayerAction, RecoveryActionType } from "@/types/game";

interface ActionsScreenProps {
  gameState: GameState;
  onPlayerAction: (action: PlayerAction) => void;
  onEnterOfficialCompetition: () => void;
  onTakeLoan: (offerId: string) => void;
  onExecuteRecoveryAction: (actionType: RecoveryActionType) => void;
}

export function ActionsScreen({
  gameState,
  onPlayerAction,
  onEnterOfficialCompetition,
  onTakeLoan,
  onExecuteRecoveryAction,
}: ActionsScreenProps) {
  const canEnter = canEnterOfficialCompetition(gameState);
  const officialEntry = gameState.officialCompetitionEntry;
  const isOfficialActive = officialEntry?.active ?? false;

  return (
    <section className="grid gap-5">
      <CurrentMonthSummaryPanel gameState={gameState} />
      {gameState.financialHealth.status !== "healthy" ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <RecoveryActionsPanel
            gameState={gameState}
            onExecuteRecoveryAction={onExecuteRecoveryAction}
            compact
          />
          <LoanPanel gameState={gameState} onTakeLoan={onTakeLoan} compact />
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <ActionPanel gameState={gameState} onPerformAction={onPlayerAction} />
        <aside className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h2 className="text-lg font-semibold">公式戦エントリー</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            簡易リーグ戦に参加すると、4か月間にわたり翌月進行時に公式戦が自動実行されます。
          </p>
          <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/58 p-3 text-sm text-zinc-300">
            <p>
              状態:{" "}
              {isOfficialActive
                ? `参加中（残り${officialEntry?.remainingMonths ?? 0}か月）`
                : canEnter
                  ? "実行可能"
                  : "実行不可"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              参加費 {MATCH_BALANCE.officialEntryFee.toLocaleString()}円
            </p>
            {isOfficialActive ? (
              <p className="mt-2 text-xs text-emerald-200">
                成績: {officialEntry?.wins ?? 0}勝{officialEntry?.draws ?? 0}分{officialEntry?.losses ?? 0}敗 /{" "}
                得点{officialEntry?.goalsFor ?? 0}・失点{officialEntry?.goalsAgainst ?? 0}
              </p>
            ) : null}
            {!canEnter && !isOfficialActive ? (
              <p className="mt-2 text-xs text-amber-300">理由: 資金不足、または既にエントリー済みです。</p>
            ) : null}
            {gameState.scheduledOfficialMatch ? (
              <p className="mt-2 text-xs text-zinc-400">
                次戦: {formatDatedRecord(gameState.scheduledOfficialMatch)} /{" "}
                {gameState.scheduledOfficialMatch.opponentName}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={!canEnter}
            onClick={onEnterOfficialCompetition}
            className="mt-4 h-10 w-full rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isOfficialActive ? "公式戦参加中" : "公式戦に4か月エントリー"}
          </button>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            エントリーしない月でも、試合画面から練習試合を実行できます。
          </p>
        </aside>
      </div>
    </section>
  );
}
