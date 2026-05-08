import { CONTRACT_BALANCE } from "@/game/balance";
import { calculatePlayerSalary } from "@/game/playerGenerator";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import { chance } from "@/utils/random";
import type {
  ActionLog,
  ContractAlert,
  FinanceLog,
  GameState,
  Player,
} from "@/types/game";

type RenewalMonths = 12 | 24 | 36;

export function updatePlayerContractsMonthly(state: GameState): GameState {
  const decreasedPlayers = decreaseContractMonths(state.players);
  const contractState: GameState = {
    ...state,
    players: decreasedPlayers.map((player) => ({
      ...player,
      retirementRisk: calculateRetirementRisk(player),
      wantsRenewal:
        player.contractMonths <= CONTRACT_BALANCE.expiringSoonMonths
          ? true
          : player.wantsRenewal,
    })),
  };
  const retirementState = processRetirementRisk(contractState);
  const recalculatedState = recalculateClubTeamPower(retirementState);
  const alerts = generateContractAlerts(recalculatedState);
  const contractLog = createContractMonthlyLog(state, recalculatedState, alerts);

  return {
    ...recalculatedState,
    contractAlerts: alerts,
    actionLogs: contractLog
      ? [contractLog, ...recalculatedState.actionLogs]
      : recalculatedState.actionLogs,
  };
}

export function decreaseContractMonths(players: Player[]): Player[] {
  return players.map((player) => {
    if (player.status === "retired" || player.status === "leaving") {
      return player;
    }

    return {
      ...player,
      contractMonths: Math.max(0, player.contractMonths - 1),
    };
  });
}

export function generateContractAlerts(state: GameState): ContractAlert[] {
  const totalSalary = calculateTotalPlayerSalary(state.players);

  return state.players.flatMap((player) => {
    const alerts: ContractAlert[] = [];

    if (player.status === "retired") {
      return alerts;
    }

    if (player.contractMonths === 0) {
      alerts.push({
        playerId: player.id,
        playerName: player.name,
        type: "expired",
        message: `${player.name}の契約が満了しています。今月中の更新または放出判断が必要です。`,
        severity: "danger",
      });
    } else if (player.contractMonths <= CONTRACT_BALANCE.expiringSoonMonths) {
      alerts.push({
        playerId: player.id,
        playerName: player.name,
        type: "expiring_soon",
        message: `${player.name}の契約は残り${player.contractMonths}か月です。`,
        severity: "warning",
      });
    } else if (player.wantsRenewal) {
      alerts.push({
        playerId: player.id,
        playerName: player.name,
        type: "renewal_recommended",
        message: `${player.name}は契約更新の打診を待っています。`,
        severity: "info",
      });
    }

    if (player.salary >= CONTRACT_BALANCE.highSalaryThreshold) {
      alerts.push({
        playerId: player.id,
        playerName: player.name,
        type: "high_salary",
        message: `${player.name}の月額年俸が高く、人件費に影響しています。`,
        severity: totalSalary > state.club.money * CONTRACT_BALANCE.salaryBurdenWarningRatio
          ? "warning"
          : "info",
      });
    }

    if ((player.retirementRisk ?? 0) >= 35 || player.announcedRetirement) {
      alerts.push({
        playerId: player.id,
        playerName: player.name,
        type: "retirement_risk",
        message: player.announcedRetirement
          ? `${player.name}は引退予定を表明しています。代替選手を準備しましょう。`
          : `${player.name}は引退リスクが高まっています。`,
        severity: player.announcedRetirement ? "danger" : "warning",
      });
    }

    return alerts;
  });
}

export function calculateTotalPlayerSalary(players: Player[]): number {
  return players
    .filter((player) => player.status !== "retired" && player.status !== "leaving")
    .reduce((total, player) => total + player.salary, 0);
}

