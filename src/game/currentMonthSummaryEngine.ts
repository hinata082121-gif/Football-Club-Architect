import type { ActionLog, CurrentMonthSummary, FinanceLog, GameState, Match } from "@/types/game";

export function getCurrentMonthActionLogs(state: GameState): ActionLog[] {
  return state.actionLogs.filter(
    (log) =>
      log.year === state.currentYear &&
      log.month === state.currentMonth &&
      log.actorType === "player" &&
      !isEventLog(log),
  );
}

export function getCurrentMonthMatches(state: GameState): Match[] {
  return state.matches.filter(
    (match) => match.year === state.currentYear && match.month === state.currentMonth,
  );
}

export function getCurrentMonthResolvedEvents(state: GameState): ActionLog[] {
  return state.actionLogs.filter(
    (log) =>
      log.year === state.currentYear &&
      log.month === state.currentMonth &&
      isEventLog(log),
  );
}

export function getCurrentMonthFinanceLogs(state: GameState): FinanceLog[] {
  return state.financeLogs.filter(
    (log) => log.year === state.currentYear && log.month === state.currentMonth,
  );
}

export function getCurrentMonthSummary(state: GameState): CurrentMonthSummary {
  return {
    actions: getCurrentMonthActionLogs(state),
    matches: getCurrentMonthMatches(state),
    eventLogs: getCurrentMonthResolvedEvents(state),
    financeLogs: getCurrentMonthFinanceLogs(state),
  };
}

function isEventLog(log: ActionLog): boolean {
  return log.actionName.startsWith("イベント") || log.actionName.includes("イベント解決");
}
