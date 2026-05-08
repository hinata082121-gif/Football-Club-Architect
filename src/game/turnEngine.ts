import {
  ECONOMY_BALANCE,
  MAX_CLUB_RATING,
  MAX_CONDITION,
  MIN_CLUB_RATING,
  TURN_BALANCE,
} from "@/game/balance";
import { updateBankruptcyState } from "@/game/bankruptcyEngine";
import {
  applyMonthlyPlayerSalaries,
  updatePlayerContractsMonthly,
} from "@/game/contractEngine";
import { maybeGenerateRandomEvent } from "@/game/eventEngine";
import { updateFinancialHealth } from "@/game/financeHealthEngine";
import { applyMonthlyLoanPayments } from "@/game/loanEngine";
import { simulateMatch } from "@/game/matchEngine";
import { updatePlayersMonthly } from "@/game/playerDevelopmentEngine";
import { applySponsorAdvancePenaltyMonthly } from "@/game/recoveryActionEngine";
import { removeExpiredScoutedPlayers } from "@/game/scoutEngine";
import { runStaffAIActions } from "@/game/staffAIEngine";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import { advanceGameMonth, formatDatedRecord, formatYearMonth } from "@/utils/date";
import type { ActionLog, FinanceLog, GameState, Staff, StatEffects } from "@/types/game";

export function advanceTurn(state: GameState): GameState {
  const startedState = startNewTurn(state);
  const playerDevelopmentState = updatePlayersMonthly(startedState);
  const contractState = updatePlayerContractsMonthly(playerDevelopmentState);
  const staffActionState = runStaffAIActions(contractState);
  const economyState = applyMonthlyOrPeriodicCosts(staffActionState);
  const playerSalaryState = applyMonthlyPlayerSalaries(economyState);
  const loanPaymentState = applyMonthlyLoanPayments(playerSalaryState);
  const recoveryPenaltyState = applySponsorAdvancePenaltyMonthly(loanPaymentState);
  const scoutState = removeExpiredScoutedPlayers(recoveryPenaltyState);
  const eventState = maybeGenerateRandomEvent(scoutState);
  const recalculatedState = recalculateClubTeamPower(eventState);

  return updateBankruptcyState(updateFinancialHealth(prepareScheduledOfficialMatch(recalculatedState)));
}

export function startNewTurn(state: GameState): GameState {
  const nextTurn = state.club.turn + 1;
  const nextDate = advanceGameMonth(state.currentYear, state.currentMonth);
  const nextCondition = clamp(
    state.club.condition + TURN_BALANCE.naturalConditionRecovery,
    0,
    MAX_CONDITION,
  );

  return {
    ...state,
    currentYear: nextDate.year,
    currentMonth: nextDate.month,
    elapsedMonths: state.elapsedMonths + 1,
    club: {
      ...state.club,
      turn: nextTurn,
      actionPoints: state.club.maxActionPoints,
      condition: nextCondition,
    },
    actionLogs: [
      createActionLog({
        id: `turn-start-${nextTurn}`,
        turn: nextTurn,
        year: nextDate.year,
        month: nextDate.month,
        actionName: "新しい月",
        reason: "月を進行し、社長APとチーム状態を整えるため。",
        result: `${formatYearMonth(nextDate.year, nextDate.month)}になりました。社長APが最大値まで回復し、コンディションが自然回復しました。`,
        effects: {
          actionPoints: state.club.maxActionPoints - state.club.actionPoints,
          condition: nextCondition - state.club.condition,
        },
      }),
      ...state.actionLogs,
    ],
  };
}

