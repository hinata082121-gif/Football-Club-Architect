import {
  calculateMonthlyLoanPaymentTotal,
  calculateTotalDebt,
  getLoanOffers,
  getLoanTypeLabel,
} from "@/game/loanEngine";
import { formatYearMonth } from "@/utils/date";
import type { GameState, LoanOffer } from "@/types/game";

interface LoanPanelProps {
  gameState: GameState;
  onTakeLoan: (offerId: string) => void;
  compact?: boolean;
}

export function LoanPanel({ gameState, onTakeLoan, compact = false }: LoanPanelProps) {
  const offers = getLoanOffers(gameState);
  const activeLoans = gameState.loans.filter((loan) => loan.status === "active");
  const totalDebt = calculateTotalDebt(gameState);
  const monthlyPayment = calculateMonthlyLoanPaymentTotal(gameState);

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">資金調達</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">融資と追加出資</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            融資は短期的な資金繰りを助けますが、翌月以降の返済負担になります。
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <LoanMetric label="借入残高" value={`${totalDebt.toLocaleString()}円`} />
          <LoanMetric label="月次返済" value={`${monthlyPayment.toLocaleString()}円`} />
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/45 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">active loan一覧</h3>
          {activeLoans.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">現在返済中の融資はありません。</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {activeLoans.map((loan) => (
                <div key={loan.id} className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-zinc-100">{getLoanTypeLabel(loan.type)}</p>
                    <p className="text-zinc-400">
                      {formatYearMonth(loan.borrowedAtYear, loan.borrowedAtMonth)} 借入
                    </p>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-4">
                    <MiniStat label="残高" value={`${loan.remainingPrincipal.toLocaleString()}円`} />
                    <MiniStat label="月返済" value={`${loan.monthlyPayment.toLocaleString()}円`} />
                    <MiniStat label="残月" value={`${loan.remainingMonths}か月`} />
                    <MiniStat label="利率" value={`${Math.round(loan.interestRate * 100)}%`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className={`mt-4 grid gap-3 ${compact ? "lg:grid-cols-2" : "xl:grid-cols-2"}`}>
        {offers.map((offer) => (
          <LoanOfferCard key={offer.id} offer={offer} onTakeLoan={onTakeLoan} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function LoanOfferCard({
  offer,
  onTakeLoan,
  compact,
}: {
  offer: LoanOffer;
  onTakeLoan: (offerId: string) => void;
  compact: boolean;
}) {
  return (
    <article className={`rounded-md border border-zinc-800 bg-zinc-950/58 p-4 ${offer.available ? "" : "opacity-65"}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-50">{getLoanTypeLabel(offer.type)}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">{offer.description}</p>
        </div>
        <span className={offer.available ? "rounded bg-emerald-400 px-2 py-1 text-xs font-bold text-zinc-950" : "rounded bg-zinc-700 px-2 py-1 text-xs font-bold text-zinc-300"}>
          {offer.available ? "利用可能" : "利用不可"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="金額" value={`${offer.amount.toLocaleString()}円`} />
        <MiniStat label="利率" value={`${Math.round(offer.interestRate * 100)}%`} />
        <MiniStat label="期間" value={offer.totalMonths > 0 ? `${offer.totalMonths}か月` : "返済なし"} />
        <MiniStat label="月返済" value={`${offer.monthlyPayment.toLocaleString()}円`} />
      </div>

      {!compact ? (
        <>
          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-xs font-semibold text-zinc-300">条件</p>
            <ul className="mt-2 grid gap-1 text-xs leading-5 text-zinc-400">
              {offer.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs leading-5 text-amber-200">{offer.riskNote}</p>
        </>
      ) : null}

      <button
        type="button"
        disabled={!offer.available}
        onClick={() => onTakeLoan(offer.id)}
        className={`mt-4 h-10 w-full rounded-md text-sm font-semibold transition ${
          offer.available
            ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
            : "cursor-not-allowed border border-zinc-700 text-zinc-500"
        }`}
      >
        借入する
      </button>
      {!offer.available && offer.disabledReason ? (
        <p className="mt-2 text-xs text-amber-200">理由: {offer.disabledReason}</p>
      ) : null}
    </article>
  );
}

function LoanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-100">{value}</p>
    </div>
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
