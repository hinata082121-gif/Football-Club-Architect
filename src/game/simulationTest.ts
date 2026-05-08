import { pathToFileURL } from "node:url";
import { canRenewPlayerContract, renewPlayerContract } from "@/game/contractEngine";
import { resolveEventChoice } from "@/game/eventEngine";
import { createInitialGameState } from "@/game/initialState";
import { canEnterOfficialCompetition, enterOfficialCompetition } from "@/game/matchEngine";
import {
  canPerformPlayerAction,
  MVP_PLAYER_ACTIONS,
  performPlayerAction,
} from "@/game/playerActionEngine";
import { canPlayTrainingMatch, playTrainingMatch } from "@/game/trainingMatchEngine";
import { advanceTurn } from "@/game/turnEngine";
import { pick } from "@/utils/random";
import type { GameState, Player, PlayerAction, TrainingMatchType } from "@/types/game";

export interface SimulationSummary {
  turns: number;
  count: number;
  averageMoney: number;
  minMoney: number;
  maxMoney: number;
  averageFans: number;
  averageTeamPower: number;
  averageStaffCount: number;
  averageCondition: number;
  bankruptcyRiskCount: number;
  averageActionLogCount: number;
  matchReportCount: number;
  averagePlayerCount: number;
  averagePlayerAge: number;
  averageTotalPlayerSalary: number;
  averagePlayerOverall: number;
  averagePlayerPotential: number;
  averageYoungPlayerCount: number;
  averageVeteranCount: number;
  averageExpiringContractCount: number;
  notes: string[];
}

const TRAINING_TYPES: TrainingMatchType[] = ["weaker", "equal", "stronger", "local", "youth"];
const BANKRUPTCY_RISK_THRESHOLD = -500_000;
const LOW_CONDITION_THRESHOLD = 35;

export function runSimulation(turns: number): GameState {
  let state = createInitialGameState();

  for (let turnIndex = 0; turnIndex < turns; turnIndex += 1) {
    state = resolvePendingEvents(state);
    state = runContractMaintenance(state);
    state = runPlayerPlan(state);
    state = maybeEnterOfficialMatch(state);
    state = maybePlayTrainingMatch(state);
    state = advanceTurn(state);
  }

  return resolvePendingEvents(state);
}

function runContractMaintenance(state: GameState): GameState {
  return state.players
    .filter(
      (player) =>
        player.contractMonths <= 3 &&
        player.status !== "retired" &&
        !player.announcedRetirement,
    )
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3)
    .reduce((currentState, player) => {
      const renewal = canRenewPlayerContract(currentState, player.id, 12);
      const reserveCash = 250_000;

      if (!renewal.canRenew || !renewal.cost || currentState.club.money - renewal.cost < reserveCash) {
        return currentState;
      }

      return renewPlayerContract(currentState, player.id, 12);
    }, state);
}

export function runMultipleSimulations(turns: number, count: number): SimulationSummary {
  const states = Array.from({ length: count }, () => runSimulation(turns));
  const moneyValues = states.map((state) => state.club.money);
  const notes = createNotes(states);

  return {
    turns,
    count,
    averageMoney: average(moneyValues),
    minMoney: Math.min(...moneyValues),
    maxMoney: Math.max(...moneyValues),
    averageFans: average(states.map((state) => state.club.fans)),
    averageTeamPower: average(states.map((state) => state.club.teamPower)),
    averageStaffCount: average(states.map((state) => state.staff.length)),
    averageCondition: average(states.map((state) => state.club.condition)),
    bankruptcyRiskCount: states.filter((state) => state.club.money < BANKRUPTCY_RISK_THRESHOLD).length,
    averageActionLogCount: average(states.map((state) => state.actionLogs.length)),
    matchReportCount: states.filter((state) => state.lastMatchReport !== null).length,
    averagePlayerCount: average(states.map((state) => state.players.length)),
    averagePlayerAge: averageDecimal(states.map((state) => getAveragePlayerAge(state.players))),
    averageTotalPlayerSalary: average(states.map((state) => getTotalPlayerSalary(state.players))),
    averagePlayerOverall: averageDecimal(states.map((state) => getAveragePlayerOverall(state.players))),
    averagePlayerPotential: averageDecimal(states.map((state) => getAveragePlayerPotential(state.players))),
    averageYoungPlayerCount: average(states.map((state) => countYoungPlayers(state.players))),
    averageVeteranCount: average(states.map((state) => countVeteranPlayers(state.players))),
    averageExpiringContractCount: average(states.map((state) => countExpiringContracts(state.players))),
    notes,
  };
}

