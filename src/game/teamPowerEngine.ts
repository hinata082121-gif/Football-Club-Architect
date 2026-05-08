import { TEAM_POWER_BALANCE } from "@/game/balance";
import { getPlayersByStatus, getAverageOverall } from "@/game/playerSummaryEngine";
import type { GameState, Player, TeamPowerBreakdown } from "@/types/game";

export function calculateSquadBasePower(players: Player[]): number {
  return roundOneDecimal(getAverageOverall(players));
}

export function calculateStartingElevenPower(players: Player[]): number {
  const startingPlayers = getPlayersByStatus(players, "starting")
    .sort((a, b) => b.overall - a.overall)
    .slice(0, TEAM_POWER_BALANCE.expectedStartingCount);

  if (startingPlayers.length === 0) {
    return 0;
  }

  const missingCount = Math.max(
    0,
    TEAM_POWER_BALANCE.expectedStartingCount - startingPlayers.length,
  );
  const shortagePenalty = missingCount * TEAM_POWER_BALANCE.missingStarterPenalty;

  return roundOneDecimal(Math.max(0, getAverageOverall(startingPlayers) - shortagePenalty));
}

export function calculateBenchDepthPower(players: Player[]): number {
  const benchPlayers = getPlayersByStatus(players, "bench");

  if (benchPlayers.length === 0) {
    return 0;
  }

  const missingCount = Math.max(0, TEAM_POWER_BALANCE.expectedBenchCount - benchPlayers.length);
  const shortagePenalty = missingCount * TEAM_POWER_BALANCE.missingBenchPenalty;
  const depthPower =
    getAverageOverall(benchPlayers) * TEAM_POWER_BALANCE.benchDepthWeight - shortagePenalty;

  return roundOneDecimal(Math.max(0, depthPower));
}

export function calculateConditionAdjustedPower(players: Player[]): number {
  const startingPlayers = getPlayersByStatus(players, "starting");

  if (startingPlayers.length === 0) {
    return 0;
  }

  const averageCondition = getAverage(startingPlayers.map((player) => player.condition));
  const modifier =
    (averageCondition - TEAM_POWER_BALANCE.conditionNeutral) * TEAM_POWER_BALANCE.conditionWeight;

  return roundOneDecimal(
    clamp(
      modifier,
      TEAM_POWER_BALANCE.minConditionModifier,
      TEAM_POWER_BALANCE.maxConditionModifier,
    ),
  );
}

export function calculateTeamPowerFromPlayers(state: GameState): number {
  return getTeamPowerBreakdown(state).finalTeamPower;
}

export function recalculateClubTeamPower(state: GameState): GameState {
  const finalTeamPower = calculateTeamPowerFromPlayers(state);

  return {
    ...state,
    club: {
      ...state.club,
      teamPower: finalTeamPower,
    },
  };
}

export function getTeamPowerBreakdown(state: GameState): TeamPowerBreakdown {
  if (state.players.length === 0) {
    return {
      startingPower: state.club.teamPower,
      benchDepth: 0,
      conditionModifier: 0,
      teamworkModifier: 0,
      coachModifier: 0,
      finalTeamPower: state.club.teamPower,
    };
  }

  const startingPower = calculateStartingElevenPower(state.players);
  const benchDepth = calculateBenchDepthPower(state.players);
  const conditionModifier = calculateConditionAdjustedPower(state.players);
  const teamworkModifier = calculateTeamworkModifier(state);
  const coachModifier = calculateCoachModifier(state);
  const finalTeamPower = roundOneDecimal(
    clamp(
      startingPower + benchDepth + conditionModifier + teamworkModifier + coachModifier,
      TEAM_POWER_BALANCE.minTeamPower,
      TEAM_POWER_BALANCE.maxTeamPower,
    ),
  );

  return {
    startingPower,
    benchDepth,
    conditionModifier,
    teamworkModifier,
    coachModifier,
    finalTeamPower,
  };
}

function calculateTeamworkModifier(state: GameState): number {
  const modifier =
    (state.club.teamwork - TEAM_POWER_BALANCE.teamworkNeutral) * TEAM_POWER_BALANCE.teamworkWeight;

  return roundOneDecimal(
    clamp(
      modifier,
      TEAM_POWER_BALANCE.minTeamworkModifier,
      TEAM_POWER_BALANCE.maxTeamworkModifier,
    ),
  );
}

function calculateCoachModifier(state: GameState): number {
  const playerSelectionModifier =
    (state.coach.playerSelection - TEAM_POWER_BALANCE.coachNeutral) *
    TEAM_POWER_BALANCE.coachSelectionWeight;
  const tacticsModifier =
    (state.coach.tactics - TEAM_POWER_BALANCE.coachNeutral) *
    TEAM_POWER_BALANCE.coachTacticsWeight;
  const levelModifier = state.coach.level * TEAM_POWER_BALANCE.coachLevelWeight;

  return roundOneDecimal(
    clamp(
      playerSelectionModifier + tacticsModifier + levelModifier,
      TEAM_POWER_BALANCE.minCoachModifier,
      TEAM_POWER_BALANCE.maxCoachModifier,
    ),
  );
}

function getAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
