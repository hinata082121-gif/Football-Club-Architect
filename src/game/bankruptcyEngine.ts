import {
  BANKRUPTCY_BALANCE,
  FINANCE_HEALTH_THRESHOLDS,
  MAX_CLUB_RATING,
  MIN_CLUB_RATING,
  TRANSFER_BALANCE,
} from "@/game/balance";
import { updateFinancialHealth } from "@/game/financeHealthEngine";
import { canTakeLoan, takeLoan } from "@/game/loanEngine";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import type {
  ActionLog,
  FinanceLog,
  FinalRecoveryOptionType,
  GameState,
  Loan,
  Player,
  Staff,
  StatEffects,
} from "@/types/game";

export function updateBankruptcyState(state: GameState): GameState {
  if (state.isGameOver || state.bankruptcyState.isBankrupt) {
    return syncBankruptcyState(state);
  }

  const syncedState = syncBankruptcyState(state);
  const needsFinalWarning =
    syncedState.club.money < FINANCE_HEALTH_THRESHOLDS.insolvencyLine &&
    syncedState.monthsInInsolvency >= BANKRUPTCY_BALANCE.finalWarningMonth &&
    !syncedState.bankruptcyState.finalWarningIssued;

  if (needsFinalWarning) {
    return issueFinalBankruptcyWarning(syncedState);
  }

  return syncedState;
}

export function shouldTriggerBankruptcy(state: GameState): boolean {
  return (
    state.club.money < FINANCE_HEALTH_THRESHOLDS.insolvencyLine &&
    state.monthsInInsolvency >= FINANCE_HEALTH_THRESHOLDS.bankruptcyGraceMonths &&
    state.bankruptcyState.finalWarningIssued
  );
}

export function issueFinalBankruptcyWarning(state: GameState): GameState {
  const reason = `債務超過状態が${state.monthsInInsolvency}か月続いています。猶予期間内に資金を改善してください。`;
  const nextState: GameState = {
    ...state,
    bankruptcyState: {
      ...state.bankruptcyState,
      monthsInInsolvency: state.monthsInInsolvency,
      finalWarningIssued: true,
      bankruptcyReason: reason,
      canDownsizeRestart: true,
    },
  };

  return {
    ...nextState,
    actionLogs: [
      createSystemLog(nextState, {
        id: `bankruptcy-final-warning-${state.club.turn}-${Date.now()}`,
        actionName: "経営破綻最終警告",
        reason: "債務超過状態が続き、猶予期間の終盤に入ったため。",
        result: reason,
        effects: {},
      }),
      ...nextState.actionLogs,
    ],
  };
}

export function executeFinalRecoveryOption(
  state: GameState,
  option: FinalRecoveryOptionType,
): GameState {
  if (state.isGameOver && option !== "downsize_club") {
    return state;
  }

  if (option === "fire_sale_players") {
    return fireSalePlayers(state);
  }

  if (option === "reduce_staff") {
    return reduceStaff(state);
  }

  if (option === "emergency_loan") {
    return executeEmergencyLoan(state);
  }

  if (option === "downsize_club") {
    return downsizeClubAndRestart(state);
  }

  return declareBankruptcy(state);
}

export function downsizeClubAndRestart(state: GameState): GameState {
  const keptPlayers = keepCorePlayers(state.players);
  const keptStaff = keepCoreStaff(state.staff);
  const adjustedLoans = reduceLoanPrincipal(state.loans);
  const nextClubLevel = Math.max(
    1,
    state.club.clubLevel - BANKRUPTCY_BALANCE.downsizeClubLevelLoss,
  );
  const nextReputation = clamp(
    state.club.reputation - BANKRUPTCY_BALANCE.downsizeReputationLoss,
    MIN_CLUB_RATING,
    MAX_CLUB_RATING,
  );
  const nextFans = Math.max(50, Math.floor(state.club.fans * BANKRUPTCY_BALANCE.downsizeFanRate));
  const nextStadiumCapacity = Math.max(
    500,
    Math.floor(state.club.stadiumCapacity * BANKRUPTCY_BALANCE.downsizeStadiumRate),
  );
  const baseState: GameState = {
    ...state,
    staff: keptStaff,
    players: keptPlayers,
    loans: adjustedLoans,
    monthsInInsolvency: 0,
    isGameOver: false,
    gameOverReason: undefined,
    bankruptcyState: {
      isBankrupt: false,
      monthsInInsolvency: 0,
      finalWarningIssued: false,
      canDownsizeRestart: false,
    },
    club: {
      ...state.club,
      money: BANKRUPTCY_BALANCE.downsizeRestartMoney,
      clubLevel: nextClubLevel,
      reputation: nextReputation,
      fans: nextFans,
      stadiumCapacity: nextStadiumCapacity,
    },
  };
  const recalculatedState = updateFinancialHealth(recalculateClubTeamPower(baseState));

  return {
    ...recalculatedState,
    actionLogs: [
      createSystemLog(recalculatedState, {
        id: `downsize-restart-${state.club.turn}-${Date.now()}`,
        actionName: "縮小再建リスタート",
        reason: "完全な経営破綻を避け、クラブ規模を縮小して再建するため。",
        result: `クラブ規模を縮小し、資金${BANKRUPTCY_BALANCE.downsizeRestartMoney.toLocaleString()}円から再建を開始しました。選手${keptPlayers.length}人、スタッフ${keptStaff.length}人で再出発します。`,
        effects: {
          money: BANKRUPTCY_BALANCE.downsizeRestartMoney - state.club.money,
          clubLevel: nextClubLevel - state.club.clubLevel,
          reputation: nextReputation - state.club.reputation,
          fans: nextFans - state.club.fans,
        },
      }),
      ...recalculatedState.actionLogs,
    ],
    financeLogs: [
      createFinanceLog(recalculatedState, {
        id: `finance-downsize-restart-${state.club.turn}-${Date.now()}`,
        amount: BANKRUPTCY_BALANCE.downsizeRestartMoney - state.club.money,
        description: "縮小再建による資金整理",
      }),
      ...recalculatedState.financeLogs,
    ],
  };
}