function runPlayerPlan(state: GameState): GameState {
  let nextState = state;
  const maxActions = nextState.club.actionPoints;

  for (let actionIndex = 0; actionIndex < maxActions; actionIndex += 1) {
    const action = choosePlayerAction(nextState);

    if (!action || !canPerformPlayerAction(nextState, action)) {
      break;
    }

    nextState = performPlayerAction(nextState, action);
  }

  return nextState;
}

function choosePlayerAction(state: GameState): PlayerAction | null {
  const weightedActionIds = [
    "sponsor_sales",
    "do_pr",
    "improve_teamwork",
    "rest_team",
    "train_coach",
    "recruit_player",
    state.staff.length < 3 ? "hire_staff" : "sponsor_sales",
  ];

  if (state.club.condition < 45) {
    weightedActionIds.push("rest_team", "rest_team");
  }
  if (state.club.money < 300_000) {
    weightedActionIds.push("sponsor_sales", "sponsor_sales");
  }
  if (state.club.teamPower < 55 && state.club.money > 300_000) {
    weightedActionIds.push("recruit_player");
  }

  const actionId = pick(weightedActionIds);
  const action = MVP_PLAYER_ACTIONS.find((candidate) => candidate.id === actionId) ?? null;

  if (action && canPerformPlayerAction(state, action)) {
    return action;
  }

  return MVP_PLAYER_ACTIONS.find((candidate) => canPerformPlayerAction(state, candidate)) ?? null;
}

function maybeEnterOfficialMatch(state: GameState): GameState {
  if (state.club.turn % 3 !== 1) {
    return state;
  }

  return canEnterOfficialCompetition(state) ? enterOfficialCompetition(state) : state;
}

function maybePlayTrainingMatch(state: GameState): GameState {
  if (!canPlayTrainingMatch(state) || state.club.actionPoints <= 0) {
    return state;
  }

  if (state.hasEnteredOfficialCompetition) {
    return state;
  }

  const type = state.club.condition < 45 ? "youth" : pick(TRAINING_TYPES);
  return playTrainingMatch(state, type);
}

function resolvePendingEvents(state: GameState): GameState {
  return state.events
    .filter((event) => event.status === "pending")
    .reduce((currentState, event) => {
      const choice = chooseEventChoice(currentState, event.id);
      return choice ? resolveEventChoice(currentState, event.id, choice) : currentState;
    }, state);
}

function chooseEventChoice(state: GameState, eventId: string): string | null {
  const event = state.events.find((candidate) => candidate.id === eventId);

  if (!event) {
    return null;
  }

  const affordableChoices = event.choices.filter(
    (choice) => state.club.money + (choice.effects.money ?? 0) >= 0,
  );

  return (affordableChoices[0] ?? event.choices[0])?.id ?? null;
}

