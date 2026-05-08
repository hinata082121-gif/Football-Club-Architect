import { getTeamCompositionSummary } from "@/game/playerSummaryEngine";
import { getTeamPowerBreakdown } from "@/game/teamPowerEngine";
import type { GameState, PlayerDevelopmentStage } from "@/types/game";

interface SquadSummaryProps {
  gameState: GameState;
}

export function SquadSummary({ gameState }: SquadSummaryProps) {
  const players = gameState.players;
  const summary = getTeamCompositionSummary(players);
  const powerBreakdown = getTeamPowerBreakdown(gameState);
  const prospectCount = countStage(players, ["prospect", "developing"]);
  const primeCount = countStage(players, ["prime"]);
  const veteranCount = countStage(players, ["veteran"]);
  const declineRiskCount = countStage(players, ["declining", "retirement_risk"]);
  const generationRisk =
    players.length > 0 ? Math.round((declineRiskCount / players.length) * 100) : 0;

  return (
    <section className="grid gap-4">
      <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">チーム概要</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">所属選手と編成状況</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              選手層、年齢構成、年俸負担を確認します。起用変更や契約更新は今後のPhaseで追加予定です。
            </p>
          </div>
          <div className="rounded-md border border-emerald-400/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100">
            登録選手 {summary.totalPlayers}人
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="平均年齢" value={`${summary.averageAge.toFixed(1)}歳`} />
          <Metric label="平均能力" value={summary.averageOverall.toFixed(1)} />
          <Metric label="平均将来性" value={summary.averagePotential.toFixed(1)} />
          <Metric label="チーム戦力" value={powerBreakdown.finalTeamPower.toFixed(1)} />
          <Metric label="月間年俸総額" value={`${summary.totalSalary.toLocaleString()}円`} />
          <Metric label="スタメン平均能力" value={summary.startingAverageOverall.toFixed(1)} />
          <Metric label="ベンチ平均能力" value={summary.benchAverageOverall.toFixed(1)} />
          <Metric label="控え平均能力" value={summary.reserveAverageOverall.toFixed(1)} />
          <Metric label="契約注意" value={`${players.filter((player) => player.contractMonths <= 12).length}人`} />
          <Metric label="若手・成長期" value={`${prospectCount}人`} />
          <Metric label="全盛期" value={`${primeCount}人`} />
          <Metric label="ベテラン" value={`${veteranCount}人`} />
          <Metric label="世代交代リスク" value={`${generationRisk}%`} />
        </div>
        {declineRiskCount >= 4 ? (
          <p className="mt-4 rounded-md border border-amber-400/30 bg-amber-950/25 p-3 text-sm leading-6 text-amber-100">
            衰退期・引退リスクの選手が増えています。スカウト候補や若手育成で世代交代を進める余地があります。
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h3 className="text-lg font-semibold">チーム戦力内訳</h3>
          <div className="mt-4 grid gap-2">
            <PowerLine label="スタメン平均" value={powerBreakdown.startingPower} />
            <PowerLine label="控え層補正" value={powerBreakdown.benchDepth} signed />
            <PowerLine label="コンディション補正" value={powerBreakdown.conditionModifier} signed />
            <PowerLine label="連携補正" value={powerBreakdown.teamworkModifier} signed />
            <PowerLine label="監督補正" value={powerBreakdown.coachModifier} signed />
            <PowerLine label="最終戦力" value={powerBreakdown.finalTeamPower} strong />
          </div>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h3 className="text-lg font-semibold">ポジション別人数</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PositionCount label="GK" value={summary.positionCounts.GK} />
            <PositionCount label="DF" value={summary.positionCounts.DF} />
            <PositionCount label="MF" value={summary.positionCounts.MF} />
            <PositionCount label="FW" value={summary.positionCounts.FW} />
          </div>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur lg:col-span-2">
          <h3 className="text-lg font-semibold">年齢構成</h3>
          <div className="mt-4 grid gap-2">
            <AgeBand label="若手 17-20歳" value={countAgeRange(players, 17, 20)} />
            <AgeBand label="成長期 21-24歳" value={countAgeRange(players, 21, 24)} />
            <AgeBand label="全盛期 25-29歳" value={countAgeRange(players, 25, 29)} />
            <AgeBand label="ベテラン 30-33歳" value={countAgeRange(players, 30, 33)} />
            <AgeBand label="衰退注意 34歳以上" value={players.filter((player) => player.age >= 34).length} />
            <AgeBand label="引退リスク 37歳以上" value={countStage(players, ["retirement_risk"])} />
          </div>
        </div>
      </div>
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

function PositionCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/58 p-4 text-center">
      <p className="text-xs font-semibold text-emerald-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function AgeBand({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <span className="text-sm font-semibold text-zinc-50">{value}人</span>
    </div>
  );
}

function PowerLine({
  label,
  value,
  signed = false,
  strong = false,
}: {
  label: string;
  value: number;
  signed?: boolean;
  strong?: boolean;
}) {
  const formatted = signed ? formatSigned(value) : value.toFixed(1);

  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      <span className={strong ? "text-base font-bold text-emerald-200" : "text-sm font-semibold text-zinc-50"}>
        {formatted}
      </span>
    </div>
  );
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function countAgeRange(players: GameState["players"], min: number, max: number): number {
  return players.filter((player) => player.age >= min && player.age <= max).length;
}

function countStage(
  players: GameState["players"],
  stages: PlayerDevelopmentStage[],
): number {
  return players.filter((player) => stages.includes(player.developmentStage)).length;
}
