import { getCurrentMonthSummary } from "@/game/currentMonthSummaryEngine";
import { formatDatedRecord } from "@/utils/date";
import type { GameState, Match, StatEffects } from "@/types/game";

interface CurrentMonthSummaryPanelProps {
  gameState: GameState;
  limit?: number;
}

export function CurrentMonthSummaryPanel({
  gameState,
  limit = 8,
}: CurrentMonthSummaryPanelProps) {
  const summary = getCurrentMonthSummary(gameState);
  const items = [
    ...summary.actions.map((log) => ({ id: log.id, label: log.actionName, detail: log.result, effects: log.effects })),
    ...summary.eventLogs.map((log) => ({ id: log.id, label: log.actionName, detail: log.result, effects: log.effects })),
    ...summary.matches.map((match) => ({
      id: match.id,
      label: getMatchLabel(match),
      detail: match.report.summary,
      effects: match.postMatchEffects ?? {},
    })),
  ].slice(0, limit);

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">今月の選択</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {gameState.currentYear}年{gameState.currentMonth}月に実行した行動と試合を表示します。
          </p>
        </div>
        <span className="text-xs text-zinc-500">詳細はログ画面で確認できます</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-400">
          まだ今月の選択はありません。
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-zinc-100">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{item.detail}</p>
                </div>
                <p className="text-xs text-zinc-500">{formatEffects(item.effects)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getMatchLabel(match: Match): string {
  const typeLabel = match.type === "training" ? "練習試合" : match.type === "cup" ? "カップ戦" : "公式戦";

  return `${typeLabel}: ${formatDatedRecord(match)} ${match.opponentName}戦`;
}

function formatEffects(effects: StatEffects): string {
  const entries = Object.entries(effects).filter(([, value]) => value !== undefined && value !== 0);

  if (entries.length === 0) {
    return "変化なし";
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${getEffectLabel(key as keyof StatEffects)} ${Number(value) > 0 ? "+" : ""}${value}`)
    .join(" / ");
}

function getEffectLabel(key: keyof StatEffects): string {
  const labels: Record<keyof StatEffects, string> = {
    money: "資金",
    fans: "ファン",
    reputation: "評判",
    teamPower: "戦力",
    teamwork: "連携",
    condition: "体調",
    actionPoints: "AP",
    clubLevel: "クラブLv",
    stadiumCapacity: "収容人数",
    goodsPower: "グッズ",
    sponsorPower: "スポンサー",
    coachExperience: "監督経験",
    coachLevel: "監督Lv",
    coachDevelopment: "育成力",
    staffDissatisfaction: "不満",
    staffLoyalty: "忠誠",
  };

  return labels[key];
}