export function applyMonthlyOrPeriodicCosts(state: GameState): GameState {
  const salaryCost = calculateStaffSalaryCost(state.staff);
  const fixedCost = ECONOMY_BALANCE.monthlyFixedCost;
  const baseIncome = calculateBaseIncome(state);
  const totalCost = salaryCost + fixedCost;
  const netChange = baseIncome - totalCost;
  const nextMoney = state.club.money + netChange;
  const dissatisfactionChange = getPeriodicDissatisfactionChange(nextMoney);
  const nextStaff = updateStaffDissatisfaction(state.staff, dissatisfactionChange);
  const financeLogs = createPeriodicFinanceLogs(state, salaryCost, fixedCost, baseIncome);
  const actionLogs = createPeriodicActionLogs(
    state,
    salaryCost,
    fixedCost,
    baseIncome,
    netChange,
    nextMoney,
    nextStaff,
    dissatisfactionChange,
  );

  return {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
    },
    staff: nextStaff,
    financeLogs: [...financeLogs, ...state.financeLogs],
    actionLogs: [...actionLogs, ...state.actionLogs],
  };
}

function prepareScheduledOfficialMatch(state: GameState): GameState {
  if (!state.scheduledOfficialMatch) {
    return state;
  }

  if (state.scheduledOfficialMatch.turn <= state.club.turn) {
    const { state: nextState } = simulateMatch(state, state.scheduledOfficialMatch);

    return nextState;
  }

  return {
    ...state,
    actionLogs: [
      createActionLog({
        id: `scheduled-match-ready-${state.scheduledOfficialMatch.id}-${state.club.turn}`,
        turn: state.club.turn,
        year: state.currentYear,
        month: state.currentMonth,
        actionName: "公式戦準備",
        reason: "scheduledOfficialMatchが設定されているため。",
        result: `${state.scheduledOfficialMatch.opponentName}戦が${formatDatedRecord(state.scheduledOfficialMatch)}に予定されています。休養や連携強化で準備できます。`,
        effects: {},
      }),
      ...state.actionLogs,
    ],
  };
}

function calculateStaffSalaryCost(staff: Staff[]): number {
  return staff.reduce((sum, member) => sum + member.salary, 0);
}

function calculateBaseIncome(state: GameState): number {
  const fanIncome = Math.floor(state.club.fans * ECONOMY_BALANCE.fanIncomeRate);
  const goodsIncome = state.club.goodsPower * ECONOMY_BALANCE.goodsIncomeRate;
  const sponsorIncome =
    state.club.sponsorPower *
    ECONOMY_BALANCE.sponsorIncomeRate *
    Math.max(1, Math.floor(state.club.reputation / 10));

  return fanIncome + goodsIncome + sponsorIncome;
}

function getPeriodicDissatisfactionChange(nextMoney: number): number {
  if (nextMoney < 0) {
    return TURN_BALANCE.debtStaffDissatisfactionChange;
  }

  if (nextMoney < ECONOMY_BALANCE.minimumCashWarning) {
    return TURN_BALANCE.lowCashStaffDissatisfactionChange;
  }

  return TURN_BALANCE.paidStaffDissatisfactionChange;
}

function updateStaffDissatisfaction(staff: Staff[], change: number): Staff[] {
  if (change === 0) {
    return staff;
  }

  return staff.map((member) => ({
    ...member,
    dissatisfaction: clamp(
      member.dissatisfaction + change,
      MIN_CLUB_RATING,
      MAX_CLUB_RATING,
    ),
  }));
}

function createPeriodicFinanceLogs(
  state: GameState,
  salaryCost: number,
  fixedCost: number,
  baseIncome: number,
): FinanceLog[] {
  const logs: FinanceLog[] = [];

  if (salaryCost > 0) {
    logs.push({
      id: `finance-salary-${state.club.turn}`,
      turn: state.club.turn,
      year: state.currentYear,
      month: state.currentMonth,
      category: "salary",
      amount: -salaryCost,
      description: "スタッフ給与",
    });
  }

  if (fixedCost > 0) {
    logs.push({
      id: `finance-fixed-cost-${state.club.turn}`,
      turn: state.club.turn,
      year: state.currentYear,
      month: state.currentMonth,
      category: "other",
      amount: -fixedCost,
      description: "クラブ運営固定費",
    });
  }

  if (baseIncome > 0) {
    logs.push({
      id: `finance-base-income-${state.club.turn}`,
      turn: state.club.turn,
      year: state.currentYear,
      month: state.currentMonth,
      category: "ticket",
      amount: baseIncome,
      description: "ファン・グッズ・スポンサーによる基本収入",
    });
  }

  return logs;
}

