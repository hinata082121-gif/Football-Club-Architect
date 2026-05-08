import { getFinancialHealthStatusLabel } from "@/game/financeHealthEngine";
import type { FinancialHealth } from "@/types/game";

interface FinanceWarningPanelProps {
  financialHealth: FinancialHealth;
  compact?: boolean;
}

export function FinanceWarningPanel({
  financialHealth,
  compact = false,
}: FinanceWarningPanelProps) {
  const netMonthly =
    financialHealth.monthlyIncomeEstimate - financialHealth.monthlyExpenseEstimate;
  const isHealthy = financialHealth.status === "healthy";
  const isSevere =
    financialHealth.status === "insolvent" || financialHealth.status === "bankrupt";

  return (
    <section
      className={`rounded-md border p-5 backdrop-blur ${
        isSevere
          ? "border-rose-400/45 bg-rose-950/35"
          : isHealthy
            ? "border-zinc-800 bg-zinc-900/70"
            : "border-amber-400/35 bg-amber-950/25"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className={isSevere ? "text-sm font-medium text-rose-200" : "text-sm font-medium text-amber-200"}>
            財務状態
          </p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-50">
            {getFinancialHealthStatusLabel(financialHealth.status)}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            推定月次収支:{" "}
            <span className={netMonthly >= 0 ? "font-semibold text-emerald-200" : "font-semibold text-rose-200"}>
              {netMonthly >= 0 ? "+" : ""}
              {netMonthly.toLocaleString()}円
            </span>
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-950/55 px-3 py-2 text-sm text-zinc-300">
          債務超過ライン {financialHealth.insolvencyLine.toLocaleString()}円
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
        <FinanceStat label="資金" value={`${financialHealth.money.toLocaleString()}円`} />
        {!compact ? (
          <>
            <FinanceStat label="借入残高" value={`${financialHealth.debt.toLocaleString()}円`} />
            <FinanceStat label="純資産" value={`${financialHealth.netWorth.toLocaleString()}円`} />
            <FinanceStat label="推定月次収入" value={`${financialHealth.monthlyIncomeEstimate.toLocaleString()}円`} />
            <FinanceStat label="推定月次支出" value={`${financialHealth.monthlyExpenseEstimate.toLocaleString()}円`} />
          </>
        ) : (
          <FinanceStat label="猶予月数" value={`${financialHealth.monthsInInsolvency}か月`} />
        )}
      </div>

      {!compact ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MessageList title="警告" items={financialHealth.warnings} emptyMessage="現在、重大な財務警告はありません。" />
          <MessageList title="改善提案" items={financialHealth.recommendedActions} emptyMessage="現在の運営を維持しましょう。" />
        </div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {(financialHealth.warnings.length > 0
            ? financialHealth.warnings
            : financialHealth.recommendedActions
          )
            .slice(0, 2)
            .map((message) => (
              <li key={message} className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3 text-sm text-zinc-200">
                {message}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function FinanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function MessageList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3 text-sm text-zinc-200">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
