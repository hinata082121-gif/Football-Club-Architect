import { formatDatedRecord } from "@/utils/date";
import type { EventChoice, GameState, RandomEvent, RandomEventCategory, StatEffects } from "@/types/game";

interface EventPanelProps {
  events: RandomEvent[];
  gameState: GameState;
  onResolve: (eventId: string, choiceId: string) => void;
}

export function EventPanel({ events, gameState, onResolve }: EventPanelProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">未解決イベント</h2>
          <p className="mt-1 text-sm text-zinc-400">
            選択すると結果は行動ログに記録されます。トラブルも対処可能な判断材料です。
          </p>
        </div>
        <p className="text-xs text-zinc-500">{events.length}件 pending</p>
      </div>

      <div className="mt-4 grid gap-4">
        {events.map((event) => (
          <article
            key={event.id}
            className={`rounded-md border p-4 ${getEventCardClass(event.category)}`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${getEventLabelClass(event.category)}`}>
                  {event.category}
                </span>
                <span className="ml-2 text-xs text-zinc-500">{formatDatedRecord(event)}</span>
              </div>
              <span className="text-xs text-zinc-500">{event.type}</span>
            </div>

            <h3 className="mt-3 text-base font-semibold text-zinc-100">{event.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{event.description}</p>
            {event.category === "trouble" ? (
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                対処方法を選べます。安全策、リスクを取る選択、支出での解決を比較してください。
              </p>
            ) : null}

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {event.choices.map((choice) => {
                const disabledReason = getChoiceDisabledReason(gameState, choice);
                const selected = event.selectedChoiceId === choice.id;
                const disabled = event.status !== "pending" || disabledReason !== null;

                return (
                  <ChoiceButton
                    key={choice.id}
                    choice={choice}
                    disabled={disabled}
                    disabledReason={disabledReason}
                    selected={selected}
                    onClick={() => onResolve(event.id, choice.id)}
                  />
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ChoiceButton({
  choice,
  disabled,
  disabledReason,
  selected,
  onClick,
}: {
  choice: EventChoice;
  disabled: boolean;
  disabledReason: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  const moneyCost = Math.abs(Math.min(0, choice.effects.money ?? choice.cost ?? 0));

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border p-3 text-left text-sm transition ${
        selected
          ? "border-sky-300 bg-sky-950/20"
          : disabled
            ? "cursor-not-allowed border-zinc-800 bg-zinc-950/40 opacity-60"
            : "border-emerald-400/40 bg-zinc-950/70 hover:border-emerald-300"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-medium text-zinc-100">{choice.label}</span>
        <span className={`rounded px-2 py-1 text-xs font-semibold ${disabled ? "bg-zinc-700/60 text-zinc-300" : "bg-emerald-400/15 text-emerald-200"}`}>
          {selected ? "選択済み" : disabled ? "選択不可" : "選択可能"}
        </span>
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-400">{choice.description}</span>
      <span className="mt-2 block text-xs text-zinc-500">必要条件: {moneyCost > 0 ? `資金 ${moneyCost.toLocaleString()}円以上` : "なし"}</span>
      <span className="mt-1 block text-xs text-zinc-500">費用: {moneyCost.toLocaleString()}円</span>
      <span className="mt-1 block text-xs text-zinc-500">主な効果: {choice.effectPreview ?? summarizeEffects(choice.effects)}</span>
      {disabledReason ? (
        <span className="mt-2 block text-xs text-amber-300">理由: {disabledReason}</span>
      ) : null}
    </button>
  );
}

function getChoiceDisabledReason(state: GameState, choice: EventChoice): string | null {
  const moneyChange = choice.effects.money ?? 0;

  if (moneyChange < 0 && state.club.money + moneyChange < 0) {
    return "資金が不足しています。";
  }

  return choice.disabledReason ?? null;
}

function summarizeEffects(effects: StatEffects): string {
  const summaries: string[] = [];

  if ((effects.money ?? 0) > 0) summaries.push("資金増");
  if ((effects.money ?? 0) < 0) summaries.push("資金を使う");
  if ((effects.fans ?? 0) > 0) summaries.push("ファン増");
  if ((effects.reputation ?? 0) > 0) summaries.push("評判増");
  if ((effects.teamPower ?? 0) > 0) summaries.push("戦力成長");
  if ((effects.teamwork ?? 0) > 0) summaries.push("連携改善");
  if ((effects.teamwork ?? 0) < 0) summaries.push("連携リスク");
  if ((effects.condition ?? 0) > 0) summaries.push("コンディション回復");
  if ((effects.condition ?? 0) < 0) summaries.push("コンディション低下");
  if ((effects.sponsorPower ?? 0) > 0) summaries.push("スポンサー力増");
  if ((effects.coachExperience ?? 0) > 0 || (effects.coachDevelopment ?? 0) > 0) {
    summaries.push("監督成長");
  }
  if ((effects.staffDissatisfaction ?? 0) < 0) summaries.push("不満低下");
  if ((effects.staffDissatisfaction ?? 0) > 0) summaries.push("不満上昇");
  if ((effects.staffLoyalty ?? 0) > 0) summaries.push("忠誠上昇");

  return summaries.length > 0 ? summaries.join(" / ") : "安全に様子を見る";
}

function getEventCardClass(category: RandomEventCategory): string {
  const classes: Record<RandomEventCategory, string> = {
    chance: "border-emerald-500/30 bg-emerald-950/10",
    decision: "border-sky-500/30 bg-sky-950/10",
    trouble: "border-amber-500/30 bg-amber-950/10",
  };

  return classes[category];
}

function getEventLabelClass(category: RandomEventCategory): string {
  const classes: Record<RandomEventCategory, string> = {
    chance: "bg-emerald-400/10 text-emerald-300",
    decision: "bg-sky-400/10 text-sky-300",
    trouble: "bg-amber-400/10 text-amber-300",
  };

  return classes[category];
}
