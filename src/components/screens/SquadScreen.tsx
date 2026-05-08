"use client";

import { useMemo, useState } from "react";
import { CoachSelectionPanel } from "@/components/CoachSelectionPanel";
import { PlayerList } from "@/components/PlayerList";
import { ScoutPanel } from "@/components/ScoutPanel";
import { SquadSummary } from "@/components/SquadSummary";
import { CONTRACT_BALANCE, TRANSFER_BALANCE } from "@/game/balance";
import { calculateTotalPlayerSalary } from "@/game/contractEngine";
import {
  getPlayersByPosition,
  getPlayersByStatus,
} from "@/game/playerSummaryEngine";
import type {
  CoachSelectionPolicy,
  GameState,
  Player,
  PlayerPosition,
  ScoutFocus,
} from "@/types/game";

interface SquadScreenProps {
  gameState: GameState;
  onScoutFocusChange: (focus: ScoutFocus) => void;
  onSignScoutedPlayer: (scoutedPlayerId: string) => void;
  onTransferListedChange: (playerId: string, transferListed: boolean) => void;
  onReleasePlayer: (playerId: string) => void;
  onCoachSelectionPolicyChange: (policy: CoachSelectionPolicy) => void;
  onAutoSelectSquadByCoach: () => void;
  onRenewPlayerContract: (playerId: string, months: number) => void;
}

type SquadFilter =
  | "all"
  | PlayerPosition
  | "starting"
  | "bench"
  | "reserve"
  | "transfer_listed"
  | "young"
  | "veteran";

type SquadSort = "overall" | "potential" | "age" | "salary" | "contractMonths";

const FILTERS: { id: SquadFilter; label: string }[] = [
  { id: "all", label: "全選手" },
  { id: "GK", label: "GK" },
  { id: "DF", label: "DF" },
  { id: "MF", label: "MF" },
  { id: "FW", label: "FW" },
  { id: "starting", label: "スタメン" },
  { id: "bench", label: "ベンチ" },
  { id: "reserve", label: "控え" },
  { id: "transfer_listed", label: "放出候補" },
  { id: "young", label: "若手" },
  { id: "veteran", label: "ベテラン" },
];

const SORTS: { id: SquadSort; label: string }[] = [
  { id: "overall", label: "総合能力降順" },
  { id: "potential", label: "将来性降順" },
  { id: "age", label: "年齢昇順" },
  { id: "salary", label: "年俸降順" },
  { id: "contractMonths", label: "契約残り昇順" },
];

