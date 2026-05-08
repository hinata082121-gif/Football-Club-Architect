import {
  MAX_CLUB_RATING,
  MIN_CLUB_RATING,
  RECOVERY_ACTION_BALANCE,
} from "@/game/balance";
import { updateFinancialHealth } from "@/game/financeHealthEngine";
import { chance, randomInt } from "@/utils/random";
import type {
  ActionLog,
  FinanceLog,
  GameState,
  RecoveryAction,
  RecoveryActionType,
  Staff,
} from "@/types/game";

export function getAvailableRecoveryActions(state: GameState): RecoveryAction[] {
  return RECOVERY_ACTION_BALANCE.actionTypes.map((type) => {
    const check = canExecuteRecoveryAction(state, type);

    return {
      ...createRecoveryAction(state, type),
      available: check.canExecute,
      disabledReason: check.reason,
    };
  });
}

export function executeRecoveryAction(
  state: GameState,
  actionType: RecoveryActionType,
): GameState {
  const check = canExecuteRecoveryAction(state, actionType);

  if (!check.canExecute) {
    return state;
  }

  if (actionType === "sponsor_advance") {
    return executeSponsorAdvance(state);
  }

  if (actionType === "emergency_sponsor_pitch") {
    return executeEmergencySponsorPitch(state);
  }

  if (actionType === "cost_cutting_campaign") {
    return executeCostCuttingCampaign(state);
  }

  if (actionType === "goods_clearance") {
    return executeGoodsClearance(state);
  }

  return executeTicketPriceIncrease(state);
}

export function canExecuteRecoveryAction(
  state: GameState,
  actionType: RecoveryActionType,
): { canExecute: boolean; reason?: string } {
  if (state.isGameOver || state.financialHealth.status === "bankrupt") {
    return { canExecute: false, reason: "経営破綻状態では実行できません。" };
  }

  if (hasRecoveryActionThisMonth(state, actionType)) {
    return { canExecute: false, reason: "同じ短期リカバリー行動は今月すでに実行済みです。" };
  }

  if (actionType === "sponsor_advance") {
    if (state.sponsorAdvance?.active) {
      return { canExecute: false, reason: "スポンサー前借りのペナルティ期間中です。" };
    }

    if (state.club.sponsorPower < RECOVERY_ACTION_BALANCE.sponsorAdvance.minimumSponsorPower) {
      return { canExecute: false, reason: "スポンサー力が低く、前借り交渉が成立しません。" };
    }
  }

  if (actionType === "emergency_sponsor_pitch") {
    if (state.club.actionPoints < RECOVERY_ACTION_BALANCE.emergencySponsorPitch.actionPointCost) {
      return { canExecute: false, reason: "APが不足しています。" };
    }
  }

  if (actionType === "cost_cutting_campaign") {
    if (state.club.actionPoints < RECOVERY_ACTION_BALANCE.costCuttingCampaign.actionPointCost) {
      return { canExecute: false, reason: "APが不足しています。" };
    }
  }

  if (
    actionType === "goods_clearance" &&
    state.club.goodsPower < RECOVERY_ACTION_BALANCE.goodsClearance.minimumGoodsPower
  ) {
    return { canExecute: false, reason: "処分できるグッズ在庫・商品力が不足しています。" };
  }

  if (
    actionType === "ticket_price_increase" &&
    state.club.fans < RECOVERY_ACTION_BALANCE.ticketPriceIncrease.minimumFans
  ) {
    return { canExecute: false, reason: "ファン基盤が小さく、値上げ効果が見込めません。" };
  }

  return { canExecute: true };
}

export function applySponsorAdvancePenaltyMonthly(state: GameState): GameState {
  const advance = state.sponsorAdvance;

  if (!advance?.active || advance.remainingMonths <= 0) {
    return state;
  }

  const nextRemainingMonths = advance.remainingMonths - 1;
  const nextAdvance = {
    ...advance,
    active: nextRemainingMonths > 0,
    remainingMonths: Math.max(0, nextRemainingMonths),
  };
  const financeLog: FinanceLog = {
    id: `finance-sponsor-advance-penalty-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "sponsor",
    amount: -advance.monthlySponsorPenalty,
    description: "スポンサー前借りによる月次収入減少",
  };
  const actionLog: ActionLog = {
    id: `sponsor-advance-penalty-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: "スポンサー前借りペナルティ",
    reason: "過去に受け取ったスポンサー収入の前借り分を月次収入から控除するため。",
    result: `スポンサー収入が${advance.monthlySponsorPenalty.toLocaleString()}円減少しました。残り${nextAdvance.remainingMonths}か月です。`,
    effects: {
      money: -advance.monthlySponsorPenalty,
    },
  };
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: state.club.money - advance.monthlySponsorPenalty,
    },
    sponsorAdvance: nextAdvance,
  });

  return {
    ...nextState,
    financeLogs: [financeLog, ...nextState.financeLogs],
    actionLogs: [actionLog, ...nextState.actionLogs],
  };
}

