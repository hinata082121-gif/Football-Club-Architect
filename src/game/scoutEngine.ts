import { SCOUT_BALANCE } from "@/game/balance";
import {
  calculateMarketValue,
  calculatePlayerSalary,
  generatePlayer,
} from "@/game/playerGenerator";
import { getPositionCounts } from "@/game/playerSummaryEngine";
import { advanceGameMonth } from "@/utils/date";
import { pick, randomInt } from "@/utils/random";
import type {
  ActionLog,
  GameState,
  Player,
  PlayerPosition,
  ScoutFocus,
  ScoutedPlayer,
  Staff,
} from "@/types/game";

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

export function generateScoutedPlayers(
  state: GameState,
  staff?: Staff,
  focus: ScoutFocus = state.scoutFocus,
  count: number = SCOUT_BALANCE.defaultCount,
): ScoutedPlayer[] {
  return Array.from({ length: count }, () => generateScoutedPlayer(state, staff, focus));
}

export function generateScoutedPlayer(
  state: GameState,
  staff?: Staff,
  focus: ScoutFocus = state.scoutFocus,
): ScoutedPlayer {
  const player = createPlayerForFocus(state, focus);
  const scoutAccuracy = calculateScoutAccuracy(staff);
  const estimate = estimatePlayerByScout(player, scoutAccuracy, staff);
  const expiresAt = addMonths(state.currentYear, state.currentMonth, SCOUT_BALANCE.reportExpiryMonths);

  return {
    id: `scouted-${focus}-${state.club.turn}-${Date.now()}-${randomInt(1000, 9999)}`,
    player,
    discoveredByStaffId: staff?.id,
    discoveredByStaffName: staff?.name,
    scoutAccuracy,
    ...estimate,
    focus,
    discoveredAtYear: state.currentYear,
    discoveredAtMonth: state.currentMonth,
    expiresAtYear: expiresAt.year,
    expiresAtMonth: expiresAt.month,
  };
}

export function calculateScoutAccuracy(staff?: Staff): number {
  if (!staff || staff.role !== "scout") {
    return SCOUT_BALANCE.fallbackAccuracy;
  }

  return clamp(
    Math.round(
      staff.aiAccuracy * 0.46 +
        staff.judgment * 0.34 +
        staff.level * 5 +
        staff.growth * 0.08 -
        staff.dissatisfaction * 0.16,
    ),
    SCOUT_BALANCE.minAccuracy,
    SCOUT_BALANCE.maxAccuracy,
  );
}

export function estimatePlayerByScout(
  player: Player,
  scoutAccuracy: number,
  staff?: Staff,
): Pick<
  ScoutedPlayer,
  "estimatedOverall" | "estimatedPotential" | "estimatedSalary" | "estimatedMarketValue" | "confidence"
> {
  const errorRange = getEstimateErrorRange(scoutAccuracy);
  const estimatedOverall = clampRating(player.overall + randomInt(-errorRange, errorRange));
  const estimatedPotential = clampRating(player.potential + randomInt(-errorRange, errorRange));
  const salaryNoise = 1 + randomPercentNoise(SCOUT_BALANCE.salaryEstimateNoiseRate, scoutAccuracy);
  const marketNoise = 1 + randomPercentNoise(SCOUT_BALANCE.marketValueEstimateNoiseRate, scoutAccuracy);
  const confidence = clamp(
    Math.round(scoutAccuracy + (staff?.level ?? 0) * SCOUT_BALANCE.levelConfidenceBonus + randomInt(-8, 8)),
    SCOUT_BALANCE.minConfidence,
    SCOUT_BALANCE.maxConfidence,
  );

  return {
    estimatedOverall,
    estimatedPotential,
    estimatedSalary: roundTo(player.salary * salaryNoise, 1_000),
    estimatedMarketValue: roundTo(player.marketValue * marketNoise, 10_000),
    confidence,
  };
}