export function declareBankruptcy(state: GameState): GameState {
  const reason =
    state.bankruptcyState.bankruptcyReason ??
    `債務超過ライン${FINANCE_HEALTH_THRESHOLDS.insolvencyLine.toLocaleString()}円を下回った状態が改善できませんでした。`;
  const nextState: GameState = {
    ...state,
    isGameOver: true,
    gameOverReason: reason,
    bankruptcyState: {
      ...state.bankruptcyState,
      isBankrupt: true,
      monthsInInsolvency: state.monthsInInsolvency,
      finalWarningIssued: true,
      bankruptcyReason: reason,
    },
  };
  const updatedState = updateFinancialHealth(nextState);

  return {
    ...updatedState,
    actionLogs: [
      createSystemLog(updatedState, {
        id: `declare-bankruptcy-${state.club.turn}-${Date.now()}`,
        actionName: "経営破綻",
        reason: "最終救済を行わず、経営破綻を確定したため。",
        result: reason,
        effects: {},
      }),
      ...updatedState.actionLogs,
    ],
  };
}

function syncBankruptcyState(state: GameState): GameState {
  const isInsolvent = state.club.money < FINANCE_HEALTH_THRESHOLDS.insolvencyLine;
  const canDownsizeRestart =
    state.bankruptcyState.canDownsizeRestart && !state.bankruptcyState.isBankrupt;

  return {
    ...state,
    bankruptcyState: {
      ...state.bankruptcyState,
      monthsInInsolvency: isInsolvent ? state.monthsInInsolvency : 0,
      finalWarningIssued: isInsolvent ? state.bankruptcyState.finalWarningIssued : false,
      bankruptcyReason: isInsolvent ? state.bankruptcyState.bankruptcyReason : undefined,
      canDownsizeRestart,
    },
  };
}

function fireSalePlayers(state: GameState): GameState {
  const sellablePlayers = state.players
    .filter((player) => player.status !== "retired" && player.status !== "leaving")
    .sort((a, b) => b.marketValue + b.salary * 10 - (a.marketValue + a.salary * 10));
  const maxSellCount = Math.max(0, state.players.length - TRANSFER_BALANCE.minPlayers);
  const soldPlayers = sellablePlayers.slice(
    0,
    Math.min(BANKRUPTCY_BALANCE.fireSalePlayerCount, maxSellCount),
  );

  if (soldPlayers.length === 0) {
    return state;
  }

  const income = roundTo(
    soldPlayers.reduce((sum, player) => sum + player.marketValue, 0) *
      BANKRUPTCY_BALANCE.fireSaleIncomeRate,
    10_000,
  );
  const soldPlayerIds = new Set(soldPlayers.map((player) => player.id));
  const nextFans = Math.max(
    0,
    Math.floor(state.club.fans * (1 - BANKRUPTCY_BALANCE.fireSaleFanLossRate)),
  );
  const nextReputation = clamp(
    state.club.reputation - BANKRUPTCY_BALANCE.fireSaleReputationLoss,
    MIN_CLUB_RATING,
    MAX_CLUB_RATING,
  );
  const baseState: GameState = {
    ...state,
    players: state.players.filter((player) => !soldPlayerIds.has(player.id)),
    club: {
      ...state.club,
      money: state.club.money + income,
      fans: nextFans,
      reputation: nextReputation,
    },
  };
  const nextState = updateFinancialHealth(recalculateClubTeamPower(baseState));

  return addRecoveryLogs(nextState, {
    actionName: "最終救済: 主力売却",
    reason: "債務超過からの脱出を優先し、市場価値の高い選手を売却したため。",
    result: `${soldPlayers.map((player) => player.name).join("、")}を売却し、${income.toLocaleString()}円を確保しました。`,
    financeDescription: "最終救済による選手売却",
    effects: {
      money: income,
      fans: nextFans - state.club.fans,
      reputation: nextReputation - state.club.reputation,
    },
  });
}

