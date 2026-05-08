import { FINANCE_HEALTH_THRESHOLDS } from "@/game/balance";
import { shouldTriggerBankruptcy } from "@/game/bankruptcyEngine";
import type { FinalRecoveryOptionType, GameState } from "@/types/game";

interface BankruptcyWarningPanelProps {
  gameState: GameState;
  onExecuteFinalRecoveryOption: (option: FinalRecoveryOptionType) => void;
  compact?: boolean;
}

const finalRecoveryOptions: {
  type: FinalRecoveryOptionType;
  title: string;
  description: string;
  risk: string;
}[] = [
  {
    type: "fire_sale_players",
    title: "主力売却",
    description: "市場価値や年俸の高い選手を売却して即時資金を確保します。",
    risk: "戦力、ファン、評判が下がります。",
  },
  {
    type: "reduce_staff",
    title: "スタッフ整理",
    description: "高給スタッフを整理して翌月以降の固定費を下げます。",
    risk: "AI委任能力が落ち、退職費用が発生します。",
  },
  {
    type: "emergency_loan",
    title: "緊急融資",
    description: "利用可能なら緊急融資で破綻回避資金を調達します。",
    risk: "返済負担が重く、将来収支を圧迫します。",
  },
  {
    type: "downsize_club",
    title: "縮小再建",
    description: "クラブ規模を落として、完全終了せずに再建します。",
    risk: "クラブレベル、評判、ファン、選手・スタッフを失います。",
  },
  {
    type: "declare_bankruptcy",
    title: "破産を宣言",
    description: "経営破綻を確定し、ゲームオーバー画面へ移行します。",
    risk: "現在の経営は終了します。",
  },
];

export function BankruptcyWarningPanel({
  gameState,
  onExecuteFinalRecoveryOption,
  compact = false,
}: BankruptcyWarningPanelProps) {
  const isInsolvent = gameState.club.money < FINANCE_HEALTH_THRESHOLDS.insolvencyLine;
  const graceMonths = FINANCE_HEALTH_THRESHOLDS.bankruptcyGraceMonths;
  const remainingGraceMonths = Math.max(0, graceMonths - gameState.monthsInInsolvency);
  const finalRescueAvailable = shouldTriggerBankruptcy(gameState);
  const showFinalRecoveryOptions =
    gameState.bankruptcyState.finalWarningIssued || finalRescueAvailable;

  if (!isInsolvent && !gameState.bankruptcyState.finalWarningIssued) {
    return null;
  }

  return (
    <section className="rounded-md border border-rose-400/45 bg-rose-950/35 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-200">債務超過警告</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">
            {finalRescueAvailable ? "最終救済が必要です" : "再建猶予期間中です"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-100">
            債務超過ラインを下回っています。即終了ではありませんが、猶予期間内に資金を改善してください。
          </p>
        </div>
        <div className="rounded-md border border-rose-300/30 bg-zinc-950/55 px-3 py-2 text-sm text-zinc-200">
          残り猶予 {remainingGraceMonths}か月
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}>
        <Stat label="現在資金" value={`${gameState.club.money.toLocaleString()}円`} />
        <Stat label="債務超過ライン" value={`${FINANCE_HEALTH_THRESHOLDS.insolvencyLine.toLocaleString()}円`} />
        <Stat label="継続月数" value={`${gameState.monthsInInsolvency}か月`} />
        <Stat label="最終警告" value={gameState.bankruptcyState.finalWarningIssued ? "発行済み" : "未発行"} />
      </div>

      {showFinalRecoveryOptions ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-zinc-100">最終救済策</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {finalRecoveryOptions.map((option) => {
              const disabled =
                option.type === "downsize_club" && !gameState.bankruptcyState.canDownsizeRestart;

              return (
                <article key={option.type} className={`rounded-md border border-zinc-800 bg-zinc-950/50 p-3 ${disabled ? "opacity-55" : ""}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-50">{option.title}</h4>
                      <p className="mt-1 text-xs leading-5 text-zinc-300">{option.description}</p>
                      <p className="mt-2 text-xs leading-5 text-amber-200">{option.risk}</p>
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onExecuteFinalRecoveryOption(option.type)}
                      className="h-9 shrink-0 rounded-md bg-rose-300 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                    >
                      実行
                    </button>
                  </div>
                  {disabled ? (
                    <p className="mt-2 text-xs text-zinc-500">縮小再建はこの再建後には再利用できません。</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/45 p-3 text-sm text-zinc-300">
          まだ最終救済段階ではありません。短期リカバリー、融資、支出整理で債務超過からの脱出を狙えます。
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
