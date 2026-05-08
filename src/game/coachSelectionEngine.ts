import { COACH_SELECTION_BALANCE } from "@/game/balance";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import { randomFloat } from "@/utils/random";
import type {
  ActionLog,
  CoachSelectionPolicy,
  GameState,
  Player,
  PlayerPosition,
  PlayerStatus,
} from "@/types/game";

const POLICY_LABELS: Record<CoachSelectionPolicy, string> = {
  best_overall: "総合力重視",
  youth_development: "若手育成",
  condition_first: "コンディション優先",
  balanced: "バランス型",
  veteran_stability: "ベテラン安定",
  rotation: "ローテーション",
};

const POLICY_DESCRIPTIONS: Record<CoachSelectionPolicy, string> = {
  best_overall: "総合能力の高い選手を優先し、短期的な勝利を狙います。",
  youth_development: "将来性、成長性、若さを重視し、短期戦力より育成機会を優先します。",
  condition_first: "コンディションを重視し、疲労した選手を外しやすくします。",
  balanced: "総合能力、将来性、コンディション、士気をバランスよく見ます。",
  veteran_stability: "経験のある選手と士気の高い選手を重視し、安定した試合運びを狙います。",
  rotation: "控えやリザーブにも機会を与え、疲労分散と経験蓄積を狙います。",
};

export function setCoachSelectionPolicy(
  state: GameState,
  policy: CoachSelectionPolicy,
): GameState {
  if (state.coachSelectionPolicy === policy) {
    return state;
  }

  const actionLog: ActionLog = {
    id: `coach-policy-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: "起用方針変更",
    reason: "監督へ任せるスタメン・ベンチ選考の優先順位を調整したため。",
    result: `${getSelectionPolicyLabel(state.coachSelectionPolicy)}から${getSelectionPolicyLabel(policy)}へ変更しました。${getSelectionPolicyDescription(policy)}`,
    effects: {},
  };

  return {
    ...state,
    coachSelectionPolicy: policy,
    actionLogs: [actionLog, ...state.actionLogs],
  };
}

export function autoSelectSquadByCoach(state: GameState): GameState {
  if (state.players.length === 0) {
    return state;
  }

  const previousTeamPower = state.club.teamPower;
  const selectedPlayers = assignPlayerStatuses(
    state.players,
    state,
    state.coachSelectionPolicy,
  );
  const stateBeforeRecalculation: GameState = {
    ...state,
    players: selectedPlayers,
  };
  const recalculatedState = recalculateClubTeamPower(stateBeforeRecalculation);
  const counts = getStatusCounts(selectedPlayers);
  const changedCount = selectedPlayers.filter((player) => {
    const previous = state.players.find((item) => item.id === player.id);
    return previous ? previous.status !== player.status : false;
  }).length;
  const actionLog: ActionLog = {
    id: `coach-auto-selection-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "coach",
    actorName: state.coach.name,
    actionName: "監督による自動編成",
    reason: `${getSelectionPolicyLabel(state.coachSelectionPolicy)}方針に沿って、監督の選手選考力・AI判断・育成力・士気管理を反映して起用状態を整理しました。`,
    result: `スタメン${counts.starting}人、ベンチ${counts.bench}人、控え${counts.reserve}人に調整しました。変更された選手は${changedCount}人です。`,
    effects: {
      teamPower: roundOneDecimal(recalculatedState.club.teamPower - previousTeamPower),
    },
  };

  return {
    ...recalculatedState,
    actionLogs: [actionLog, ...recalculatedState.actionLogs],
  };
}

export function scorePlayerForSelection(
  player: Player,
  state: GameState,
  policy: CoachSelectionPolicy,
): number {
  if (isUnavailable(player)) {
    return Number.NEGATIVE_INFINITY;
  }

  const weights = COACH_SELECTION_BALANCE.policyWeights[policy];
  const coach = state.coach;
  const selectionSkill = getSelectionSkill(state);
  const youthBonus = player.age <= 21 ? weights.youth : 0;
  const veteranBonus = player.age >= 30 ? weights.veteran : 0;
  const developmentBonus =
    policy === "youth_development" && player.age <= 23
      ? ((coach.development - 40) / 100) * player.growth * 0.25
      : 0;
  const motivationBonus =
    player.morale < 55 ? ((coach.motivation - 40) / 100) * 5 : (player.morale - 60) * 0.02;
  const rotationBonus =
    policy === "rotation" && (player.status === "bench" || player.status === "reserve") ? 2.5 : 0;
  const lowConditionPenalty = player.condition < 55 ? (55 - player.condition) * 0.22 : 0;
  const noise = getCoachNoise(selectionSkill);

  return (
    player.overall * weights.overall +
    player.potential * weights.potential +
    player.growth * weights.growth +
    (player.condition - 70) * weights.condition +
    (player.morale - 60) * weights.morale +
    youthBonus +
    veteranBonus +
    developmentBonus +
    motivationBonus +
    rotationBonus -
    lowConditionPenalty +
    noise
  );
}