export function SquadScreen({
  gameState,
  onScoutFocusChange,
  onSignScoutedPlayer,
  onTransferListedChange,
  onReleasePlayer,
  onCoachSelectionPolicyChange,
  onAutoSelectSquadByCoach,
  onRenewPlayerContract,
}: SquadScreenProps) {
  const players = gameState.players;
  const [filter, setFilter] = useState<SquadFilter>("all");
  const [sort, setSort] = useState<SquadSort>("overall");

  const startingPlayers = getPlayersByStatus(players, "starting");
  const benchPlayers = getPlayersByStatus(players, "bench");
  const reservePlayers = getPlayersByStatus(players, "reserve");
  const transferListedPlayers = getPlayersByStatus(players, "transfer_listed");
  const contractAttentionPlayers = players.filter((player) => player.contractMonths <= 3);
  const highSalaryPlayers = [...players]
    .filter(
      (player) =>
        player.status !== "retired" && player.salary >= CONTRACT_BALANCE.highSalaryThreshold,
    )
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 6);
  const retirementRiskPlayers = players.filter(
    (player) => (player.retirementRisk ?? 0) >= 35 || player.announcedRetirement,
  );

  const filteredPlayers = useMemo(
    () => sortPlayers(filterPlayers(players, filter), sort),
    [filter, players, sort],
  );

  if (players.length === 0) {
    return (
      <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-6 backdrop-blur">
        <p className="text-sm font-medium text-emerald-300">チーム編成</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">所属選手がいません</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          初期選手データが空です。初期状態生成または選手生成処理を確認してください。
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <SquadSummary gameState={gameState} />
      <CoachSelectionPanel
        gameState={gameState}
        onPolicyChange={onCoachSelectionPolicyChange}
        onAutoSelectSquad={onAutoSelectSquadByCoach}
      />
      <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-4 backdrop-blur">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <RosterMetric
            label="所属人数 / 上限"
            value={`${players.length}/${TRANSFER_BALANCE.maxPlayers}人`}
          />
          <RosterMetric
            label="最低必要人数"
            value={`${TRANSFER_BALANCE.minPlayers}人`}
          />
          <RosterMetric
            label="スカウト候補"
            value={`${gameState.scoutedPlayers.length}人`}
          />
          <RosterMetric
            label="選手月額年俸"
            value={`${calculateTotalPlayerSalary(players).toLocaleString()}円`}
          />
        </div>
        {players.length >= TRANSFER_BALANCE.maxPlayers - 2 ? (
          <p className="mt-3 rounded-md border border-amber-400/30 bg-amber-950/25 p-3 text-sm text-amber-100">
            所属人数が上限に近づいています。獲得前に放出候補の整理を検討してください。
          </p>
        ) : null}
      </div>
      <ScoutPanel
        gameState={gameState}
        scoutFocus={gameState.scoutFocus}
        scoutedPlayers={gameState.scoutedPlayers}
        onScoutFocusChange={onScoutFocusChange}
        onSignScoutedPlayer={onSignScoutedPlayer}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ContractAlertCard
          title="契約注意"
          players={contractAttentionPlayers}
          emptyMessage="直近3か月以内の契約注意はありません。"
          getDescription={(player) =>
            player.contractMonths === 0
              ? "契約満了。更新判断が必要です。"
              : `残り${player.contractMonths}か月`
          }
        />
        <ContractAlertCard
          title="高年俸選手"
          players={highSalaryPlayers}
          emptyMessage="年俸負担が大きい選手は目立っていません。"
          getDescription={(player) => `${player.salary.toLocaleString()}円/月`}
        />
        <ContractAlertCard
          title="引退リスク"
          players={retirementRiskPlayers}
          emptyMessage="引退リスクが高い選手はいません。"
          getDescription={(player) =>
            player.announcedRetirement
              ? "引退予定を表明"
              : `リスク ${player.retirementRisk ?? 0}%`
          }
        />
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">全選手一覧</p>
            <h3 className="mt-2 text-xl font-semibold">フィルターと並び替え</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              ポジション、起用状態、年齢帯で絞り込み、重要な契約や能力を確認できます。
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-zinc-400">
              フィルター
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as SquadFilter)}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
              >
                {FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-semibold text-zinc-400">
              並び替え
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SquadSort)}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
              >
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <PlayerList
        title={`${getFilterLabel(filter)} / ${getSortLabel(sort)}`}
        players={filteredPlayers}
        emptyMessage="条件に合う選手はいません。"
        gameState={gameState}
        onTransferListedChange={onTransferListedChange}
        onReleasePlayer={onReleasePlayer}
        onRenewPlayerContract={onRenewPlayerContract}
      />

      <PlayerList
        title="スタメン一覧"
        players={startingPlayers}
        gameState={gameState}
        onTransferListedChange={onTransferListedChange}
        onReleasePlayer={onReleasePlayer}
        onRenewPlayerContract={onRenewPlayerContract}
      />
      <PlayerList
        title="ベンチ一覧"
        players={benchPlayers}
        gameState={gameState}
        onTransferListedChange={onTransferListedChange}
        onReleasePlayer={onReleasePlayer}
        onRenewPlayerContract={onRenewPlayerContract}
      />
      <PlayerList
        title="控え・リザーブ一覧"
        players={reservePlayers}
        gameState={gameState}
        onTransferListedChange={onTransferListedChange}
        onReleasePlayer={onReleasePlayer}
        onRenewPlayerContract={onRenewPlayerContract}
      />
      <PlayerList
        title="放出候補一覧"
        players={transferListedPlayers}
        emptyMessage="現在、放出候補に設定されている選手はいません。"
        gameState={gameState}
        onTransferListedChange={onTransferListedChange}
        onReleasePlayer={onReleasePlayer}
        onRenewPlayerContract={onRenewPlayerContract}
      />

      <section className="grid gap-4">
        <h3 className="text-lg font-semibold text-zinc-50">ポジション別表示</h3>
        <div className="mt-4 grid gap-4">
          <PlayerList title="GK" players={getPlayersByPosition(players, "GK")} />
          <PlayerList title="DF" players={getPlayersByPosition(players, "DF")} />
          <PlayerList title="MF" players={getPlayersByPosition(players, "MF")} />
          <PlayerList title="FW" players={getPlayersByPosition(players, "FW")} />
        </div>
      </section>

      <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-950/50 p-4 text-sm leading-6 text-zinc-400">
        TODO: 手動スタメン変更、契約更新、起用方針の試合別プリセットは後続Phaseで実装します。
      </div>
    </section>
  );
}

function RosterMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function ContractAlertCard({
  title,
  players,
  emptyMessage,
  getDescription,
}: {
  title: string;
  players: Player[];
  emptyMessage: string;
  getDescription: (player: Player) => string;
}) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-50">{title}</h3>
        <span className="rounded bg-zinc-950/70 px-2 py-1 text-xs text-zinc-300">
          {players.length}人
        </span>
      </div>
      {players.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {players.slice(0, 5).map((player) => (
            <li key={player.id} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
              <p className="text-sm font-semibold text-zinc-100">{player.name}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {player.position} / {getDescription(player)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function filterPlayers(players: Player[], filter: SquadFilter): Player[] {
  if (filter === "all") {
    return players;
  }

  if (filter === "GK" || filter === "DF" || filter === "MF" || filter === "FW") {
    return getPlayersByPosition(players, filter);
  }

  if (filter === "young") {
    return players.filter((player) => player.age <= 20);
  }

  if (filter === "veteran") {
    return players.filter((player) => player.age >= 30);
  }

  return getPlayersByStatus(players, filter);
}

function sortPlayers(players: Player[], sort: SquadSort): Player[] {
  return [...players].sort((a, b) => {
    if (sort === "age") {
      return a.age - b.age;
    }

    if (sort === "contractMonths") {
      return a.contractMonths - b.contractMonths;
    }

    return b[sort] - a[sort];
  });
}

function getFilterLabel(filter: SquadFilter): string {
  return FILTERS.find((item) => item.id === filter)?.label ?? "全選手";
}

function getSortLabel(sort: SquadSort): string {
  return SORTS.find((item) => item.id === sort)?.label ?? "総合能力降順";
}
