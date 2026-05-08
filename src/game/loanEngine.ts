import {
  LOAN_BALANCE,
  MAX_CLUB_RATING,
  MIN_CLUB_RATING,
} from "@/game/balance";
import { updateFinancialHealth } from "@/game/financeHealthEngine";
import type {
  ActionLog,
  FinanceLog,
  GameState,
  Loan,
  LoanOffer,
  LoanType,
} from "@/types/game";

export function getLoanOffers(state: GameState): LoanOffer[] {
  const offers = [
    createOffer(state, "short_term"),
    createOffer(state, "long_term"),
    createOffer(state, "emergency"),
    createOffer(state, "regional_support"),
    createOffer(state, "owner_injection"),
  ];

  return offers.map((offer) => {
    const check = canTakeLoanByOffer(state, offer);

    return {
      ...offer,
      available: check.canTake,
      disabledReason: check.reason,
    };
  });
}

export function canTakeLoan(
  state: GameState,
  offerId: string,
): { canTake: boolean; reason?: string } {
  const offer = getLoanOffers(state).find((candidate) => candidate.id === offerId);

  if (!offer) {
    return { canTake: false, reason: "融資オファーが見つかりません。" };
  }

  return canTakeLoanByOffer(state, offer);
}

export function takeLoan(state: GameState, offerId: string): GameState {
  const offer = getLoanOffers(state).find((candidate) => candidate.id === offerId);

  if (!offer) {
    return state;
  }

  const check = canTakeLoanByOffer(state, offer);

  if (!check.canTake) {
    return state;
  }

  const loan = createLoanFromOffer(state, offer);
  const nextMoney = state.club.money + offer.amount;
  const nextReputation =
    offer.type === "owner_injection"
      ? clamp(state.club.reputation - 1, MIN_CLUB_RATING, MAX_CLUB_RATING)
      : state.club.reputation;
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
      reputation: nextReputation,
    },
    loans: [loan, ...state.loans],
  });
  const actionLog: ActionLog = {
    id: `loan-${offer.type}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: offer.type === "owner_injection" ? "追加出資" : "融資実行",
    reason: "クラブの短期資金繰りと再建余地を確保するため。",
    result: `${getLoanTypeLabel(offer.type)}で${offer.amount.toLocaleString()}円を調達しました。月次返済は${offer.monthlyPayment.toLocaleString()}円です。`,
    effects: {
      money: offer.amount,
      reputation: nextReputation - state.club.reputation,
    },
  };
  const financeLog: FinanceLog = {
    id: `finance-loan-${offer.type}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "loan",
    amount: offer.amount,
    description: offer.type === "owner_injection" ? "社長追加出資" : `${getLoanTypeLabel(offer.type)}の借入`,
  };

  return {
    ...nextState,
    actionLogs: [actionLog, ...nextState.actionLogs],
    financeLogs: [financeLog, ...nextState.financeLogs],
  };
}

export function applyMonthlyLoanPayments(state: GameState): GameState {
  const activeLoans = state.loans.filter((loan) => loan.status === "active");

  if (activeLoans.length === 0) {
    return state;
  }

  let totalPayment = 0;
  const updatedLoans = state.loans.map((loan) => {
    if (loan.status !== "active") {
      return loan;
    }

    const principalPayment = Math.ceil(loan.principal / loan.totalMonths);
    const nextRemainingPrincipal = Math.max(0, loan.remainingPrincipal - principalPayment);
    const nextRemainingMonths = Math.max(0, loan.remainingMonths - 1);
    const repaid = nextRemainingPrincipal <= 0 || nextRemainingMonths <= 0;

    totalPayment += loan.monthlyPayment;

    return {
      ...loan,
      remainingPrincipal: repaid ? 0 : nextRemainingPrincipal,
      remainingMonths: repaid ? 0 : nextRemainingMonths,
      status: repaid ? "repaid" as const : loan.status,
    };
  });

  const nextMoney = state.club.money - totalPayment;
  const financeLog: FinanceLog = {
    id: `finance-loan-payment-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "loan_repayment",
    amount: -totalPayment,
    description: "融資月次返済",
  };
  const actionLog: ActionLog = {
    id: `loan-payment-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: "融資返済",
    reason: "activeな融資の月次返済を処理するため。",
    result: `今月の融資返済として${totalPayment.toLocaleString()}円を支払いました。`,
    effects: {
      money: -totalPayment,
    },
  };
  const nextState = updateFinancialHealth({
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
    },
    loans: updatedLoans,
  });

  return {
    ...nextState,
    financeLogs: [financeLog, ...nextState.financeLogs],
    actionLogs: [actionLog, ...nextState.actionLogs],
  };
}

export function calculateTotalDebt(state: GameState): number {
  return state.loans
    .filter((loan) => loan.status === "active")
    .reduce((total, loan) => total + loan.remainingPrincipal, 0);
}

export function calculateMonthlyLoanPaymentTotal(state: GameState): number {
  return state.loans
    .filter((loan) => loan.status === "active")
    .reduce((total, loan) => total + loan.monthlyPayment, 0);
}

export function createLoanFromOffer(state: GameState, offer: LoanOffer): Loan {
  const isOwnerInjection = offer.type === "owner_injection";

  return {
    id: `loan-${offer.type}-${state.club.turn}-${Date.now()}`,
    type: offer.type,
    principal: isOwnerInjection ? 0 : offer.amount,
    remainingPrincipal: isOwnerInjection ? 0 : offer.amount,
    interestRate: offer.interestRate,
    monthlyPayment: offer.monthlyPayment,
    remainingMonths: offer.totalMonths,
    totalMonths: offer.totalMonths,
    status: isOwnerInjection ? "repaid" : "active",
    borrowedAtYear: state.currentYear,
    borrowedAtMonth: state.currentMonth,
  };
}

