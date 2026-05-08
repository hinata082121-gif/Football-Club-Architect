"use client";

import { useMemo, useState } from "react";
import {
  canPlayTrainingMatch,
  getTrainingMatchPreview,
} from "@/game/trainingMatchEngine";
import { getTrainingMatchOpponents } from "@/game/opponentEngine";
import type { GameState, OpponentClub, StatEffects, TrainingMatchType } from "@/types/game";

interface TrainingMatchPanelProps {
  gameState: GameState;
  onPlayTrainingMatch: (type: TrainingMatchType, opponent?: OpponentClub) => void;
}

const TRAINING_MATCH_TYPES: TrainingMatchType[] = ["weaker", "equal", "stronger", "local", "youth"];

export function TrainingMatchPanel({ gameState, onPlayTrainingMatch }: TrainingMatchPanelProps) {
  const disabled = !canPlayTrainingMatch(gameState);
  const [selectedType, setSelectedType] = useState<TrainingMatchType>("equal");
  const opponents = useMemo(
    () => getTrainingMatchOpponents(gameState, selectedType),
    [gameState, selectedType],
  );
  const preview = getTrainingMatchPreview(gameState, selectedType);

  return (
    <section className="min-w-0 max-w-full rounded-md border border-zinc-800 bg-zinc-900/88 p-4 backdrop-blur sm:p-5">
      <h2 className="text-lg font-semibold">練習試合</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        公式戦がない月でも育成、調整、地域交流を進められます。同月に1回までです。
      </p>
      <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
        {TRAINING_MATCH_TYPES.map((type) => {
          const typePreview = getTrainingMatchPreview(gameState, type);
          const selected = selectedType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`min-w-44 rounded-md border p-3 text-left text-sm transition ${
                selected
                  ? "border-emerald-300 bg-emerald-400/10"
                  : "border-zinc-700 hover:border-emerald-300"
              }`}
            >
              <span className="block font-semibold text-zinc-100">{typePreview.purpose}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">
                難易度 {typePreview.difficulty} / 体力 -{typePreview.conditionCost}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-500">
        期待効果: {formatEffects(preview.expectedRewards)}
      </div>

      <div className="mt-4 grid items-stretch gap-3">
        {opponents.map((opponent) => (
          <button
            key={opponent.id}
            type="button"
            disabled={disabled}
            onClick={() => onPlayTrainingMatch(selectedType, opponent)}
            className="flex h-full min-w-0 flex-col rounded-md border border-zinc-700 bg-zinc-950/40 p-3 text-left text-sm transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="min-w-0">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <span className="block break-words font-semibold text-zinc-100">{opponent.clubName}</span>
                  <span className="mt-1 block text-xs text-zinc-400">社長: {opponent.ownerName}</span>
                </div>
                <span className="w-fit rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                  {formatPlayStyle(opponent.playStyle)}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 md:grid-cols-4">
                <Stat label="クラブLv" value={opponent.clubLevel} />
                <Stat label="戦力" value={opponent.teamPower} />
                <Stat label="連携" value={opponent.teamwork} />
                <Stat label="ファン" value={opponent.fans.toLocaleString()} />
              </dl>
            </div>
            <span className="mt-auto block pt-4">
              <span className="block h-9 w-full rounded-md bg-emerald-400 px-3 py-2 text-center text-xs font-semibold text-zinc-950">
                {disabled ? "今月は実行不可" : "練習試合を行う"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="mt-1 font-medium text-zinc-100">{value}</dd>
    </div>
  );
}

function formatPlayStyle(style: string): string {
  const labels: Record<string, string> = {
    balanced: "バランス型",
    attacking: "攻撃型",
    defensive: "守備型",
    youth: "育成型",
    commercial: "商業型",
    data_driven: "データ型",
  };

  return labels[style] ?? style;
}

function formatEffects(effects: StatEffects): string {
  return Object.entries(effects)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => `${key} ${Number(value) > 0 ? "+" : ""}${value}`)
    .join(" / ");
}
