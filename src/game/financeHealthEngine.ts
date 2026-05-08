import {
  ECONOMY_BALANCE,
  FINANCE_HEALTH_THRESHOLDS,
} from "@/game/balance";
import { calculateTotalPlayerSalary } from "@/game/contractEngine";
import type {
  ActionLog,
  FinancialHealth,
  FinancialHealthStatus,
  GameState,
} from "@/types/game";

export function createInitialFinancialHealth(money: number): FinancialHealth {
  return {
    status: "healthy",
    money,
    debt: 0,
    netWorth: money,
    monthlyIncomeEstimate: 0,
    monthlyExpenseEstimate: 0,
    insolvencyLine: FINANCE_HEALTH_THRESHOLDS.insolvencyLine,
    monthsInInsolvency: 0,
    warnings: [],
    recommendedActions: [],
  };
}

export function calculateFinancialHealth(state: GameState): FinancialHealth {
  const debt = calculateTotalDebtForHealth(state);
  const monthlyIncomeEstimate = estimateMonthlyIncome(state);
  const monthlyExpenseEstimate = estimateMonthlyExpense(state);
  const status = getFinancialHealthStatus(state);

  return {
    status,
    money: state.club.money,
    debt,
    netWorth: state.club.money - debt,
    monthlyIncomeEstimate,
    monthlyExpenseEstimate,
    insolvencyLine: FINANCE_HEALTH_THRESHOLDS.insolvencyLine,
    monthsInInsolvency: state.monthsInInsolvency,
    warnings: getFinanceWarnings(state),
    recommendedActions: getRecommendedRecoveryActions(state),
  };
}

export function getFinancialHealthStatus(state: GameState): FinancialHealthStatus {
  if (state.isGameOver || state.bankruptcyState?.isBankrupt) {
    return "bankrupt";
  }

  return getStatusFromMoney(state.club.money, state.monthsInInsolvency);
}

export function updateFinancialHealth(state: GameState): GameState {
  const previousStatus = state.financialHealth.status;
  const currentStatus = getStatusFromMoney(state.club.money, state.monthsInInsolvency);
  const nextMonthsInInsolvency =
    currentStatus === "insolvent"
      ? state.monthsInInsolvency + 1
      : 0;
  const nextStatus = state.isGameOver || state.bankruptcyState?.isBankrupt
    ? "bankrupt"
    : getStatusFromMoney(state.club.money, nextMonthsInInsolvency);
  const nextState: GameState = {
    ...state,
    monthsInInsolvency: nextMonthsInInsolvency,
    isGameOver: state.isGameOver,
    gameOverReason: state.gameOverReason,
  };
  const financialHealth = calculateFinancialHealth({
    ...nextState,
    financialHealth: {
      ...nextState.financialHealth,
      status: nextStatus,
      monthsInInsolvency: nextMonthsInInsolvency,
    },
  });
  const stateWithHealth = {
    ...nextState,
    financialHealth: {
      ...financialHealth,
      status: nextStatus,
      monthsInInsolvency: nextMonthsInInsolvency,
    },
  };
  const actionLog = createFinancialHealthLog(stateWithHealth, previousStatus);

  return {
    ...stateWithHealth,
    actionLogs: actionLog ? [actionLog, ...stateWithHealth.actionLogs] : stateWithHealth.actionLogs,
  };
}

export function getFinanceWarnings(state: GameState): string[] {
  const status = getFinancialHealthStatus(state);
  const netMonthly = estimateMonthlyIncome(state) - estimateMonthlyExpense(state);
  const warnings: string[] = [];

  if (status === "healthy") {
    return warnings;
  }

  if (status === "caution") {
    warnings.push("資金が少なくなっています。翌月の人件費と固定費を確認してください。");
  }

  if (status === "cash_shortage") {
    warnings.push("資金がマイナスです。短期収入の確保と支出抑制が必要です。");
  }

  if (status === "financial_crisis") {
    warnings.push("財務危機です。融資、選手売却、人件費削減を検討してください。");
  }

  if (status === "insolvency_warning") {
    warnings.push("債務超過ラインが近づいています。再建計画が必要です。");
  }

  if (status === "insolvent") {
    warnings.push("債務超過状態です。猶予期間内に資金を改善してください。");
  }

  if (status === "bankrupt") {
    warnings.push("経営破綻条件を満たしています。再建リスタートまたはゲームオーバー処理が必要です。");
  }

  if (netMonthly < 0) {
    warnings.push(`推定月次収支が${netMonthly.toLocaleString()}円の赤字です。`);
  }

  return warnings;
}

