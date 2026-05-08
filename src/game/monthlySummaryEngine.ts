import { ECONOMY_BALANCE, TURN_BALANCE } from "@/game/balance";
import type {
  ActionLog,
  FinanceLog,
  GameState,
  Match,
  MonthlyProgressConfirmation,
  MonthlyResultSummary,
  SummaryChange,
} from "@/types/game";

export function getCurrentMonthProgressConfirmation(
  state: GameState,
): MonthlyProgressConfirmation {
  const actionLogs = getCurrentMonthActionLogs(state);
  const matches = getCurrentMonthMatches(state);
  const trainingMatches = matches.filter((match) => match.type === "training");
  const officialMatches = matches.filter((match) => match.type === "league" || match.type === "cup");

  return {
    year: state.currentYear,
    month: state.currentMonth,
    actionLogs,
    matches,
    trainingMatches,
    officialMatches,
    resolvedEvents: getCurrentMonthResolvedEvents(state),
    remainingAp: state.club.actionPoints,
    warnings: getMonthlyWarnings(state),
    recommendations: getMonthlyRecommendations(state),
  };
}

export function createMonthlyResultSummary(
  before: GameState,
  after: GameState,
): MonthlyResultSummary {
  const targetYear = before.currentYear;
  const targetMonth = before.currentMonth;
  const actionLogs = mergeUniqueById(
    getLogsByDate(after.actionLogs, targetYear, targetMonth),
    getNewRecords(before.actionLogs, after.actionLogs),
  );
  const matches = mergeUniqueById(
    getMatchesByDate(after.matches, targetYear, targetMonth),
    getNewRecords(before.matches, after.matches),
  );
  const financeLogs = mergeUniqueById(
    getFinanceLogsByDate(after.financeLogs, targetYear, targetMonth),
    getNewRecords(before.financeLogs, after.financeLogs),
  );

  return {
    year: targetYear,
    month: targetMonth,
    actionLogs,
    matches,
    financeLogs,
    moneyBefore: before.club.money,
    moneyAfter: after.club.money,
    fansBefore: before.club.fans,
    fansAfter: after.club.fans,
    reputationBefore: before.club.reputation,
    reputationAfter: after.club.reputation,
    teamPowerBefore: before.club.teamPower,
    teamPowerAfter: after.club.teamPower,
    conditionBefore: before.club.condition,
    conditionAfter: after.club.condition,
    keyChanges: createKeyChanges(before, after),
    warnings: getMonthlyWarnings(after),
    recommendations: getMonthlyRecommendations(after),
  };
}

export function getCurrentMonthActionLogs(state: GameState): ActionLog[] {
  return getLogsByDate(state.actionLogs, state.currentYear, state.currentMonth).filter(
    (log) => log.actorType === "player" || log.actorType === "staff",
  );
}

export function getCurrentMonthMatches(state: GameState): Match[] {
  return getMatchesByDate(state.matches, state.currentYear, state.currentMonth);
}

export function getCurrentMonthFinanceLogs(state: GameState): FinanceLog[] {
  return getFinanceLogsByDate(state.financeLogs, state.currentYear, state.currentMonth);
}

export function getMonthlyWarnings(state: GameState): string[] {
  const warnings: string[] = [];

  if (state.club.actionPoints > 0) {
    warnings.push(`APが${state.club.actionPoints}残っています。まだ社長行動を実行できます。`);
  }
  if (state.events.some((event) => event.status === "pending")) {
    warnings.push("未解決イベントがあります。翌月へ進む前に確認できます。");
  }
  if (state.financialHealth.status !== "healthy") {
    warnings.push(...state.financialHealth.warnings.slice(0, 2));
  }
  if (state.club.money <= ECONOMY_BALANCE.minimumCashWarning) {
    warnings.push("資金が少なくなっています。短期リカバリーや融資の検討余地があります。");
  }
  if (state.club.condition <= TURN_BALANCE.lowConditionWarning) {
    warnings.push("コンディションが低下しています。休養や施設管理を検討してください。");
  }

  return Array.from(new Set(warnings));
}

export function getMonthlyRecommendations(state: GameState): string[] {
  const recommendations: string[] = [];

  if (state.club.actionPoints > 0) {
    recommendations.push("APを使い切ると、月次進行前の取りこぼしを減らせます。");
  }
  if (state.events.some((event) => event.status === "pending")) {
    recommendations.push("イベント画面で未解決イベントを処理しましょう。");
  }
  if (state.officialCompetitionEntry?.active) {
    recommendations.push(`公式戦参加中です。残り${state.officialCompetitionEntry.remainingMonths}か月、自動で公式戦が行われます。`);
  } else {
    recommendations.push("公式戦にエントリーすると4か月間、自動で公式戦に参加できます。");
  }
  if (state.club.condition < 60) {
    recommendations.push("次月の試合に備えて休養やコンディション回復を優先しましょう。");
  }
  if (state.club.money < 0) {
    recommendations.push("財務画面で融資や短期リカバリーを確認しましょう。");
  }

  return recommendations.slice(0, 4);
}

function getCurrentMonthResolvedEvents(state: GameState): ActionLog[] {
  return getLogsByDate(state.actionLogs, state.currentYear, state.currentMonth).filter(
    (log) => log.actionName.includes("イベント") || log.reason.includes("イベント"),
  );
}

function createKeyChanges(before: GameState, after: GameState): SummaryChange[] {
  return [
    createChange("資金", before.club.money, after.club.money, true),
    createChange("ファン", before.club.fans, after.club.fans, true),
    createChange("評判", before.club.reputation, after.club.reputation, true),
    createChange("チーム戦力", before.club.teamPower, after.club.teamPower, true),
    createChange("コンディション", before.club.condition, after.club.condition, true),
    createChange("監督経験値", before.coach.experience, after.coach.experience, true),
  ];
}

function createChange(
  label: string,
  before: number,
  after: number,
  upIsPositive: boolean,
): SummaryChange {
  const delta = Math.round((after - before) * 10) / 10;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";
  const positiveDirection =
    (direction === "up" && upIsPositive) || (direction === "down" && !upIsPositive);
  const tone =
    direction === "neutral"
      ? "neutral"
      : positiveDirection
        ? "positive"
        : "negative";

  return {
    label,
    before,
    after,
    delta,
    direction,
    tone,
  };
}

function getLogsByDate(logs: ActionLog[], year: number, month: number): ActionLog[] {
  return logs.filter((log) => log.year === year && log.month === month);
}

function getMatchesByDate(matches: Match[], year: number, month: number): Match[] {
  return matches.filter((match) => match.year === year && match.month === month);
}

function getFinanceLogsByDate(
  logs: FinanceLog[],
  year: number,
  month: number,
): FinanceLog[] {
  return logs.filter((log) => log.year === year && log.month === month);
}

function getNewRecords<T extends { id: string }>(before: T[], after: T[]): T[] {
  const beforeIds = new Set(before.map((record) => record.id));

  return after.filter((record) => !beforeIds.has(record.id));
}

function mergeUniqueById<T extends { id: string }>(first: T[], second: T[]): T[] {
  const seen = new Set<string>();

  return [...first, ...second].filter((record) => {
    if (seen.has(record.id)) {
      return false;
    }

    seen.add(record.id);
    return true;
  });
}
