import { getScoutFocusLabel } from "@/game/scoutEngine";
import { calculateSigningCost, canSignScoutedPlayer } from "@/game/transferEngine";
import { formatYearMonth } from "@/utils/date";
import type { GameState, ScoutFocus, ScoutedPlayer } from "@/types/game";

interface ScoutPanelProps {
  gameState: GameState;
  scoutFocus: ScoutFocus;
  scoutedPlayers: ScoutedPlayer[];
  onScoutFocusChange: (focus: ScoutFocus) => void;
  onSignScoutedPlayer: (scoutedPlayerId: string) => void;
}

const SCOUT_FOCUS_OPTIONS: { id: ScoutFocus; description: string }[] = [
  { id: "balanced", description: "年齢、能力、コストをバランスよく探索します。" },
  { id: "youth", description: "若く、成長余地のある選手を優先します。" },
  { id: "immediate", description: "すぐ戦力になりやすい選手を探します。" },
  { id: "low_cost", description: "年俸や市場価値が低い候補を探します。" },
  { id: "high_potential", description: "将来性の高い候補を優先します。" },
  { id: "position_specific", description: "不足ポジションを優先して探します。" },
  { id: "local", description: "地元色の強い候補を探します。" },
  { id: "data_driven", description: "能力と将来性のバランスを重視します。" },
];

export function ScoutPanel({
  gameState,
  scoutFocus,
  scoutedPlayers,
  onScoutFocusChange,
  onSignScoutedPlayer,
}: ScoutPanelProps) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">スカウト候補</p>
          <h3 className="mt-2 text-xl font-semibold">発見済み候補と探索方針</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            スカウトAIが発見した候補です。表示値は実能力ではなく、スカウト精度に応じた推定値です。
          </p>
        </div>

        <label className="grid gap-1 text-xs font-semibold text-zinc-400">
          現在のスカウト方針
          <select
            value={scoutFocus}
            onChange={(event) => onScoutFocusChange(event.target.value as ScoutFocus)}
            className="h-10 min-w-60 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
          >
            {SCOUT_FOCUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {getScoutFocusLabel(option.id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm leading-6 text-zinc-400">
        {SCOUT_FOCUS_OPTIONS.find((option) => option.id === scoutFocus)?.description}
      </div>

      {scoutedPlayers.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-zinc-700 bg-zinc-950/40 p-4 text-sm text-zinc-500">
          まだ候補選手は発見されていません。スカウトスタッフを雇用し、委任レベルを上げて翌月へ進めると候補が出る可能性があります。
        </p>
      ) : (
        <div className="mt-4 grid items-stretch gap-3 xl:grid-cols-2">
          {scoutedPlayers.map((scoutedPlayer) => (
            <ScoutedPlayerCard
              key={scoutedPlayer.id}
              gameState={gameState}
              scoutedPlayer={scoutedPlayer}
              onSignScoutedPlayer={onSignScoutedPlayer}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ScoutedPlayerCard({
  gameState,
  scoutedPlayer,
  onSignScoutedPlayer,
}: {
  gameState: GameState;
  scoutedPlayer: ScoutedPlayer;
  onSignScoutedPlayer: (scoutedPlayerId: string) => void;
}) {
  const signingCost = calculateSigningCost(scoutedPlayer);
  const signCheck = canSignScoutedPlayer(gameState, scoutedPlayer.id);

  return (
    <article className="flex h-full min-w-0 flex-col rounded-md border border-zinc-800 bg-zinc-950/62 p-4">
      <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-400 px-2 py-1 text-xs font-bold text-zinc-950">
              {scoutedPlayer.player.position}
            </span>
            <h4 className="break-words text-lg font-semibold text-zinc-50">{scoutedPlayer.player.name}</h4>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {getScoutFocusLabel(scoutedPlayer.focus)} / 発見者: {scoutedPlayer.discoveredByStaffName ?? "クラブ調査"}
          </p>
        </div>

        <span className="rounded bg-sky-400/15 px-2 py-1 text-xs font-semibold text-sky-100">
          信頼度 {scoutedPlayer.confidence}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Estimate label="年齢" value={`${scoutedPlayer.player.age}歳`} />
        <Estimate label="推定総合" value={scoutedPlayer.estimatedOverall.toString()} />
        <Estimate label="推定将来性" value={scoutedPlayer.estimatedPotential.toString()} />
        <Estimate label="推定精度" value={scoutedPlayer.scoutAccuracy.toString()} />
        <Estimate label="推定年俸" value={`${scoutedPlayer.estimatedSalary.toLocaleString()}円`} />
        <Estimate label="推定市場価値" value={`${scoutedPlayer.estimatedMarketValue.toLocaleString()}円`} />
        <Estimate label="獲得費用" value={`${signingCost.toLocaleString()}円`} />
        <Estimate label="発見月" value={formatYearMonth(scoutedPlayer.discoveredAtYear, scoutedPlayer.discoveredAtMonth)} />
        <Estimate label="有効期限" value={formatYearMonth(scoutedPlayer.expiresAtYear, scoutedPlayer.expiresAtMonth)} />
      </div>

      {!signCheck.canSign && signCheck.reason ? (
        <p className="text-xs text-amber-200">{signCheck.reason}</p>
      ) : null}
      </div>
      <div className="mt-auto pt-4">
        <button
          type="button"
          disabled={!signCheck.canSign}
          onClick={() => onSignScoutedPlayer(scoutedPlayer.id)}
          className={`h-10 w-full rounded-md text-sm font-semibold transition ${
            signCheck.canSign
              ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
              : "cursor-not-allowed border border-zinc-700 text-zinc-500"
          }`}
        >
          {signCheck.canSign ? "獲得する" : "獲得不可"}
        </button>
      </div>
    </article>
  );
}

function Estimate({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