export function addScoutedPlayers(state: GameState, scoutedPlayers: ScoutedPlayer[]): GameState {
  const activeReports = [...scoutedPlayers, ...state.scoutedPlayers].slice(
    0,
    SCOUT_BALANCE.maxActiveReports,
  );

  return {
    ...state,
    scoutedPlayers: activeReports,
  };
}

export function removeExpiredScoutedPlayers(state: GameState): GameState {
  const activeReports = state.scoutedPlayers.filter(
    (scoutedPlayer) =>
      compareYearMonth(
        scoutedPlayer.expiresAtYear,
        scoutedPlayer.expiresAtMonth,
        state.currentYear,
        state.currentMonth,
      ) >= 0,
  );

  if (activeReports.length === state.scoutedPlayers.length) {
    return state;
  }

  return {
    ...state,
    scoutedPlayers: activeReports,
  };
}

export function setScoutFocus(state: GameState, focus: ScoutFocus): GameState {
  if (state.scoutFocus === focus) {
    return state;
  }

  const actionLog: ActionLog = {
    id: `scout-focus-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: "スカウト方針変更",
    reason: "補強候補の探索方針をクラブ状況に合わせるため。",
    result: `スカウト方針を${getScoutFocusLabel(state.scoutFocus)}から${getScoutFocusLabel(focus)}へ変更しました。`,
    effects: {},
  };

  return {
    ...state,
    scoutFocus: focus,
    actionLogs: [actionLog, ...state.actionLogs],
  };
}

export function getScoutFocusLabel(focus: ScoutFocus): string {
  const labels: Record<ScoutFocus, string> = {
    youth: "若手重視",
    immediate: "即戦力重視",
    low_cost: "低コスト重視",
    high_potential: "高ポテンシャル重視",
    position_specific: "不足ポジション重視",
    local: "地元選手重視",
    data_driven: "データ重視",
    balanced: "バランス型",
  };

  return labels[focus];
}

function createPlayerForFocus(state: GameState, focus: ScoutFocus): Player {
  const position = focus === "position_specific" ? getPriorityPosition(state) : undefined;

  if (focus === "youth") {
    return generateAdjustedPlayer({
      position,
      ageRange: { min: 16, max: 21 },
      overallRange: { min: 18, max: 34 },
      potentialRange: { min: 55, max: 78 },
      isHomegrown: false,
      growthBonus: 10,
    });
  }

  if (focus === "immediate") {
    return generateAdjustedPlayer({
      position,
      ageRange: { min: 24, max: 31 },
      overallRange: { min: 40, max: 56 },
      potentialRange: { min: 44, max: 66 },
      isHomegrown: false,
      salaryMultiplier: 1.16,
    });
  }

  if (focus === "low_cost") {
    const bargain = randomInt(1, 100) <= 18;

    return generateAdjustedPlayer({
      position,
      ageRange: { min: 19, max: 32 },
      overallRange: bargain ? { min: 36, max: 48 } : { min: 24, max: 40 },
      potentialRange: bargain ? { min: 46, max: 70 } : { min: 36, max: 62 },
      isHomegrown: false,
      salaryMultiplier: 0.78,
      marketValueMultiplier: 0.82,
    });
  }

  if (focus === "high_potential") {
    return generateAdjustedPlayer({
      position,
      ageRange: { min: 17, max: 23 },
      overallRange: { min: 24, max: 42 },
      potentialRange: { min: 62, max: 82 },
      isHomegrown: false,
      growthBonus: 8,
      salaryMultiplier: 1.08,
      marketValueMultiplier: 1.18,
    });
  }

  if (focus === "position_specific") {
    return generateAdjustedPlayer({
      position,
      ageRange: { min: 20, max: 30 },
      overallRange: { min: 32, max: 50 },
      potentialRange: { min: 42, max: 70 },
      isHomegrown: false,
    });
  }

  if (focus === "local") {
    return generateAdjustedPlayer({
      position,
      ageRange: { min: 18, max: 28 },
      overallRange: { min: 26, max: 46 },
      potentialRange: { min: 40, max: 70 },
      isHomegrown: true,
      salaryMultiplier: SCOUT_BALANCE.localSalaryDiscount,
    });
  }

  if (focus === "data_driven") {
    return generateAdjustedPlayer({
      position,
      ageRange: { min: 20, max: 28 },
      overallRange: { min: 34, max: 50 },
      potentialRange: { min: 48, max: 72 },
      isHomegrown: false,
    });
  }

  return generateAdjustedPlayer({
    position,
    ageRange: { min: 18, max: 31 },
    overallRange: { min: 28, max: 48 },
    potentialRange: { min: 42, max: 70 },
    isHomegrown: randomInt(1, 100) <= 28,
  });
}

function generateAdjustedPlayer(input: {
  position?: PlayerPosition;
  ageRange: { min: number; max: number };
  overallRange: { min: number; max: number };
  potentialRange: { min: number; max: number };
  isHomegrown: boolean;
  growthBonus?: number;
  salaryMultiplier?: number;
  marketValueMultiplier?: number;
}): Player {
  const player = generatePlayer({
    position: input.position,
    ageRange: input.ageRange,
    overallRange: input.overallRange,
    potentialRange: input.potentialRange,
    isHomegrown: input.isHomegrown,
  });
  const adjustedPlayer = {
    ...player,
    growth: clampRating(player.growth + (input.growthBonus ?? 0)),
  };
  const salary = roundTo(calculatePlayerSalary(adjustedPlayer) * (input.salaryMultiplier ?? 1), 1_000);
  const marketValue = roundTo(
    calculateMarketValue({ ...adjustedPlayer, salary }) * (input.marketValueMultiplier ?? 1),
    10_000,
  );

  return {
    ...adjustedPlayer,
    salary,
    marketValue,
  };
}

function getPriorityPosition(state: GameState): PlayerPosition {
  const counts = getPositionCounts(state.players);
  const targets: Record<PlayerPosition, number> = { GK: 2, DF: 6, MF: 6, FW: 4 };

  return POSITIONS.reduce((lowest, position) => {
    const currentGap = targets[position] - counts[position];
    const lowestGap = targets[lowest] - counts[lowest];

    if (currentGap > lowestGap) {
      return position;
    }

    if (currentGap === lowestGap && counts[position] < counts[lowest]) {
      return position;
    }

    return lowest;
  }, pick(POSITIONS));
}

function getEstimateErrorRange(scoutAccuracy: number): number {
  const accuracyRatio =
    (scoutAccuracy - SCOUT_BALANCE.minAccuracy) /
    (SCOUT_BALANCE.maxAccuracy - SCOUT_BALANCE.minAccuracy);
  const error =
    SCOUT_BALANCE.estimateMaxError -
    (SCOUT_BALANCE.estimateMaxError - SCOUT_BALANCE.estimateMinError) * accuracyRatio;

  return Math.round(clamp(error, SCOUT_BALANCE.estimateMinError, SCOUT_BALANCE.estimateMaxError));
}

function randomPercentNoise(baseRate: number, scoutAccuracy: number): number {
  const accuracyFactor = 1 - scoutAccuracy / 110;
  const range = baseRate * clamp(accuracyFactor, 0.2, 1);

  return randomInt(Math.round(-range * 100), Math.round(range * 100)) / 100;
}

function addMonths(year: number, month: number, months: number): { year: number; month: number } {
  let next = { year, month };

  for (let index = 0; index < months; index += 1) {
    next = advanceGameMonth(next.year, next.month);
  }

  return next;
}

function compareYearMonth(
  leftYear: number,
  leftMonth: number,
  rightYear: number,
  rightMonth: number,
): number {
  return leftYear * 12 + leftMonth - (rightYear * 12 + rightMonth);
}

function roundTo(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function clampRating(value: number): number {
  return clamp(value, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