export function applyMonthlyPlayerSalaries(state: GameState): GameState {
  const totalSalary = calculateTotalPlayerSalary(state.players);

  if (totalSalary <= 0) {
    return state;
  }

  const nextMoney = state.club.money - totalSalary;
  const financeLog: FinanceLog = {
    id: `finance-player-salary-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "player_salary",
    amount: -totalSalary,
    description: "選手月額年俸",
  };
  const burdenWarning =
    totalSalary > Math.max(1, state.club.money) * CONTRACT_BALANCE.salaryBurdenWarningRatio;
  const actionLog = burdenWarning
    ? createActionLog({
        state,
        actionName: "選手年俸負担警告",
        reason: "選手年俸がクラブ資金に対して重くなっているため。",
        result: `今月の選手年俸は${totalSalary.toLocaleString()}円です。契約更新や放出候補の整理を検討できます。`,
        effects: { money: -totalSalary },
      })
    : null;

  return {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
    },
    financeLogs: [financeLog, ...state.financeLogs],
    actionLogs: actionLog ? [actionLog, ...state.actionLogs] : state.actionLogs,
  };
}

export function calculateRetirementRisk(player: Player): number {
  const balance = CONTRACT_BALANCE.retirement;

  if (player.age < balance.startAge) {
    return 0;
  }

  const ageRisk =
    balance.baseRiskAtStartAge + (player.age - balance.startAge) * balance.ageRiskStep;
  const conditionBonus = player.condition < 55 ? balance.lowConditionBonus : 0;
  const moraleReduction = player.morale >= 72 ? balance.highMoraleReduction : 0;
  const overallReduction = player.overall >= 55 ? balance.highOverallReduction : 0;
  const highAgeBonus = player.age >= balance.highRiskAge ? 12 : 0;

  return clamp(ageRisk + conditionBonus + highAgeBonus - moraleReduction - overallReduction, 0, 95);
}

export function processRetirementRisk(state: GameState): GameState {
  const logs: ActionLog[] = [];
  const players = state.players.map((player) => {
    const retirementRisk = calculateRetirementRisk(player);

    if (player.status === "retired" || player.status === "leaving") {
      return {
        ...player,
        retirementRisk,
      };
    }

    if (player.announcedRetirement && player.contractMonths === 0) {
      logs.push(
        createActionLog({
          state,
          actionName: "選手引退",
          reason: "引退予定選手の契約が満了したため。",
          result: `${player.name}が現役を引退しました。長く貢献した選手の代替を準備しましょう。`,
          effects: {},
        }),
      );

      return {
        ...player,
        status: "retired" as const,
        retirementRisk,
      };
    }

    if (player.announcedRetirement || retirementRisk <= 0) {
      return {
        ...player,
        retirementRisk,
      };
    }

    const announcementChance = Math.min(
      CONTRACT_BALANCE.retirement.maxMonthlyAnnouncementChance,
      (retirementRisk / 100) * CONTRACT_BALANCE.retirement.monthlyAnnouncementScale,
    );

    if (!chance(announcementChance)) {
      return {
        ...player,
        retirementRisk,
      };
    }

    logs.push(
      createActionLog({
        state,
        actionName: "引退予定の表明",
        reason: "高齢選手の引退リスク判定により、事前予告が発生したため。",
        result: `${player.name}が今季限りでの引退意向を示しました。契約満了までは在籍し、世代交代の猶予があります。`,
        effects: {},
      }),
    );

    return {
      ...player,
      retirementRisk,
      announcedRetirement: true,
    };
  });

  return {
    ...state,
    players,
    actionLogs: [...logs, ...state.actionLogs],
  };
}

export function renewPlayerContract(
  state: GameState,
  playerId: string,
  months: number,
): GameState {
  const check = canRenewPlayerContract(state, playerId, months);

  if (!check.canRenew || !check.cost) {
    return state;
  }

  const renewalMonths = months as RenewalMonths;
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return state;
  }

  const nextSalary = calculateRenewedSalary(player, renewalMonths);
  const updatedPlayers = state.players.map((candidate) =>
    candidate.id === playerId
      ? {
          ...candidate,
          contractMonths: Math.max(candidate.contractMonths, 0) + renewalMonths,
          salary: nextSalary,
          wantsRenewal: false,
        }
      : candidate,
  );
  const nextMoney = state.club.money - check.cost;
  const nextState = recalculateClubTeamPower({
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
    },
    players: updatedPlayers,
  });
  const alerts = generateContractAlerts(nextState);
  const actionLog = createActionLog({
    state: nextState,
    actionName: "選手契約更新",
    reason: "契約満了による退団を防ぎ、戦力を維持するため。",
    result: `${player.name}と${renewalMonths}か月の契約更新を行いました。月額年俸は${nextSalary.toLocaleString()}円です。`,
    effects: { money: -check.cost },
  });
  const financeLog: FinanceLog = {
    id: `finance-renewal-${player.id}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "other",
    amount: -check.cost,
    description: `${player.name}の契約更新費用`,
  };

  return {
    ...nextState,
    contractAlerts: alerts,
    actionLogs: [actionLog, ...nextState.actionLogs],
    financeLogs: [financeLog, ...nextState.financeLogs],
  };
}

