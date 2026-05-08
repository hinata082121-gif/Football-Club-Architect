import { FinancePanel } from "@/components/FinancePanel";
import { BankruptcyWarningPanel } from "@/components/BankruptcyWarningPanel";
import { FinanceWarningPanel } from "@/components/FinanceWarningPanel";
import { LoanPanel } from "@/components/LoanPanel";
import { RecoveryActionsPanel } from "@/components/RecoveryActionsPanel";
import { calculateTotalPlayerSalary } from "@/game/contractEngine";
import type { FinalRecoveryOptionType, GameState, RecoveryActionType } from "@/types/game";

interface FinanceScreenProps {
  gameState: GameState;
  onTakeLoan: (offerId: string) => void;
  onExecuteRecoveryAction: (actionType: RecoveryActionType) => void;
  onExecuteFinalRecoveryOption: (option: FinalRecoveryOptionType) => void;
}

export function FinanceScreen({
  gameState,
  onTakeLoan,
  onExecuteRecoveryAction,
  onExecuteFinalRecoveryOption,
}: FinanceScreenProps) {
  const income = gameState.financeLogs
    .filter((log) => log.amount > 0)
    .reduce((total, log) => total + log.amount, 0);
  const expenses = gameState.financeLogs
    .filter((log) => log.amount < 0)
    .reduce((total, log) => total + Math.abs(log.amount), 0);
  const playerSalary = calculateTotalPlayerSalary(gameState.players);
  const staffSalary = gameState.staff.reduce((total, member) => total + member.salary, 0);

  return (
    <section className="grid gap-5">
      <FinanceWarningPanel financialHealth={gameState.financialHealth} />
      <BankruptcyWarningPanel
        gameState={gameState}
        onExecuteFinalRecoveryOption={onExecuteFinalRecoveryOption}
      />
      <RecoveryActionsPanel
        gameState={gameState}
        onExecuteRecoveryAction={onExecuteRecoveryAction}
      />
      <LoanPanel gameState={gameState} onTakeLoan={onTakeLoan} />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="grid gap-3">
          <FinanceMetric label="現在資金" value={`${gameState.club.money.toLocaleString()}円`} />
          <FinanceMetric label="今月の選手年俸" value={`${playerSalary.toLocaleString()}円`} />
          <FinanceMetric label="今月のスタッフ給与" value={`${staffSalary.toLocaleString()}円`} />
          <FinanceMetric label="累計収入" value={`${income.toLocaleString()}円`} />
          <FinanceMetric label="累計支出" value={`${expenses.toLocaleString()}円`} />
          <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold">事業情報</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Info label="スポンサー力" value={gameState.club.sponsorPower} />
              <Info label="グッズ力" value={gameState.club.goodsPower} />
              <Info label="スタジアム収容人数" value={`${gameState.club.stadiumCapacity.toLocaleString()}人`} />
            </dl>
          </div>
        </aside>
        <FinancePanel logs={gameState.financeLogs} />
      </div>
    </section>
  );
}

function FinanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-2 last:border-0">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="font-semibold text-zinc-100">{value}</dd>
    </div>
  );
}