function reduceStaff(state: GameState): GameState {
  const dismissedStaff = [...state.staff]
    .sort((a, b) => b.salary - a.salary)
    .slice(0, BANKRUPTCY_BALANCE.reduceStaffCount);

  if (dismissedStaff.length === 0) {
    return state;
  }

  const dismissedStaffIds = new Set(dismissedStaff.map((staff) => staff.id));
  const severanceCost = dismissedStaff.reduce(
    (sum, staff) => sum + staff.salary * BANKRUPTCY_BALANCE.reduceStaffSeveranceMonths,
    0,
  );
  const nextState = updateFinancialHealth({
    ...state,
    staff: state.staff.filter((staff) => !dismissedStaffIds.has(staff.id)),
    club: {
      ...state.club,
      money: state.club.money - severanceCost,
    },
  });

  return addRecoveryLogs(nextState, {
    actionName: "最終救済: スタッフ整理",
    reason: "月次人件費を下げるため、高給スタッフを整理したため。",
    result: `${dismissedStaff.map((staff) => staff.name).join("、")}を整理しました。退職費用${severanceCost.toLocaleString()}円が発生しますが、翌月以降の固定支出は下がります。`,
    financeDescription: "最終救済によるスタッフ整理費用",
    effects: {
      money: -severanceCost,
    },
  });
}

function executeEmergencyLoan(state: GameState): GameState {
  const offerId = "loan-offer-emergency";
  const check = canTakeLoan(state, offerId);

  if (check.canTake) {
    return takeLoan(state, offerId);
  }

  return {
    ...state,
    actionLogs: [
      createSystemLog(state, {
        id: `final-recovery-emergency-loan-failed-${state.club.turn}-${Date.now()}`,
        actionName: "最終救済: 緊急融資不可",
        reason: "緊急融資を試みたが、融資条件を満たさなかったため。",
        result: check.reason ?? "緊急融資を利用できませんでした。",
        effects: {},
      }),
      ...state.actionLogs,
    ],
  };
}

function addRecoveryLogs(
  state: GameState,
  input: {
    actionName: string;
    reason: string;
    result: string;
    financeDescription: string;
    effects: StatEffects;
  },
): GameState {
  return {
    ...state,
    actionLogs: [
      createSystemLog(state, {
        id: `final-recovery-${state.club.turn}-${Date.now()}`,
        actionName: input.actionName,
        reason: input.reason,
        result: input.result,
        effects: input.effects,
      }),
      ...state.actionLogs,
    ],
    financeLogs: [
      createFinanceLog(state, {
        id: `finance-final-recovery-${state.club.turn}-${Date.now()}`,
        amount: input.effects.money ?? 0,
        description: input.financeDescription,
      }),
      ...state.financeLogs,
    ],
  };
}

function keepCorePlayers(players: Player[]): Player[] {
  return [...players]
    .filter((player) => player.status !== "retired" && player.status !== "leaving")
    .sort((a, b) => b.overall + b.potential * 0.25 - (a.overall + a.potential * 0.25))
    .slice(0, BANKRUPTCY_BALANCE.downsizePlayerKeepCount)
    .map((player, index) => ({
      ...player,
      status: index < 11 ? "starting" : "bench",
    }));
}

function keepCoreStaff(staff: Staff[]): Staff[] {
  return [...staff]
    .sort((a, b) => b.level + b.aiAccuracy * 0.01 - (a.level + a.aiAccuracy * 0.01))
    .slice(0, BANKRUPTCY_BALANCE.downsizeStaffKeepCount)
    .map((member) => ({
      ...member,
      dissatisfaction: clamp(member.dissatisfaction + 12, MIN_CLUB_RATING, MAX_CLUB_RATING),
    }));
}

function reduceLoanPrincipal(loans: Loan[]): Loan[] {
  return loans.map((loan) => {
    if (loan.status !== "active") {
      return loan;
    }

    const remainingPrincipal = roundTo(
      loan.remainingPrincipal * BANKRUPTCY_BALANCE.downsizeLoanPrincipalRate,
      10_000,
    );

    return {
      ...loan,
      remainingPrincipal,
      monthlyPayment:
        loan.remainingMonths > 0
          ? Math.ceil((remainingPrincipal * (1 + loan.interestRate)) / loan.remainingMonths)
          : 0,
      status: remainingPrincipal <= 0 ? "repaid" : loan.status,
    };
  });
}

function createSystemLog(
  state: GameState,
  input: {
    id: string;
    actionName: string;
    reason: string;
    result: string;
    effects: StatEffects;
  },
): ActionLog {
  return {
    id: input.id,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: input.actionName,
    reason: input.reason,
    result: input.result,
    effects: input.effects,
  };
}

function createFinanceLog(
  state: GameState,
  input: {
    id: string;
    amount: number;
    description: string;
  },
): FinanceLog {
  return {
    id: input.id,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "recovery",
    amount: input.amount,
    description: input.description,
  };
}

function roundTo(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