function executeSponsorAdvance(state: GameState): GameState {
  const amount = calculateSponsorAdvanceAmount(state);
  const reputationEffect = RECOVERY_ACTION_BALANCE.sponsorAdvance.reputationEffect;
  const nextReputation = clamp(
    state.club.reputation + reputationEffect,
    MIN_CLUB_RATING,
    MAX_CLUB_RATING,
  );
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: state.club.money + amount,
      reputation: nextReputation,
    },
    sponsorAdvance: {
      active: true,
      remainingMonths: RECOVERY_ACTION_BALANCE.sponsorAdvance.durationMonths,
      monthlySponsorPenalty: RECOVERY_ACTION_BALANCE.sponsorAdvance.monthlyPenalty,
      amountReceived: amount,
    },
  });

  return addRecoveryLogs(nextState, {
    actionType: "sponsor_advance",
    title: "スポンサー収入の前借り",
    reason: "借入以外の短期資金を確保し、当面の資金繰りを改善するため。",
    result: `${amount.toLocaleString()}円を前借りしました。今後${RECOVERY_ACTION_BALANCE.sponsorAdvance.durationMonths}か月、スポンサー収入が毎月${RECOVERY_ACTION_BALANCE.sponsorAdvance.monthlyPenalty.toLocaleString()}円減少します。`,
    money: amount,
    reputation: nextReputation - state.club.reputation,
  });
}

function executeEmergencySponsorPitch(state: GameState): GameState {
  const successChance = calculateEmergencySponsorPitchSuccessChance(state);
  const succeeded = chance(successChance);
  const money = succeeded
    ? randomInt(
        RECOVERY_ACTION_BALANCE.emergencySponsorPitch.successMoneyMin,
        RECOVERY_ACTION_BALANCE.emergencySponsorPitch.successMoneyMax,
      )
    : RECOVERY_ACTION_BALANCE.emergencySponsorPitch.failureMoney;
  const sponsorPowerEffect = succeeded
    ? RECOVERY_ACTION_BALANCE.emergencySponsorPitch.successSponsorPowerGain
    : 0;
  const reputationEffect = succeeded
    ? 0
    : RECOVERY_ACTION_BALANCE.emergencySponsorPitch.failureReputationEffect;
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: state.club.money + money,
      actionPoints:
        state.club.actionPoints -
        RECOVERY_ACTION_BALANCE.emergencySponsorPitch.actionPointCost,
      sponsorPower: clamp(
        state.club.sponsorPower + sponsorPowerEffect,
        MIN_CLUB_RATING,
        MAX_CLUB_RATING,
      ),
      reputation: clamp(
        state.club.reputation + reputationEffect,
        MIN_CLUB_RATING,
        MAX_CLUB_RATING,
      ),
    },
  });

  return addRecoveryLogs(nextState, {
    actionType: "emergency_sponsor_pitch",
    title: "緊急スポンサー営業",
    reason: `財務改善のため、成功率${Math.round(successChance * 100)}%の緊急営業を実行したため。`,
    result: succeeded
      ? `${money.toLocaleString()}円の緊急スポンサー資金を確保し、スポンサー力が上がりました。`
      : `${money.toLocaleString()}円は確保しましたが、急な営業により評判が少し下がりました。`,
    money,
    reputation: reputationEffect,
    sponsorPower: sponsorPowerEffect,
    actionPoints: -RECOVERY_ACTION_BALANCE.emergencySponsorPitch.actionPointCost,
  });
}

function executeCostCuttingCampaign(state: GameState): GameState {
  const money = RECOVERY_ACTION_BALANCE.costCuttingCampaign.money;
  const dissatisfaction = RECOVERY_ACTION_BALANCE.costCuttingCampaign.staffDissatisfaction;
  const nextStaff = state.staff.map((member) => ({
    ...member,
    dissatisfaction: clamp(
      member.dissatisfaction + dissatisfaction,
      MIN_CLUB_RATING,
      MAX_CLUB_RATING,
    ),
  }));
  const nextState = updateFinancialHealth({
    ...state,
    staff: nextStaff,
    club: {
      ...state.club,
      money: state.club.money + money,
      actionPoints:
        state.club.actionPoints -
        RECOVERY_ACTION_BALANCE.costCuttingCampaign.actionPointCost,
    },
  });

  return addRecoveryLogs(nextState, {
    actionType: "cost_cutting_campaign",
    title: "緊急コスト削減",
    reason: "短期の固定費圧縮で資金繰りを改善するため。",
    result: `${money.toLocaleString()}円を確保しましたが、スタッフ不満が上昇しました。`,
    money,
    actionPoints: -RECOVERY_ACTION_BALANCE.costCuttingCampaign.actionPointCost,
    staffDissatisfaction: dissatisfaction,
  });
}