function createPeriodicActionLogs(
  state: GameState,
  salaryCost: number,
  fixedCost: number,
  baseIncome: number,
  netChange: number,
  nextMoney: number,
  nextStaff: Staff[],
  dissatisfactionChange: number,
): ActionLog[] {
  const logs: ActionLog[] = [
    createActionLog({
      id: `economy-summary-${state.club.turn}`,
      turn: state.club.turn,
      year: state.currentYear,
      month: state.currentMonth,
      actionName: "月次収支処理",
      reason: "スタッフ給与とクラブの基本収入を毎月処理するため。",
      result: `収入 ${baseIncome.toLocaleString()}円、給与 ${salaryCost.toLocaleString()}円、固定費 ${fixedCost.toLocaleString()}円、差引 ${netChange.toLocaleString()}円です。`,
      effects: {
        money: netChange,
        staffDissatisfaction: dissatisfactionChange,
      },
    }),
  ];

  if (nextMoney < ECONOMY_BALANCE.minimumCashWarning) {
    logs.push(
      createActionLog({
        id: `cash-warning-${state.club.turn}`,
        turn: state.club.turn,
        year: state.currentYear,
        month: state.currentMonth,
        actionName: "資金警告",
        reason: "クラブ資金が警戒ラインを下回ったため。",
        result: "資金が少なくなっています。スポンサー営業、PR、練習試合などで立て直す余地があります。",
        effects: {},
      }),
    );
  }

  if (state.club.condition < TURN_BALANCE.lowConditionWarning) {
    logs.push(
      createActionLog({
        id: `condition-warning-${state.club.turn}`,
        turn: state.club.turn,
        year: state.currentYear,
        month: state.currentMonth,
        actionName: "コンディション警告",
        reason: "チームコンディションが低下しているため。",
        result: "コンディションが低く、試合や練習効率に影響する可能性があります。休養指示や施設系スタッフの活用を検討してください。",
        effects: {},
      }),
    );
  }

  if (salaryCost > baseIncome * ECONOMY_BALANCE.salaryBurdenWarningRatio && salaryCost > 0) {
    logs.push(
      createActionLog({
        id: `salary-burden-warning-${state.club.turn}`,
        turn: state.club.turn,
        year: state.currentYear,
        month: state.currentMonth,
        actionName: "給与負担警告",
        reason: "スタッフ給与が収入に対して重くなっているため。",
        result: "支出が大きくなっています。委任効果が収支に見合っているか確認してください。",
        effects: {},
      }),
    );
  }

  const unhappyStaff = nextStaff.filter(
    (member) => member.dissatisfaction >= TURN_BALANCE.highDissatisfactionWarning,
  );

  if (unhappyStaff.length > 0) {
    logs.push(
      createActionLog({
        id: `staff-dissatisfaction-warning-${state.club.turn}`,
        turn: state.club.turn,
        year: state.currentYear,
        month: state.currentMonth,
        actionName: "スタッフ不満警告",
        reason: "不満が高いスタッフがいるため。",
        result: `${unhappyStaff.map((member) => member.name).join("、")} の不満が高まっています。即退職はしませんが、対応が必要です。`,
        effects: {},
      }),
    );
  }

  return logs;
}

function createActionLog(input: {
  id: string;
  turn: number;
  year?: number;
  month?: number;
  actionName: string;
  reason: string;
  result: string;
  effects: StatEffects;
}): ActionLog {
  return {
    id: input.id,
    turn: input.turn,
    year: input.year,
    month: input.month,
    actorType: "system",
    actorName: "System",
    actionName: input.actionName,
    reason: input.reason,
    result: input.result,
    effects: input.effects,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