export function getRecommendedRecoveryActions(state: GameState): string[] {
  const status = getFinancialHealthStatus(state);

  if (status === "healthy") {
    return ["財務は安定しています。成長投資と支出管理のバランスを維持しましょう。"];
  }

  if (status === "caution") {
    return ["支出を確認しましょう。", "高額な補強は慎重に行いましょう。"];
  }

  if (status === "cash_shortage") {
    return [
      "スポンサー営業を検討しましょう。",
      "スポンサー収入の前借りや緊急スポンサー営業で短期資金を確保できます。",
      "練習試合や地域イベントで収入を確保しましょう。",
      "高額支出を控えましょう。",
    ];
  }

  if (status === "financial_crisis") {
    return [
      "融資を検討しましょう。",
      "借入を増やしたくない場合はスポンサー前借りや緊急スポンサー営業を検討しましょう。",
      "高年俸選手や高給スタッフの整理を検討しましょう。",
      "スポンサー収入の前借りを検討しましょう。",
    ];
  }

  if (status === "insolvency_warning") {
    return [
      "再建計画が必要です。",
      "主力売却や人件費削減を検討してください。",
      "緊急融資を検討してください。",
      "緊急スポンサー営業で即時資金を取りに行く判断もあります。",
    ];
  }

  if (status === "insolvent") {
    return [
      "債務超過状態です。",
      "猶予期間内に資金を改善してください。",
      "最終再建策を実行してください。",
    ];
  }

  return [
    "経営破綻状態です。",
    "再建リスタートまたは新規開始を選択する画面が必要です。",
  ];
}

export function estimateMonthlyIncome(state: GameState): number {
  const fanIncome = Math.floor(state.club.fans * ECONOMY_BALANCE.fanIncomeRate);
  const goodsIncome = state.club.goodsPower * ECONOMY_BALANCE.goodsIncomeRate;
  const sponsorIncome =
    state.club.sponsorPower *
    ECONOMY_BALANCE.sponsorIncomeRate *
    Math.max(1, Math.floor(state.club.reputation / 10));

  return fanIncome + goodsIncome + sponsorIncome;
}

export function estimateMonthlyExpense(state: GameState): number {
  const staffSalary = state.staff.reduce((total, member) => total + member.salary, 0);
  const playerSalary = calculateTotalPlayerSalary(state.players);
  const loanPayments = state.loans
    .filter((loan) => loan.status === "active")
    .reduce((total, loan) => total + loan.monthlyPayment, 0);
  const sponsorAdvancePenalty = state.sponsorAdvance?.active
    ? state.sponsorAdvance.monthlySponsorPenalty
    : 0;

  return (
    ECONOMY_BALANCE.monthlyFixedCost +
    staffSalary +
    playerSalary +
    loanPayments +
    sponsorAdvancePenalty
  );
}

function calculateTotalDebtForHealth(state: GameState): number {
  return state.loans
    .filter((loan) => loan.status === "active")
    .reduce((total, loan) => total + loan.remainingPrincipal, 0);
}

function getStatusFromMoney(
  money: number,
  monthsInInsolvency: number,
): FinancialHealthStatus {
  if (
    money < FINANCE_HEALTH_THRESHOLDS.insolvencyLine &&
    monthsInInsolvency > FINANCE_HEALTH_THRESHOLDS.bankruptcyGraceMonths
  ) {
    return "insolvent";
  }

  if (money < FINANCE_HEALTH_THRESHOLDS.insolvencyLine) {
    return "insolvent";
  }

  if (money < FINANCE_HEALTH_THRESHOLDS.insolvencyWarningMoney) {
    return "insolvency_warning";
  }

  if (money < FINANCE_HEALTH_THRESHOLDS.financialCrisisMoney) {
    return "financial_crisis";
  }

  if (money < FINANCE_HEALTH_THRESHOLDS.cashShortageMoney) {
    return "cash_shortage";
  }

  if (money < FINANCE_HEALTH_THRESHOLDS.cautionMoney) {
    return "caution";
  }

  return "healthy";
}

function createFinancialHealthLog(
  state: GameState,
  previousStatus: FinancialHealthStatus,
): ActionLog | null {
  const status = state.financialHealth.status;

  if (status === previousStatus && status !== "bankrupt") {
    return null;
  }

  if (status === "healthy") {
    return null;
  }

  return {
    id: `financial-health-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: "財務状態警告",
    reason: "月次処理でクラブ資金と支出見込みを確認したため。",
    result: `財務状態が${getFinancialHealthStatusLabel(status)}になりました。${state.financialHealth.warnings[0] ?? "財務状況を確認してください。"}`,
    effects: {},
  };
}

export function getFinancialHealthStatusLabel(status: FinancialHealthStatus): string {
  const labels: Record<FinancialHealthStatus, string> = {
    healthy: "健全",
    caution: "注意",
    cash_shortage: "資金不足",
    financial_crisis: "財務危機",
    insolvency_warning: "債務超過警戒",
    insolvent: "債務超過",
    bankrupt: "経営破綻",
  };

  return labels[status];
}
