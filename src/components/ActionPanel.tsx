import {
  canPerformPlayerAction,
  getCurrentMonthPlayerActionLog,
  getPlayerActionDisabledReason,
  MVP_PLAYER_ACTIONS,
} from "@/game/playerActionEngine";
import { EffectDeltaBadge } from "@/components/EffectDeltaBadge";
import { formatDatedRecord } from "@/utils/date";
import type { GameState, PlayerAction, StatEffects, SummaryChange } from "@/types/game";

interface ActionPanelProps {
  gameState: GameState;
  onPerformAction: (action: PlayerAction) => void;
}

export function ActionPanel({ gameState, onPerformAction }: ActionPanelProps) {
  const actionItems = MVP_PLAYER_ACTIONS.map((action): ActionCardItem => {
    const executedLog = getCurrentMonthPlayerActionLog(gameState, action);

    if (executedLog) {
      return { action, status: "done", executedLog };
    }

    if (canPerformPlayerAction(gameState, action)) {
      return { action, status: "available" };
    }

    return {
      action,
      status: "unavailable",
      disabledReason: getPlayerActionDisabledReason(gameState, action) ?? "条件を満たしていません。",
    };
  });

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">社長アクション</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        APを消費してクラブ運営を進めます。同じ行動はMVPでは同月1回までです。
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {actionItems.map((item) => (
          <ActionCard
            key={item.action.id}
            item={item}
            onPerformAction={onPerformAction}
          />
        ))}
      </div>
    </section>
  );
}

interface ActionCardItem {
  action: PlayerAction;
  status: "available" | "unavailable" | "done";
  disabledReason?: string | null;
  executedLog?: ReturnType<typeof getCurrentMonthPlayerActionLog>;
}

function ActionCard({
  item,
  onPerformAction,
}: {
  item: ActionCardItem;
  onPerformAction: (action: PlayerAction) => void;
}) {
  const status = item.status;
  const disabled = status !== "available";

  return (
    <article
      className={`rounded-md border p-3 text-left text-sm transition ${
        status === "available"
          ? "border-emerald-400/50 bg-emerald-950/10"
          : status === "done"
            ? "border-sky-400/40 bg-sky-950/10"
            : "border-zinc-800 bg-zinc-950/40 opacity-65"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-semibold text-zinc-100">{item.action.name}</span>
        <StatusLabel status={status} />
      </span>
      <span className="mt-1 block leading-5 text-zinc-400">{item.action.description}</span>
      <span className="mt-3 flex flex-wrap gap-2">
        <EffectDeltaBadge
          label="AP"
          value={`-${item.action.actionPointCost}`}
          direction="down"
          tone="negative"
        />
        {toEffectBadges(item.action.effectsPreview).map((effect) => (
          <EffectDeltaBadge
            key={effect.label}
            label={effect.label}
            value={effect.value}
            direction={effect.direction}
            tone={effect.tone}
          />
        ))}
      </span>
      {item.disabledReason ? (
        <span className="mt-2 block text-xs text-amber-300">理由: {item.disabledReason}</span>
      ) : null}
      {item.executedLog ? (
        <span className="mt-2 block text-xs leading-5 text-sky-200">
          ✓ {formatDatedRecord(item.executedLog)} 実行済み: {item.executedLog.result}
        </span>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onPerformAction(item.action)}
        className="mt-3 h-9 w-full rounded-md bg-emerald-400 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
      >
        {status === "available" ? "実行する" : status === "done" ? "実行済み" : "実行不可"}
      </button>
    </article>
  );
}

function StatusLabel({ status }: { status: "available" | "unavailable" | "done" }) {
  const labels = {
    available: "実行可能",
    unavailable: "実行不可",
    done: "今月実行済み",
  };
  const classes = {
    available: "bg-emerald-400/15 text-emerald-200",
    unavailable: "bg-zinc-700/60 text-zinc-300",
    done: "bg-sky-400/15 text-sky-200",
  };

  return (
    <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}

function toEffectBadges(effects: StatEffects): {
  label: string;
  value: string;
  direction: SummaryChange["direction"];
  tone: SummaryChange["tone"];
}[] {
  const entries = Object.entries(effects).filter(([, value]) => value !== undefined && value !== 0);

  if (entries.length === 0) {
    return [
      {
        label: "効果",
        value: "変化なし",
        direction: "neutral",
        tone: "neutral",
      },
    ];
  }

  return entries.map(([key, value]) => {
    const statKey = key as keyof StatEffects;
    const numericValue = Number(value);

    return {
      label: getEffectLabel(statKey),
      value: formatEffectValue(statKey, numericValue),
      direction: numericValue > 0 ? "up" : numericValue < 0 ? "down" : "neutral",
      tone: getEffectTone(statKey, numericValue),
    };
  });
}

function formatEffectValue(key: keyof StatEffects, value: number): string {
  const prefix = value > 0 ? "+" : "";

  if (key === "money") {
    return `${prefix}${value.toLocaleString()}円`;
  }

  return `${prefix}${value}`;
}

function getEffectTone(key: keyof StatEffects, value: number): SummaryChange["tone"] {
  if (value === 0) {
    return "neutral";
  }

  const negativeWhenUp: (keyof StatEffects)[] = [
    "staffDissatisfaction",
  ];
  const positiveWhenUp = !negativeWhenUp.includes(key);
  const isPositive = value > 0 ? positiveWhenUp : !positiveWhenUp;

  return isPositive ? "positive" : "negative";
}

function getEffectLabel(key: keyof StatEffects): string {
  const labels: Record<keyof StatEffects, string> = {
    money: "資金",
    fans: "ファン",
    reputation: "評判",
    teamPower: "チーム戦力",
    teamwork: "連携",
    condition: "コンディション",
    actionPoints: "AP",
    clubLevel: "クラブLv",
    stadiumCapacity: "収容人数",
    goodsPower: "グッズ力",
    sponsorPower: "スポンサー力",
    coachExperience: "監督経験値",
    coachLevel: "監督Lv",
    coachDevelopment: "監督育成",
    staffDissatisfaction: "不満",
    staffLoyalty: "忠誠",
  };

  return labels[key];
}