export function getLoanTypeLabel(type: LoanType): string {
  const labels: Record<LoanType, string> = {
    short_term: "短期融資",
    long_term: "長期融資",
    emergency: "緊急融資",
    regional_support: "地域支援融資",
    owner_injection: "社長追加出資",
  };

  return labels[type];
}

function createOffer(state: GameState, type: LoanType): LoanOffer {
  const amount = getLoanAmount(type);
  const totalMonths = LOAN_BALANCE.loanTerms[type];
  const interestRate = LOAN_BALANCE.interestRates[type];
  const monthlyPayment = totalMonths > 0
    ? Math.ceil((amount * (1 + interestRate)) / totalMonths)
    : 0;

  return {
    id: `loan-offer-${type}`,
    type,
    amount,
    interestRate,
    monthlyPayment,
    totalMonths,
    description: getLoanDescription(type),
    requirements: getLoanRequirements(state, type),
    riskNote: getLoanRiskNote(type),
    available: true,
  };
}

function canTakeLoanByOffer(
  state: GameState,
  offer: LoanOffer,
): { canTake: boolean; reason?: string } {
  if (state.isGameOver || state.financialHealth.status === "bankrupt") {
    return { canTake: false, reason: "経営破綻状態では新規融資を利用できません。" };
  }

  const activeLoanCount = state.loans.filter((loan) => loan.status === "active").length;
  const totalDebt = calculateTotalDebt(state);

  if (offer.type !== "owner_injection" && activeLoanCount >= LOAN_BALANCE.maxActiveLoans) {
    return { canTake: false, reason: `activeな融資は最大${LOAN_BALANCE.maxActiveLoans}件までです。` };
  }

  if (
    offer.type !== "owner_injection" &&
    totalDebt + offer.amount > LOAN_BALANCE.maxTotalDebt
  ) {
    return { canTake: false, reason: "借入残高の上限を超えるため利用できません。" };
  }

  if (
    offer.type === "long_term" &&
    state.club.reputation < LOAN_BALANCE.minimumLongTermReputation &&
    state.club.sponsorPower < LOAN_BALANCE.minimumLongTermSponsorPower
  ) {
    return { canTake: false, reason: "評判またはスポンサー力が不足しています。" };
  }

  if (
    offer.type === "emergency" &&
    !["financial_crisis", "insolvency_warning", "insolvent"].includes(state.financialHealth.status)
  ) {
    return { canTake: false, reason: "緊急融資は財務危機時のみ利用できます。" };
  }

  if (
    offer.type === "regional_support" &&
    state.club.policy !== "local_first" &&
    state.club.fans < LOAN_BALANCE.minimumRegionalFans
  ) {
    return { canTake: false, reason: "地域密着方針、または一定以上のファン数が必要です。" };
  }

  if (
    offer.type === "owner_injection" &&
    state.loans.filter((loan) => loan.type === "owner_injection").length >=
      LOAN_BALANCE.ownerInjectionUseLimit
  ) {
    return { canTake: false, reason: "社長追加出資は使用回数の上限に達しています。" };
  }

  return { canTake: true };
}

function getLoanAmount(type: LoanType): number {
  const amounts: Record<LoanType, number> = {
    short_term: LOAN_BALANCE.shortTermAmount,
    long_term: LOAN_BALANCE.longTermAmount,
    emergency: LOAN_BALANCE.emergencyAmount,
    regional_support: LOAN_BALANCE.regionalSupportAmount,
    owner_injection: LOAN_BALANCE.ownerInjectionAmount,
  };

  return amounts[type];
}

function getLoanDescription(type: LoanType): string {
  const descriptions: Record<LoanType, string> = {
    short_term: "短期の資金繰りを補うための少額融資です。",
    long_term: "長期再建や設備投資に使える大きめの融資です。",
    emergency: "経営破綻を避けるための緊急融資です。",
    regional_support: "地域密着クラブを支援する低利の融資です。",
    owner_injection: "社長による追加出資です。返済はありませんが評判に影響します。",
  };

  return descriptions[type];
}

function getLoanRequirements(state: GameState, type: LoanType): string[] {
  if (type === "short_term") {
    return ["いつでも利用可能", "借入枠に空きがある"];
  }

  if (type === "long_term") {
    return [
      `評判${LOAN_BALANCE.minimumLongTermReputation}以上、またはスポンサー力${LOAN_BALANCE.minimumLongTermSponsorPower}以上`,
      `現在: 評判${state.club.reputation} / スポンサー力${state.club.sponsorPower}`,
    ];
  }

  if (type === "emergency") {
    return ["財務危機、債務超過警戒、債務超過のいずれか"];
  }

  if (type === "regional_support") {
    return [
      "地域密着方針、または一定以上のファン数",
      `現在: 方針${state.club.policy} / ファン${state.club.fans.toLocaleString()}人`,
    ];
  }

  return [`使用回数 ${LOAN_BALANCE.ownerInjectionUseLimit}回まで`];
}

function getLoanRiskNote(type: LoanType): string {
  const notes: Record<LoanType, string> = {
    short_term: "返済期間が短く、月次返済の負担がすぐに発生します。",
    long_term: "返済期間は長いですが、長期的な固定支出になります。",
    emergency: "利率が高く、危機回避後の収支を圧迫します。",
    regional_support: "低利ですが、地域支援に依存しすぎると成長投資が遅れる可能性があります。",
    owner_injection: "返済はありませんが、社長頼みの印象で評判が少し下がります。",
  };

  return notes[type];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
