import {
  canPerformPlayerAction,
  getCurrentMonthPlayerActionLog,
  getPlayerActionDisabledReason,
  MVP_PLAYER_ACTIONS,
} from "@/game/playerActionEngine";
import { formatDatedRecord } from "@/utils/date";
import type { GameState, PlayerAction, StatEffects } from "@/types/game";

interface ActionPanelProps {
  gameState: GameState;
  onPerformAction: (action: PlayerAction) => void;
}

export function ActionPanel({ gameState, onPerformAction }: ActionPanelProps) {
  const groupedActions = MVP_PLAYER_ACTIONS.reduce(
    (groups, action) => {
      const executedLog = getCurrentMonthPlayerActionLog(gameState, action);

      if (executedLog) {
        groups.done.push({ action, executedLog });
        return groups;
      }

      if (canPerformPlayerAction(gameState, action)) {
        groups.available.push({ action, disabledReason: null });
        return groups;
      }

      groups.unavailable.push({
        action,
        disabledReason: getPlayerActionDisabledReason(gameState, action) ?? "条件を満たしていません。",
      });
      return groups;
    },
    {
      available: [] as ActionCardItem[],
      unavailable: [] as ActionCardItem[],
      done: [] as ActionCardItem[],
    },
  );

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">社長アクション</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        APを消費してクラブ運営を進めます。同じ行動はMVPでは同月1回までです。
      </p>

      <ActionGroup
        title="今月実行可能"
        emptyText="今月実行できる社長行動はありません。翌月へ進むか、条件を整えてください。"
        items={groupedActions.available}
        status="available"
        onPerformAction={onPerformAction}
      />
      <ActionGroup
        title="今月実行済み"
        emptyText="まだ今月実行した社長行動はありません。"
        items={groupedActions.done}
        status="done"
        onPerformAction={onPerformAction}
      />
      <ActionGroup
        title="条件不足"
        emptyText="条件不足の社長行動はありません。"
        items={groupedActions.unavailable}
        status="unavailable"
        onPerformAction={onPerformAction}
      />
    </section>
  );
}

interface ActionCardItem {
  action: PlayerAction;
  disabledReason?: string | null;
  executedLog?: ReturnType<typeof getCurrentMonthPlayerActionLog>;
}

function ActionGroup({
  title,
  emptyText,
  items,
  status,
  onPerformAction,
}: {
  title: string;
  emptyText: string;
  items: ActionCardItem[];
  status: "available" | "unavailable" | "done";
  onPerformAction: (action: PlayerAction) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <span className="text-xs text-zinc-500">{items.length}件</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ActionCard
              key={item.action.id}
              item={item}
              status={status}
              onPerformAction={onPerformAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({
  item,
  status,
  onPerformAction,
}: {
  item: ActionCardItem;
  status: "available" | "unavailable" | "done";
  onPerformAction: (action: PlayerAction) => void;
}) {
  const disabled = status !== "available";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPerformAction(item.action)}
      className={`rounded-md border p-3 text-left text-sm transition ${
        status === "available"
          ? "border-emerald-400/50 bg-emerald-950/10 hover:border-emerald-300"
          : status === "done"
            ? "cursor-not-allowed border-sky-400/40 bg-sky-950/10"
            : "cursor-not-allowed border-zinc-800 bg-zinc-950/40 opacity-60"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-semibold text-zinc-100">{item.action.name}</span>
        <StatusLabel status={status} />
      </span>
      <span className="mt-1 block leading-5 text-zinc-400">{item.action.description}</span>
      <span className="mt-2 block text-xs text-zinc-500">
        AP {item.action.actionPointCost} / {formatCost(item.action.effectsPreview)} / 効果:{" "}
        {formatEffects(item.action.effectsPreview)}
      </span>
      {item.disabledReason ? (
        <span className="mt-2 block text-xs text-amber-300">理由: {item.disabledReason}</span>
      ) : null}
      {item.executedLog ? (
        <span className="mt-2 block text-xs leading-5 text-sky-200">
          ✓ {formatDatedRecord(item.executedLog)} 実行済み: {item.executedLog.result}
        </span>
      ) : null}
    </button>
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

function formatCost(effects: StatEffects): string {
  const money = effects.money ?? 0;

  if (money >= 0) {
    return "費用 0円";
  }

  return `費用 ${Math.abs(money).toLocaleString()}円`;
}

function formatEffects(effects: StatEffects): string {
  const entries = Object.entries(effects).filter(([, value]) => value !== undefined && value !== 0);

  if (entries.length === 0) {
    return "数値変化なし";
  }

  return entries
    .filter(([key]) => key !== "money")
    .map(([key, value]) => `${getEffectLabel(key as keyof StatEffects)} ${Number(value) > 0 ? "+" : ""}${value}`)
    .join(" / ");
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