export function assignPlayerStatuses(
  players: Player[],
  state: GameState,
  policy: CoachSelectionPolicy,
): Player[] {
  const availablePlayers = players.filter((player) => !isUnavailable(player));
  const targetStartingCount = Math.min(
    COACH_SELECTION_BALANCE.startingCount,
    availablePlayers.length,
  );
  const scores = new Map(
    players.map((player) => [player.id, scorePlayerForSelection(player, state, policy)]),
  );
  const selectedStarterIds = new Set<string>();

  for (const position of getPositionOrder()) {
    const targetCount = Math.min(
      COACH_SELECTION_BALANCE.startingCounts[position],
      getAvailableByPosition(availablePlayers, position).length,
    );
    const positionPlayers = getAvailableByPosition(availablePlayers, position)
      .filter((player) => !selectedStarterIds.has(player.id))
      .sort((a, b) => getScore(scores, b) - getScore(scores, a))
      .slice(0, targetCount);

    positionPlayers.forEach((player) => selectedStarterIds.add(player.id));
  }

  getSortedAvailable(availablePlayers, scores)
    .filter((player) => !selectedStarterIds.has(player.id))
    .slice(0, Math.max(0, targetStartingCount - selectedStarterIds.size))
    .forEach((player) => selectedStarterIds.add(player.id));

  const selectedBenchIds = new Set(
    getSortedAvailable(availablePlayers, scores)
      .filter((player) => !selectedStarterIds.has(player.id))
      .slice(0, COACH_SELECTION_BALANCE.benchCount)
      .map((player) => player.id),
  );

  return players.map((player) => {
    if (isUnavailable(player)) {
      return player;
    }

    if (selectedStarterIds.has(player.id)) {
      return { ...player, status: "starting" };
    }

    if (selectedBenchIds.has(player.id)) {
      return { ...player, status: "bench" };
    }

    return { ...player, status: "reserve" };
  });
}

export function getSelectionPolicyLabel(policy: CoachSelectionPolicy): string {
  return POLICY_LABELS[policy];
}

export function getSelectionPolicyDescription(policy: CoachSelectionPolicy): string {
  return POLICY_DESCRIPTIONS[policy];
}

function isUnavailable(player: Player): boolean {
  return (COACH_SELECTION_BALANCE.unavailableStatuses as readonly PlayerStatus[]).includes(
    player.status,
  );
}

function getSelectionSkill(state: GameState): number {
  const coach = state.coach;
  const rawSkill =
    coach.playerSelection * 0.45 +
    coach.aiJudgment * 0.3 +
    coach.development * 0.15 +
    coach.motivation * 0.1;

  return clamp(
    rawSkill,
    COACH_SELECTION_BALANCE.minSelectionSkill,
    COACH_SELECTION_BALANCE.maxSelectionSkill,
  );
}

function getCoachNoise(selectionSkill: number): number {
  const skillRate =
    (selectionSkill - COACH_SELECTION_BALANCE.minSelectionSkill) /
    (COACH_SELECTION_BALANCE.maxSelectionSkill - COACH_SELECTION_BALANCE.minSelectionSkill);
  const noiseRange =
    COACH_SELECTION_BALANCE.lowSkillNoise -
    (COACH_SELECTION_BALANCE.lowSkillNoise - COACH_SELECTION_BALANCE.highSkillNoise) *
      clamp(skillRate, 0, 1);

  return randomFloat(-noiseRange, noiseRange);
}

function getAvailableByPosition(players: Player[], position: PlayerPosition): Player[] {
  return players.filter((player) => player.position === position);
}

function getSortedAvailable(players: Player[], scores: Map<string, number>): Player[] {
  return [...players].sort((a, b) => getScore(scores, b) - getScore(scores, a));
}

function getScore(scores: Map<string, number>, player: Player): number {
  return scores.get(player.id) ?? Number.NEGATIVE_INFINITY;
}

function getPositionOrder(): PlayerPosition[] {
  return ["GK", "DF", "MF", "FW"];
}

function getStatusCounts(players: Player[]): Record<"starting" | "bench" | "reserve", number> {
  return players.reduce(
    (counts, player) => {
      if (player.status === "starting" || player.status === "bench" || player.status === "reserve") {
        counts[player.status] += 1;
      }

      return counts;
    },
    { starting: 0, bench: 0, reserve: 0 },
  );
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
