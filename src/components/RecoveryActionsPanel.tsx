import { getAvailableRecoveryActions } from "@/game/recoveryActionEngine";
import type { GameState, RecoveryAction, RecoveryActionType } from "@/types/game";

interface RecoveryActionsPanelProps {
  gameState: GameState;
  onExecuteRecoveryAction: (actionType: RecoveryActionType) => void;
  compact?: boolean;
}

export function RecoveryActionsPanel({
  gameState,
  onExecuteRecoveryAction,
  compact = false,
}: RecoveryActionsPanelProps) {
  const actions = getAvailableRecoveryActions(gameState);
  const activeAdvance = gameState.sponsorAdvance?.active ? gameState.sponsorAdvance : null;

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-300">短期リカバリー</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">借入以外の資金確保</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            すぐ資金を作れますが、評判・ファン・将来収入に影響する判断です。
          </p>
        </div>
        {activeAdvance ? (
          <div className="rounded-md border border-amber-400/40 bg-amber-950/35 px-3 py-2 text-sm">
            <p className="font-semibold text-amber-100">スポンサー前借り中</p>
            <p className="mt-1 text-xs text-amber-200">
              残り{activeAdvance.remainingMonths}か月 / 月次減少{" "}
              {activeAdvance.monthlySponsorPenalty.toLocaleString()}円
            </p>
          </div>
        ) : null}
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "lg:grid-cols-2" : "xl:grid-cols-2"}`}>
        {actions.map((action) => (
          <RecoveryActionCard
            key={action.type}
            action={action}
            compact={compact}
            onExecuteRecoveryAction={onExecuteRecoveryAction}
          />
        ))}
      </div>
    </section>
  );
}

function RecoveryActionCard({
  action,
  compact,
  onExecuteRecoveryAction,
}: {
  action: RecoveryAction;
  compact: boolean;
  onExecuteRecoveryAction: (actionType: RecoveryActionType) => void;
}) {
  return (
    <article className={`rounded-md border border-zinc-800 bg-zinc-950/58 p-4 ${action.available ? "" : "opacity-65"}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-50">{action.title}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">{action.description}</p>
        </div>
        <span className={action.available ? "rounded bg-emerald-400 px-2 py-1 text-xs font-bold text-zinc-950" : "rounded bg-zinc-700 px-2 py-1 text-xs font-bold text-zinc-300"}>
          {action.available ? "実行可能" : "実行不可"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="即時資金" value={`+${action.immediateMoneyEffect.toLocaleString()}円`} />
        <MiniStat label="月次影響" value={action.monthlyPenalty ? `-${action.monthlyPenalty.toLocaleString()}円` : "なし"} />
        <MiniStat label="期間" value={action.durationMonths ? `${action.durationMonths}か月` : "単発"} />
        <MiniStat label="評判" value={formatSigned(action.reputationEffect ?? 0)} />
      </div>

      {!compact ? (
        <p className="mt-3 text-xs leading-5 text-amber-200">{action.riskNote}</p>
      ) : null}

      <button
        type="button"
        disabled={!action.available}
        onClick={() => onExecuteRecoveryAction(action.type)}
        className={`mt-4 h-10 w-full rounded-md text-sm font-semibold transition ${
          action.available
            ? "bg-amber-300 text-zinc-950 hover:bg-amber-200"
            : "cursor-not-allowed border border-zinc-700 text-zinc-500"
        }`}
      >
        実行する
      </button>
      {!action.available && action.disabledReason ? (
        <p className="mt-2 text-xs text-amber-200">理由: {action.disabledReason}</p>
      ) : null}
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/55 p-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}
