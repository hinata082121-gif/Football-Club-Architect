import { formatDatedRecord } from "@/utils/date";
import type { FinanceLog } from "@/types/game";

interface FinancePanelProps {
  logs: FinanceLog[];
}

export function FinancePanel({ logs }: FinancePanelProps) {
  const playerSalaryExpense = sumExpenseByCategory(logs, "player_salary");
  const staffSalaryExpense = sumExpenseByCategory(logs, "salary");
  const loanRepaymentExpense = sumExpenseByCategory(logs, "loan_repayment");
  const recoveryIncome = sumIncomeByCategory(logs, "recovery");
  const sponsorPenaltyExpense = sumExpenseByCategory(logs, "sponsor");
  const laborExpense = playerSalaryExpense + staffSalaryExpense;

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">財務ログ</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <FinanceSummary label="選手年俸支出" value={playerSalaryExpense} />
        <FinanceSummary label="スタッフ給与支出" value={staffSalaryExpense} />
        <FinanceSummary label="融資返済支出" value={loanRepaymentExpense} />
        <FinanceSummary label="短期リカバリー収入" value={recoveryIncome} positive />
        <FinanceSummary label="スポンサー前借り控除" value={sponsorPenaltyExpense} />
        <FinanceSummary label="人件費合計" value={laborExpense} />
      </div>
      <ul className="mt-4 max-h-80 space-y-3 overflow-auto pr-1">
        {logs.map((log) => (
          <li key={log.id} className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-3 text-sm last:border-0">
            <div>
              <p className="text-xs text-zinc-500">{formatDatedRecord(log)} / {log.category}</p>
              <p className="mt-1 text-zinc-300">{log.description}</p>
            </div>
            <span className={log.amount >= 0 ? "text-emerald-300" : "text-rose-300"}>
              {log.amount >= 0 ? "+" : ""}
              {log.amount.toLocaleString()}円
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FinanceSummary({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${positive ? "text-emerald-200" : "text-rose-200"}`}>
        {value.toLocaleString()}円
      </p>
    </div>
  );
}

function sumIncomeByCategory(
  logs: FinanceLog[],
  category: FinanceLog["category"],
): number {
  return logs
    .filter((log) => log.category === category && log.amount > 0)
    .reduce((total, log) => total + log.amount, 0);
}

function sumExpenseByCategory(
  logs: FinanceLog[],
  category: FinanceLog["category"],
): number {
  return logs
    .filter((log) => log.category === category && log.amount < 0)
    .reduce((total, log) => total + Math.abs(log.amount), 0);
}