export function canRenewPlayerContract(
  state: GameState,
  playerId: string,
  months: number,
): { canRenew: boolean; reason?: string; cost?: number } {
  if (!isRenewalMonths(months)) {
    return { canRenew: false, reason: "更新期間は12/24/36か月のみです。" };
  }

  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return { canRenew: false, reason: "選手が見つかりません。" };
  }

  if (player.status === "retired" || player.status === "leaving") {
    return { canRenew: false, reason: "退団済みまたは引退済みの選手は更新できません。" };
  }

  if (player.announcedRetirement) {
    return { canRenew: false, reason: "引退予定を表明しているため更新できません。" };
  }

  const cost = calculateRenewalCost(player, months);

  if (state.club.money < cost) {
    return { canRenew: false, reason: "資金が不足しています。", cost };
  }

  return { canRenew: true, cost };
}

function calculateRenewalCost(player: Player, months: RenewalMonths): number {
  const potentialPremium = player.potential >= 65 ? 1.15 : player.potential >= 58 ? 1.08 : 1;
  const primePremium = player.age >= 24 && player.age <= 29 ? 1.1 : 1;
  const veteranDiscount = player.age >= 34 ? 0.78 : player.age >= 30 ? 0.9 : 1;
  const moralePremium = player.morale >= 75 ? 1.06 : 1;
  const rawCost =
    player.salary *
    months *
    CONTRACT_BALANCE.renewalCostRate *
    potentialPremium *
    primePremium *
    veteranDiscount *
    moralePremium;

  return roundTo(
    clamp(rawCost, CONTRACT_BALANCE.renewalCostMin, CONTRACT_BALANCE.renewalCostMax),
    CONTRACT_BALANCE.renewalRoundTo,
  );
}

function calculateRenewedSalary(player: Player, months: RenewalMonths): number {
  const recalculatedSalary = calculatePlayerSalary(player);
  const increaseRate = CONTRACT_BALANCE.salaryIncreaseRate[months];

  return Math.max(player.salary, roundTo(recalculatedSalary * (1 + increaseRate), 1_000));
}

function createContractMonthlyLog(
  previousState: GameState,
  nextState: GameState,
  alerts: ContractAlert[],
): ActionLog | null {
  const expiringCount = alerts.filter((alert) => alert.type === "expiring_soon").length;
  const expiredCount = alerts.filter((alert) => alert.type === "expired").length;
  const retirementCount = alerts.filter((alert) => alert.type === "retirement_risk").length;

  if (expiringCount === 0 && expiredCount === 0 && retirementCount === 0) {
    return null;
  }

  return createActionLog({
    state: nextState,
    actionName: "契約・引退リスク確認",
    reason: "月次処理で契約残り月数と引退リスクを更新したため。",
    result: `契約注意${expiringCount}人、契約満了${expiredCount}人、引退リスク${retirementCount}人を確認しました。`,
    effects: {
      teamPower: nextState.club.teamPower - previousState.club.teamPower,
    },
  });
}

function createActionLog(input: {
  state: GameState;
  actionName: string;
  reason: string;
  result: string;
  effects: ActionLog["effects"];
}): ActionLog {
  return {
    id: `contract-${input.actionName}-${input.state.club.turn}-${Date.now()}`,
    turn: input.state.club.turn,
    year: input.state.currentYear,
    month: input.state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: input.actionName,
    reason: input.reason,
    result: input.result,
    effects: input.effects,
  };
}

function isRenewalMonths(months: number): months is RenewalMonths {
  return months === 12 || months === 24 || months === 36;
}

function roundTo(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
