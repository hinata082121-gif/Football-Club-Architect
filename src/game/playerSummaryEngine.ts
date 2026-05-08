import type {
  Player,
  PlayerPosition,
  PlayerStatus,
  TeamCompositionSummary,
} from "@/types/game";

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

export function getTeamCompositionSummary(players: Player[]): TeamCompositionSummary {
  const startingPlayers = getPlayersByStatus(players, "starting");
  const benchPlayers = getPlayersByStatus(players, "bench");
  const reservePlayers = getPlayersByStatus(players, "reserve");

  return {
    totalPlayers: players.length,
    averageAge: getAverageAge(players),
    totalSalary: getTotalSalary(players),
    averageOverall: getAverageOverall(players),
    averagePotential: getAveragePotential(players),
    positionCounts: getPositionCounts(players),
    startingAverageOverall: getAverageOverall(startingPlayers),
    benchAverageOverall: getAverageOverall(benchPlayers),
    reserveAverageOverall: getAverageOverall(reservePlayers),
  };
}

export function getPlayersByStatus(players: Player[], status: PlayerStatus): Player[] {
  return players.filter((player) => player.status === status);
}

export function getPlayersByPosition(players: Player[], position: PlayerPosition): Player[] {
  return players.filter((player) => player.position === position);
}

export function getAverageAge(players: Player[]): number {
  return roundOneDecimal(getAverage(players.map((player) => player.age)));
}

export function getTotalSalary(players: Player[]): number {
  return players.reduce((total, player) => total + player.salary, 0);
}

export function getAverageOverall(players: Player[]): number {
  return roundOneDecimal(getAverage(players.map((player) => player.overall)));
}

export function getAveragePotential(players: Player[]): number {
  return roundOneDecimal(getAverage(players.map((player) => player.potential)));
}

export function getPositionCounts(players: Player[]): Record<PlayerPosition, number> {
  return POSITIONS.reduce(
    (counts, position) => ({
      ...counts,
      [position]: getPlayersByPosition(players, position).length,
    }),
    { GK: 0, DF: 0, MF: 0, FW: 0 } satisfies Record<PlayerPosition, number>,
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