function executeGoodsClearance(state: GameState): GameState {
  const money =
    RECOVERY_ACTION_BALANCE.goodsClearance.baseMoney +
    state.club.goodsPower * RECOVERY_ACTION_BALANCE.goodsClearance.moneyPerGoodsPower;
  const nextGoodsPower = clamp(
    state.club.goodsPower + RECOVERY_ACTION_BALANCE.goodsClearance.goodsPowerEffect,
    MIN_CLUB_RATING,
    MAX_CLUB_RATING,
  );
  const nextReputation = clamp(
    state.club.reputation + RECOVERY_ACTION_BALANCE.goodsClearance.reputationEffect,
    MIN_CLUB_RATING,
    MAX_CLUB_RATING,
  );
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: state.club.money + money,
      goodsPower: nextGoodsPower,
      reputation: nextReputation,
    },
  });

  return addRecoveryLogs(nextState, {
    actionType: "goods_clearance",
    title: "グッズ在庫処分",
    reason: "短期資金を確保するため、グッズ在庫を値引き処分したため。",
    result: `${money.toLocaleString()}円を確保しましたが、グッズ力と評判が少し下がりました。`,
    money,
    goodsPower: nextGoodsPower - state.club.goodsPower,
    reputation: nextReputation - state.club.reputation,
  });
}

function executeTicketPriceIncrease(state: GameState): GameState {
  const money =
    RECOVERY_ACTION_BALANCE.ticketPriceIncrease.baseMoney +
    state.club.fans * RECOVERY_ACTION_BALANCE.ticketPriceIncrease.moneyPerFan;
  const nextFans = Math.max(0, state.club.fans + RECOVERY_ACTION_BALANCE.ticketPriceIncrease.fanEffect);
  const nextReputation = clamp(
    state.club.reputation + RECOVERY_ACTION_BALANCE.ticketPriceIncrease.reputationEffect,
    MIN_CLUB_RATING,
    MAX_CLUB_RATING,
  );
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: state.club.money + money,
      fans: nextFans,
      reputation: nextReputation,
    },
  });

  return addRecoveryLogs(nextState, {
    actionType: "ticket_price_increase",
    title: "チケット価格の緊急値上げ",
    reason: "短期の入場収入を増やすため。",
    result: `${money.toLocaleString()}円を確保しましたが、ファンと評判が少し下がりました。`,
    money,
    fans: nextFans - state.club.fans,
    reputation: nextReputation - state.club.reputation,
  });
}

function createRecoveryAction(state: GameState, type: RecoveryActionType): RecoveryAction {
  if (type === "sponsor_advance") {
    return {
      type,
      title: "スポンサー収入の前借り",
      description: "スポンサー収入を先に受け取り、今後数か月のスポンサー収入を減らします。",
      immediateMoneyEffect: calculateSponsorAdvanceAmount(state),
      monthlyPenalty: RECOVERY_ACTION_BALANCE.sponsorAdvance.monthlyPenalty,
      durationMonths: RECOVERY_ACTION_BALANCE.sponsorAdvance.durationMonths,
      reputationEffect: RECOVERY_ACTION_BALANCE.sponsorAdvance.reputationEffect,
      riskNote: "借金ではありませんが、今後の月次収入が下がります。同時利用はできません。",
      available: true,
    };
  }

  if (type === "emergency_sponsor_pitch") {
    return {
      type,
      title: "緊急スポンサー営業",
      description: "APを使って短期スポンサー営業を行います。営業スタッフがいるほど成功しやすくなります。",
      immediateMoneyEffect: RECOVERY_ACTION_BALANCE.emergencySponsorPitch.successMoneyMin,
      riskNote: "失敗しても少額資金は得られますが、評判が下がります。",
      available: true,
    };
  }

  if (type === "cost_cutting_campaign") {
    return {
      type,
      title: "緊急コスト削減",
      description: "APを使って支出を圧縮し、短期資金を確保します。",
      immediateMoneyEffect: RECOVERY_ACTION_BALANCE.costCuttingCampaign.money,
      riskNote: "スタッフ不満が上昇します。委任効率の低下につながる可能性があります。",
      available: true,
    };
  }

  if (type === "goods_clearance") {
    const money =
      RECOVERY_ACTION_BALANCE.goodsClearance.baseMoney +
      state.club.goodsPower * RECOVERY_ACTION_BALANCE.goodsClearance.moneyPerGoodsPower;

    return {
      type,
      title: "グッズ在庫処分",
      description: "在庫処分で短期資金を作ります。",
      immediateMoneyEffect: money,
      reputationEffect: RECOVERY_ACTION_BALANCE.goodsClearance.reputationEffect,
      riskNote: "グッズ力が下がり、ブランド価値にも少し影響します。",
      available: true,
    };
  }

  const money =
    RECOVERY_ACTION_BALANCE.ticketPriceIncrease.baseMoney +
    state.club.fans * RECOVERY_ACTION_BALANCE.ticketPriceIncrease.moneyPerFan;

  return {
    type,
    title: "チケット価格の緊急値上げ",
    description: "一時的な値上げで短期収入を増やします。",
    immediateMoneyEffect: money,
    fanEffect: RECOVERY_ACTION_BALANCE.ticketPriceIncrease.fanEffect,
    reputationEffect: RECOVERY_ACTION_BALANCE.ticketPriceIncrease.reputationEffect,
    riskNote: "ファン離れと評判低下のリスクがあります。",
    available: true,
  };
}

