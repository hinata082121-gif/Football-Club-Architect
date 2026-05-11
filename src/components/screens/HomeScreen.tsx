import { ECONOMY_BALANCE, TURN_BALANCE } from "@/game/balance";
import type { ActiveTab } from "@/components/AppShell";
import { BankruptcyWarningPanel } from "@/components/BankruptcyWarningPanel";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { FinanceWarningPanel } from "@/components/FinanceWarningPanel";
import { MonthlyResultSummaryPanel } from "@/components/MonthlyResultSummaryPanel";
import { getTeamPowerBreakdown } from "@/game/teamPowerEngine";
import { getGameDateLabel } from "@/utils/date";
import type { FinalRecoveryOptionType, GameState } from "@/types/game";

interface HomeScreenProps {
  gameState: GameState;
  onTabChange: (tab: ActiveTab) => void;
  onExecuteFinalRecoveryOption: (option: FinalRecoveryOptionType) => void;
  dismissedMonthlySummaryKey: string | null;
  onDismissMonthlySummary: () => void;
}

export function HomeScreen({
  gameState,
  onTabChange,
  onExecuteFinalRecoveryOption,
  dismissedMonthlySummaryKey,
  onDismissMonthlySummary,
}: HomeScreenProps) {
  const recommendations = getRecommendations(gameState);
  const warnings = getWarnings(gameState);
  const teamPowerBreakdown = getTeamPowerBreakdown(gameState);
  const monthlySummary = gameState.lastMonthlyResultSummary;
  const monthlySummaryKey = monthlySummary
    ? `${monthlySummary.year}-${monthlySummary.month}`
    : null;
  const showMonthlySummary =
    Boolean(monthlySummary) && monthlySummaryKey !== dismissedMonthlySummaryKey;
  const officialEntry = gameState.officialCompetitionEntry;

  return (
    <section className="grid gap-5">
      {showMonthlySummary && monthlySummary ? (
        <MonthlyResultSummaryPanel
          summary={monthlySummary}
          onDismiss={onDismissMonthlySummary}
        />
      ) : null}

      <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-emerald-300">{getGameDateLabel(gameState)}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">クラブ概要</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {gameState.club.policy}方針で、地域から支持を広げるクラブを運営しています。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("actions")}
            className="h-10 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            行動を選ぶ
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Metric label="資金" value={`${gameState.club.money.toLocaleString()}円`} />
          <Metric label="ファン" value={gameState.club.fans.toLocaleString()} />
          <Metric label="評判" value={gameState.club.reputation.toString()} />
          <Metric label="戦力" value={teamPowerBreakdown.finalTeamPower.toFixed(1)} />
          <Metric label="連携" value={gameState.club.teamwork.toString()} />
          <Metric label="AP" value={`${gameState.club.actionPoints}/${gameState.club.maxActionPoints}`} />
          <Metric label="コンディション" value={gameState.club.condition.toString()} />
          <Metric label="スタッフ" value={`${gameState.staff.length}人`} />
          <Metric label="収容人数" value={gameState.club.stadiumCapacity.toLocaleString()} />
          <Metric label="グッズ力" value={gameState.club.goodsPower.toString()} />
          <Metric label="スポンサー力" value={gameState.club.sponsorPower.toString()} />
          <Metric label="クラブLv" value={gameState.club.clubLevel.toString()} />
        </div>

        {officialEntry?.active ? (
          <div className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-950/20 p-3 text-sm text-emerald-100">
            公式戦参加中: 残り{officialEntry.remainingMonths}か月 /{" "}
            {officialEntry.wins}勝{officialEntry.draws}分{officialEntry.losses}敗 /{" "}
            得点{officialEntry.goalsFor}・失点{officialEntry.goalsAgainst}
          </div>
        ) : null}
      </div>

      {gameState.financialHealth.status !== "healthy" ? (
        <FinanceWarningPanel financialHealth={gameState.financialHealth} compact />
      ) : null}

      <BankruptcyWarningPanel
        gameState={gameState}
        onExecuteFinalRecoveryOption={onExecuteFinalRecoveryOption}
        compact
      />

      <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">チーム戦力内訳</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              所属選手の起用状態、コンディション、連携、監督能力から現在戦力を算出しています。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("squad")}
            className="h-10 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-emerald-300 hover:text-emerald-200"
          >
            編成を見る
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="スタメン戦力" value={teamPowerBreakdown.startingPower.toFixed(1)} />
          <Metric label="控え層" value={formatSigned(teamPowerBreakdown.benchDepth)} />
          <Metric label="コンディション補正" value={formatSigned(teamPowerBreakdown.conditionModifier)} />
          <Metric label="連携補正" value={formatSigned(teamPowerBreakdown.teamworkModifier)} />
          <Metric label="監督補正" value={formatSigned(teamPowerBreakdown.coachModifier)} />
          <Metric label="最終戦力" value={teamPowerBreakdown.finalTeamPower.toFixed(1)} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h3 className="text-lg font-semibold">次におすすめの行動</h3>
          <div className="mt-4 grid gap-3">
            {recommendations.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => onTabChange(item.tab)}
                className="rounded-md border border-zinc-700 bg-zinc-950/50 p-3 text-left transition hover:border-emerald-300"
              >
                <span className="block text-sm font-semibold text-zinc-100">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-zinc-400">{item.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h3 className="text-lg font-semibold">注意状態</h3>
          {warnings.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              重大な警告はありません。APを使い切ってから翌月へ進むと効率的です。
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {warnings.map((warning) => (
                <li
                  key={warning}
                  className="rounded-md border border-amber-400/30 bg-amber-950/20 p-3 text-sm text-amber-100"
                >
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AdSenseAd
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER}
        format="horizontal"
        className="mt-2"
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/58 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function getRecommendations(gameState: GameState): { title: string; description: string; tab: ActiveTab }[] {
  if (gameState.events.some((event) => event.status === "pending")) {
    return [
      {
        title: "イベントを確認",
        description: "未解決イベントがあります。選択肢を選ぶと経営判断としてログに残ります。",
        tab: "events",
      },
    ];
  }

  if (gameState.club.condition <= TURN_BALANCE.lowConditionWarning) {
    return [
      {
        title: "コンディションを回復",
        description: "休養指示や練習試合の見送りを検討してください。",
        tab: "actions",
      },
    ];
  }

  if (gameState.club.money <= ECONOMY_BALANCE.minimumCashWarning) {
    return [
      {
        title: "資金繰りを改善",
        description: "スポンサー営業や公式戦報酬で運転資金を確保しましょう。",
        tab: "actions",
      },
    ];
  }

  if (gameState.staff.length === 0) {
    return [
      {
        title: "スタッフ雇用",
        description: "業務が増える前にスタッフAIへ委任できる体制を作れます。",
        tab: "actions",
      },
    ];
  }

  return [
    {
      title: "公式戦または練習試合",
      description: "試合経験でチーム連携、監督経験値、ファン獲得を狙えます。",
      tab: "matches",
    },
    {
      title: "委任レベル確認",
      description: "スタッフの能力に合わせてAIの自動実行範囲を調整できます。",
      tab: "staff",
    },
  ];
}

function getWarnings(gameState: GameState): string[] {
  const warnings: string[] = [];

  if (gameState.club.money <= ECONOMY_BALANCE.minimumCashWarning) {
    warnings.push("資金が少なくなっています。給与や参加費の支払いに注意してください。");
  }
  if (gameState.financialHealth.status !== "healthy") {
    warnings.push(...gameState.financialHealth.warnings);
  }
  if (gameState.club.condition <= TURN_BALANCE.lowConditionWarning) {
    warnings.push("コンディションが低下しています。試合前に休養や施設管理を検討してください。");
  }
  if (gameState.staff.some((member) => member.dissatisfaction >= TURN_BALANCE.highDissatisfactionWarning)) {
    warnings.push("不満が高いスタッフがいます。委任レベルやイベント対応を確認してください。");
  }

  return warnings;
}