function createNotes(states: GameState[]): string[] {
  const notes: string[] = [];
  const bankruptcyRiskCount = states.filter(
    (state) => state.club.money < BANKRUPTCY_RISK_THRESHOLD,
  ).length;
  const simulatedTurns = Math.max(1, (states[0]?.club.turn ?? 1) - 1);
  const excessMoneyThreshold = Math.max(8_000_000, simulatedTurns * 500_000);
  const excessiveMoneyCount = states.filter(
    (state) => state.club.money > excessMoneyThreshold,
  ).length;
  const lowConditionCount = states.filter(
    (state) => state.club.condition < LOW_CONDITION_THRESHOLD,
  ).length;
  const missingReportCount = states.filter((state) => state.lastMatchReport === null).length;
  const lowPlayerCount = states.filter((state) => state.players.length < 16).length;
  const oversizedSquadCount = states.filter((state) => state.players.length > 30).length;
  const sharpPowerDropCount = states.filter((state) => state.club.teamPower < 20).length;

  if (bankruptcyRiskCount > 0) {
    notes.push(`${bankruptcyRiskCount} runs ended below ${BANKRUPTCY_RISK_THRESHOLD.toLocaleString()} yen.`);
  }
  if (excessiveMoneyCount > 0) {
    notes.push(`${excessiveMoneyCount} runs exceeded ${excessMoneyThreshold.toLocaleString()} yen.`);
  }
  if (lowConditionCount > 0) {
    notes.push(`${lowConditionCount} runs ended with condition below ${LOW_CONDITION_THRESHOLD}.`);
  }
  if (missingReportCount > 0) {
    notes.push(`${missingReportCount} runs ended without a match report.`);
  }
  if (lowPlayerCount > 0) {
    notes.push(`${lowPlayerCount} runs ended below the minimum player count.`);
  }
  if (oversizedSquadCount > 0) {
    notes.push(`${oversizedSquadCount} runs exceeded the player cap.`);
  }
  if (sharpPowerDropCount > 0) {
    notes.push(`${sharpPowerDropCount} runs ended with team power below 20.`);
  }
  if (notes.length === 0) {
    notes.push("No extreme balance issues detected in this sample.");
  }

  return notes;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageDecimal(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function getAveragePlayerAge(players: Player[]): number {
  return getAveragePlayerValue(players, (player) => player.age);
}

function getTotalPlayerSalary(players: Player[]): number {
  return players.reduce((total, player) => total + player.salary, 0);
}

function getAveragePlayerOverall(players: Player[]): number {
  return getAveragePlayerValue(players, (player) => player.overall);
}

function getAveragePlayerPotential(players: Player[]): number {
  return getAveragePlayerValue(players, (player) => player.potential);
}

function getAveragePlayerValue(players: Player[], getValue: (player: Player) => number): number {
  if (players.length === 0) {
    return 0;
  }

  return players.reduce((total, player) => total + getValue(player), 0) / players.length;
}

function countYoungPlayers(players: Player[]): number {
  return players.filter((player) => player.age <= 23).length;
}

function countVeteranPlayers(players: Player[]): number {
  return players.filter((player) => player.age >= 30).length;
}

function countExpiringContracts(players: Player[]): number {
  return players.filter((player) => player.contractMonths <= 3 && player.status !== "retired").length;
}

function printSummary(summary: SimulationSummary) {
  console.log(`\n=== ${summary.turns} turns x ${summary.count} runs ===`);
  console.table({
    averageMoney: summary.averageMoney,
    minMoney: summary.minMoney,
    maxMoney: summary.maxMoney,
    averageFans: summary.averageFans,
    averageTeamPower: summary.averageTeamPower,
    averageStaffCount: summary.averageStaffCount,
    averageCondition: summary.averageCondition,
    bankruptcyRiskCount: summary.bankruptcyRiskCount,
    averageActionLogCount: summary.averageActionLogCount,
    matchReportCount: summary.matchReportCount,
    averagePlayerCount: summary.averagePlayerCount,
    averagePlayerAge: summary.averagePlayerAge,
    averageTotalPlayerSalary: summary.averageTotalPlayerSalary,
    averagePlayerOverall: summary.averagePlayerOverall,
    averagePlayerPotential: summary.averagePlayerPotential,
    averageYoungPlayerCount: summary.averageYoungPlayerCount,
    averageVeteranCount: summary.averageVeteranCount,
    averageExpiringContractCount: summary.averageExpiringContractCount,
  });
  console.log(`notes: ${summary.notes.join(" / ")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  [10, 30, 60].forEach((turns) => {
    printSummary(runMultipleSimulations(turns, 20));
  });
}