function calculateSponsorAdvanceAmount(state: GameState): number {
  return Math.min(
    RECOVERY_ACTION_BALANCE.sponsorAdvance.maxAmount,
    RECOVERY_ACTION_BALANCE.sponsorAdvance.baseAmount +
      state.club.reputation * RECOVERY_ACTION_BALANCE.sponsorAdvance.reputationMultiplier +
      state.club.sponsorPower * RECOVERY_ACTION_BALANCE.sponsorAdvance.sponsorPowerMultiplier,
  );
}

function calculateEmergencySponsorPitchSuccessChance(state: GameState): number {
  const salesStaff = state.staff.filter((member) => member.role === "sales");
  const bestSalesStaffScore = salesStaff.reduce(
    (best, member) => Math.max(best, calculateSalesStaffScore(member)),
    0,
  );
  const probability =
    RECOVERY_ACTION_BALANCE.emergencySponsorPitch.baseSuccessChance +
    state.club.reputation * RECOVERY_ACTION_BALANCE.emergencySponsorPitch.reputationWeight +
    state.club.sponsorPower * RECOVERY_ACTION_BALANCE.emergencySponsorPitch.sponsorPowerWeight +
    bestSalesStaffScore * RECOVERY_ACTION_BALANCE.emergencySponsorPitch.salesStaffSpecialtyWeight;

  return Math.min(
    RECOVERY_ACTION_BALANCE.emergencySponsorPitch.maxSuccessChance,
    Math.max(0.12, probability),
  );
}

function calculateSalesStaffScore(staff: Staff): number {
  const specialtyBonus =
    staff.specialty.includes("スポンサー") ||
    staff.specialty.toLowerCase().includes("sales") ||
    staff.specialty.includes("営業")
      ? 10
      : 0;

  return (staff.judgment + staff.aiAccuracy) / 2 + staff.level * 3 + specialtyBonus;
}

function hasRecoveryActionThisMonth(
  state: GameState,
  actionType: RecoveryActionType,
): boolean {
  return state.actionLogs.some(
    (log) =>
      log.id.startsWith(`recovery-${actionType}-`) &&
      log.year === state.currentYear &&
      log.month === state.currentMonth,
  );
}

function addRecoveryLogs(
  state: GameState,
  input: {
    actionType: RecoveryActionType;
    title: string;
    reason: string;
    result: string;
    money: number;
    actionPoints?: number;
    reputation?: number;
    fans?: number;
    sponsorPower?: number;
    goodsPower?: number;
    staffDissatisfaction?: number;
  },
): GameState {
  const actionLog: ActionLog = {
    id: `recovery-${input.actionType}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: input.title,
    reason: input.reason,
    result: input.result,
    effects: {
      money: input.money,
      actionPoints: input.actionPoints,
      reputation: input.reputation,
      fans: input.fans,
      sponsorPower: input.sponsorPower,
      goodsPower: input.goodsPower,
      staffDissatisfaction: input.staffDissatisfaction,
    },
  };
  const financeLog: FinanceLog = {
    id: `finance-recovery-${input.actionType}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "recovery",
    amount: input.money,
    description: input.title,
  };

  return {
    ...state,
    actionLogs: [actionLog, ...state.actionLogs],
    financeLogs: [financeLog, ...state.financeLogs],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
