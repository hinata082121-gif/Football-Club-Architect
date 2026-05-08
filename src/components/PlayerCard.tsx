import { canRenewPlayerContract } from "@/game/contractEngine";
import {
  calculateReleaseIncome,
  calculateReleasePenalty,
  canReleasePlayer,
} from "@/game/transferEngine";
import type { GameState, Player, PlayerDevelopmentStage } from "@/types/game";

interface PlayerCardProps {
  player: Player;
  gameState?: GameState;
  onTransferListedChange?: (playerId: string, transferListed: boolean) => void;
  onReleasePlayer?: (playerId: string) => void;
  onRenewPlayerContract?: (playerId: string, months: number) => void;
}

export function PlayerCard({
  player,
  gameState,
  onTransferListedChange,
  onReleasePlayer,
  onRenewPlayerContract,
}: PlayerCardProps) {
  const labels = getPlayerLabels(player);
  const releaseIncome = calculateReleaseIncome(player);
  const releasePenalty = calculateReleasePenalty(player);
  const releaseNet = releaseIncome - releasePenalty;
  const releaseCheck = gameState
    ? canReleasePlayer(gameState, player.id)
    : { canRelease: false, reason: "放出操作はこの一覧では利用できません。" };
  const canUseActions = Boolean(gameState && onTransferListedChange && onReleasePlayer);
  const canUseRenewal = Boolean(gameState && onRenewPlayerContract);
  const retirementRisk = player.retirementRisk ?? 0;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-md border border-zinc-800 bg-zinc-950/62 p-4 backdrop-blur">
      <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-400 px-2 py-1 text-xs font-bold text-zinc-950">
              {player.position}
            </span>
            <h4 className="break-words text-lg font-semibold text-zinc-50">{player.name}</h4>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {getStatusLabel(player.status)} / {player.isHomegrown ? "下部組織出身" : "外部加入"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <span
              key={label.text}
              className={`rounded px-2 py-1 text-xs font-semibold ${label.className}`}
            >
              {label.text}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="年齢" value={`${player.age}歳`} />
        <Stat label="総合能力" value={player.overall.toString()} />
        <Stat label="将来性" value={player.potential.toString()} />
        <Stat label="成長性" value={player.growth.toString()} />
        <Stat label="コンディション" value={player.condition.toString()} />
        <Stat label="士気" value={player.morale.toString()} />
        <Stat label="成長段階" value={getDevelopmentStageLabel(player.developmentStage)} />
        <Stat label="経験値" value={player.experience.toString()} />
        <Stat label="出場数" value={`${player.appearances}試合`} />
        <Stat label="練習試合" value={`${player.trainingMatchAppearances}試合`} />
        <Stat label="誕生日まで" value={`${player.monthsUntilBirthday}か月`} />
        <Stat label="月額年俸" value={`${player.salary.toLocaleString()}円`} />
        <Stat label="契約残り" value={`${player.contractMonths}か月`} />
        <Stat label="引退リスク" value={`${retirementRisk}%`} />
      </div>

      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300">
        市場価値: <span className="font-semibold text-zinc-50">{player.marketValue.toLocaleString()}円</span>
      </div>
      </div>

      {canUseActions ? (
        <div className="mt-auto pt-4">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/55 p-3">
          {canUseRenewal ? (
            <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
              <p className="text-xs font-semibold text-zinc-300">契約更新</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {[12, 24, 36].map((months) => (
                  <RenewalButton
                    key={months}
                    gameState={gameState}
                    player={player}
                    months={months}
                    onRenewPlayerContract={onRenewPlayerContract}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
            <p>
              予想収入: <span className="font-semibold text-emerald-200">{releaseIncome.toLocaleString()}円</span>
            </p>
            <p>
              違約金: <span className="font-semibold text-rose-200">{releasePenalty.toLocaleString()}円</span>
            </p>
            <p>
              差引:{" "}
              <span className={releaseNet >= 0 ? "font-semibold text-emerald-200" : "font-semibold text-rose-200"}>
                {releaseNet.toLocaleString()}円
              </span>
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onTransferListedChange?.(player.id, player.status !== "transfer_listed")}
              className="h-9 w-full rounded-md border border-zinc-700 px-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-300 hover:text-emerald-200"
            >
              {player.status === "transfer_listed" ? "放出候補を解除" : "放出候補にする"}
            </button>
            <button
              type="button"
              disabled={!releaseCheck.canRelease}
              onClick={() => onReleasePlayer?.(player.id)}
              className={`h-9 w-full rounded-md px-3 text-sm font-semibold transition ${
                releaseCheck.canRelease
                  ? "bg-rose-400 text-zinc-950 hover:bg-rose-300"
                  : "cursor-not-allowed border border-zinc-700 text-zinc-500"
              }`}
            >
              放出する
            </button>
          </div>
          {!releaseCheck.canRelease && releaseCheck.reason ? (
            <p className="mt-2 text-xs text-amber-200">{releaseCheck.reason}</p>
          ) : null}
        </div>
        </div>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function RenewalButton({
  gameState,
  player,
  months,
  onRenewPlayerContract,
}: {
  gameState?: GameState;
  player: Player;
  months: number;
  onRenewPlayerContract?: (playerId: string, months: number) => void;
}) {
  const renewalCheck = gameState
    ? canRenewPlayerContract(gameState, player.id, months)
    : { canRenew: false, reason: "契約更新はこの一覧では利用できません。" };

  return (
    <button
      type="button"
      disabled={!renewalCheck.canRenew}
      title={renewalCheck.reason}
      onClick={() => onRenewPlayerContract?.(player.id, months)}
      className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
        renewalCheck.canRenew
          ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
          : "cursor-not-allowed border border-zinc-700 text-zinc-500"
      }`}
    >
      {months}か月
      <span className="mt-1 block font-normal">
        {renewalCheck.cost ? `${renewalCheck.cost.toLocaleString()}円` : renewalCheck.reason}
      </span>
    </button>
  );
}

function getPlayerLabels(player: Player): { text: string; className: string }[] {
  const labels: { text: string; className: string }[] = [];

  if (player.age <= 20) {
    labels.push({ text: "若手", className: "bg-sky-400/20 text-sky-100" });
  }

  if (player.developmentStage === "prospect" || player.developmentStage === "developing") {
    labels.push({ text: "成長期待", className: "bg-emerald-400/20 text-emerald-100" });
  }

  if (player.age >= 30) {
    labels.push({ text: "ベテラン", className: "bg-violet-400/20 text-violet-100" });
  }

  if (player.age >= 34 || player.developmentStage === "declining") {
    labels.push({ text: "衰退注意", className: "bg-amber-400/20 text-amber-100" });
  }

  if (player.developmentStage === "retirement_risk") {
    labels.push({ text: "引退リスク", className: "bg-red-400/20 text-red-100" });
  }

  if (player.potential >= 62) {
    labels.push({ text: "有望株", className: "bg-emerald-400/20 text-emerald-100" });
  }

  if (player.condition <= 70) {
    labels.push({ text: "疲労", className: "bg-rose-400/20 text-rose-100" });
  }

  if (player.contractMonths <= 12) {
    labels.push({ text: "契約注意", className: "bg-orange-400/20 text-orange-100" });
  }

  if (player.status === "transfer_listed") {
    labels.push({ text: "放出候補", className: "bg-zinc-300/20 text-zinc-100" });
  }

  return labels;
}

function getDevelopmentStageLabel(stage: PlayerDevelopmentStage): string {
  const labels: Record<PlayerDevelopmentStage, string> = {
    prospect: "有望若手",
    developing: "成長期",
    prime: "全盛期",
    veteran: "ベテラン",
    declining: "衰退期",
    retirement_risk: "引退リスク",
  };

  return labels[stage];
}

function getStatusLabel(status: Player["status"]): string {
  const labels: Record<Player["status"], string> = {
    starting: "スタメン",
    bench: "ベンチ",
    reserve: "控え",
    injured: "負傷中",
    transfer_listed: "放出候補",
    leaving: "退団予定",
    retired: "引退",
  };

  return labels[status];
}
