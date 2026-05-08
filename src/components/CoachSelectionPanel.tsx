"use client";

import {
  getSelectionPolicyDescription,
  getSelectionPolicyLabel,
} from "@/game/coachSelectionEngine";
import type { CoachSelectionPolicy, GameState } from "@/types/game";

interface CoachSelectionPanelProps {
  gameState: GameState;
  onPolicyChange: (policy: CoachSelectionPolicy) => void;
  onAutoSelectSquad: () => void;
}

const POLICIES: CoachSelectionPolicy[] = [
  "balanced",
  "best_overall",
  "youth_development",
  "condition_first",
  "veteran_stability",
  "rotation",
];

export function CoachSelectionPanel({
  gameState,
  onPolicyChange,
  onAutoSelectSquad,
}: CoachSelectionPanelProps) {
  const policy = gameState.coachSelectionPolicy;
  const coach = gameState.coach;

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">監督への起用委託</p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-50">
            現在の方針: {getSelectionPolicyLabel(policy)}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            {getSelectionPolicyDescription(policy)}
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            試合前自動編成: {gameState.autoCoachSelectionEnabled ? "有効" : "無効"}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto]">
          <label className="grid gap-1 text-xs font-semibold text-zinc-400">
            起用方針
            <select
              value={policy}
              onChange={(event) => onPolicyChange(event.target.value as CoachSelectionPolicy)}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
            >
              {POLICIES.map((item) => (
                <option key={item} value={item}>
                  {getSelectionPolicyLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onAutoSelectSquad}
            className="self-end rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            監督に編成を任せる
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <CoachAbility label="選手選考" value={coach.playerSelection} />
        <CoachAbility label="育成" value={coach.development} />
        <CoachAbility label="士気管理" value={coach.motivation} />
        <CoachAbility label="AI判断" value={coach.aiJudgment} />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {POLICIES.map((item) => {
          const active = item === policy;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPolicyChange(item)}
              className={`rounded-md border p-3 text-left transition ${
                active
                  ? "border-emerald-400 bg-emerald-400/12"
                  : "border-zinc-800 bg-zinc-950/55 hover:border-zinc-600"
              }`}
            >
              <span className={active ? "text-sm font-semibold text-emerald-200" : "text-sm font-semibold text-zinc-100"}>
                {getSelectionPolicyLabel(item)}
              </span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">
                {getSelectionPolicyDescription(item)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CoachAbility({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-50">{value}</p>
    </div>
  );
}
