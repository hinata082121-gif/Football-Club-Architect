import { TEAM_POWER_BALANCE, TRANSFER_BALANCE } from "@/game/balance";
import { generateContractAlerts } from "@/game/contractEngine";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import type { ActionLog, FinanceLog, GameState, Player, ScoutedPlayer } from "@/types/game";

export function canSignScoutedPlayer(
  state: GameState,
  scoutedPlayerId: string,
): { canSign: boolean; reason?: string } {
  const scoutedPlayer = state.scoutedPlayers.find((candidate) => candidate.id === scoutedPlayerId);

  if (!scoutedPlayer) {
    return { canSign: false, reason: "候補選手が見つかりません。" };
  }

  if (isScoutedPlayerExpired(state, scoutedPlayer)) {
    return { canSign: false, reason: "候補レポートの有効期限が切れています。" };
  }

  if (scoutedPlayer.player.status === "retired") {
    return { canSign: false, reason: "引退済みの選手は獲得できません。" };
  }

  if (state.players.length >= TRANSFER_BALANCE.maxPlayers) {
    return { canSign: false, reason: `所属選手数が上限${TRANSFER_BALANCE.maxPlayers}人に達しています。` };
  }

  const signingCost = calculateSigningCost(scoutedPlayer);

  if (state.club.money < signingCost) {
    return { canSign: false, reason: "資金が不足しています。" };
  }

  return { canSign: true };
}

export function signScoutedPlayer(state: GameState, scoutedPlayerId: string): GameState {
  const check = canSignScoutedPlayer(state, scoutedPlayerId);

  if (!check.canSign) {
    return state;
  }

  const scoutedPlayer = state.scoutedPlayers.find((candidate) => candidate.id === scoutedPlayerId);

  if (!scoutedPlayer) {
    return state;
  }

  const signingCost = calculateSigningCost(scoutedPlayer);
  const signedPlayer: Player = {
    ...scoutedPlayer.player,
    id: `signed-player-${state.club.turn}-${state.players.length + 1}-${Date.now()}`,
    status: getDefaultSignedStatus(state),
    joinedAtYear: state.currentYear,
    joinedAtMonth: state.currentMonth,
  };
  const nextMoney = state.club.money - signingCost;
  const stateBeforeRecalculation: GameState = {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
    },
    players: [...state.players, signedPlayer],
    scoutedPlayers: state.scoutedPlayers.filter((candidate) => candidate.id !== scoutedPlayerId),
  };
  const nextState = recalculateClubTeamPower(stateBeforeRecalculation);
  const teamPowerDelta = nextState.club.teamPower - state.club.teamPower;
  const actionLog = createActionLog({
    state: nextState,
    actionName: "選手獲得",
    reason: "スカウト候補を社長が最終承認したため。",
    result: `${signedPlayer.name}を${signingCost.toLocaleString()}円で獲得しました。起用状態は${getPlayerStatusLabel(signedPlayer.status)}です。`,
    effects: {
      money: -signingCost,
      teamPower: teamPowerDelta,
    },
  });
  const financeLog = createFinanceLog(
    nextState,
    "選手獲得費用",
    -signingCost,
  );

  return {
    ...nextState,
    contractAlerts: generateContractAlerts(nextState),
    actionLogs: [actionLog, ...nextState.actionLogs],
    financeLogs: [financeLog, ...nextState.financeLogs],
  };
}

export function canReleasePlayer(
  state: GameState,
  playerId: string,
): { canRelease: boolean; reason?: string } {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return { canRelease: false, reason: "所属選手が見つかりません。" };
  }

  if (player.status === "retired") {
    return { canRelease: false, reason: "引退済みの選手は放出できません。" };
  }

  if (state.players.length <= TRANSFER_BALANCE.minPlayers) {
    return { canRelease: false, reason: `最低所属選手数${TRANSFER_BALANCE.minPlayers}人を下回るため放出できません。` };
  }

  return { canRelease: true };
}

export function releasePlayer(state: GameState, playerId: string): GameState {
  const check = canReleasePlayer(state, playerId);

  if (!check.canRelease) {
    return state;
  }

  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player) {
    return state;
  }

  const releaseIncome = calculateReleaseIncome(player);
  const releasePenalty = calculateReleasePenalty(player);
  const netIncome = releaseIncome - releasePenalty;
  const stateBeforeRecalculation: GameState = {
    ...state,
    club: {
      ...state.club,
      money: Math.max(0, state.club.money + netIncome),
    },
    players: state.players.filter((candidate) => candidate.id !== playerId),
  };
  const nextState = recalculateClubTeamPower(stateBeforeRecalculation);
  const teamPowerDelta = nextState.club.teamPower - state.club.teamPower;
  const actionLog = createActionLog({
    state: nextState,
    actionName: "選手放出",
    reason: "所属選手の入れ替えと年俸整理を行うため。",
    result: `${player.name}を放出しました。収入${releaseIncome.toLocaleString()}円、違約金${releasePenalty.toLocaleString()}円、差引${netIncome.toLocaleString()}円です。`,
    effects: {
      money: netIncome,
      teamPower: teamPowerDelta,
    },
  });
  const financeLog = createFinanceLog(nextState, `${player.name}の放出収支`, netIncome);

  return {
    ...nextState,
    contractAlerts: generateContractAlerts(nextState),
    actionLogs: [actionLog, ...nextState.actionLogs],
    financeLogs: [financeLog, ...nextState.financeLogs],
  };
}

export function setPlayerTransferListed(
  state: GameState,
  playerId: string,
  transferListed: boolean,
): GameState {
  const player = state.players.find((candidate) => candidate.id === playerId);

  if (!player || player.status === "retired") {
    return state;
  }

  const nextStatus = transferListed ? "transfer_listed" : getDefaultRestoredStatus(state, playerId);
  const updatedPlayers = state.players.map((candidate) =>
    candidate.id === playerId
      ? {
          ...candidate,
          status: nextStatus,
        }
      : candidate,
  );
  const stateBeforeRecalculation: GameState = {
    ...state,
    players: updatedPlayers,
  };
  const nextState = recalculateClubTeamPower(stateBeforeRecalculation);
  const actionLog = createActionLog({
    state: nextState,
    actionName: transferListed ? "放出候補設定" : "放出候補解除",
    reason: "所属選手の入れ替え方針を整理するため。",
    result: transferListed
      ? `${player.name}を放出候補に設定しました。`
      : `${player.name}の放出候補設定を解除しました。`,
    effects: {
      teamPower: nextState.club.teamPower - state.club.teamPower,
    },
  });

  return {
    ...nextState,
    contractAlerts: generateContractAlerts(nextState),
    actionLogs: [actionLog, ...nextState.actionLogs],
  };
}

export function calculateSigningCost(scoutedPlayer: ScoutedPlayer): number {
  const baseCost = Math.max(
    scoutedPlayer.estimatedMarketValue,
    scoutedPlayer.player.marketValue,
  ) * TRANSFER_BALANCE.signingCostRate;
  const focusMultiplier = TRANSFER_BALANCE.focusSigningCostMultiplier[scoutedPlayer.focus];
  const potentialPremium = scoutedPlayer.estimatedPotential >= 68 ? 1.08 : 1;

  return roundTo(
    clamp(
      baseCost * focusMultiplier * potentialPremium,
      TRANSFER_BALANCE.signingCostMin,
      TRANSFER_BALANCE.signingCostMax,
    ),
    TRANSFER_BALANCE.signingCostRoundTo,
  );
}

export function calculateReleaseIncome(player: Player): number {
  const contractMultiplier =
    player.contractMonths <= 6 ? TRANSFER_BALANCE.shortContractIncomeMultiplier : 1;

  return roundTo(
    player.marketValue * TRANSFER_BALANCE.releaseIncomeRate * contractMultiplier,
    TRANSFER_BALANCE.releaseRoundTo,
  );
}

export function calculateReleasePenalty(player: Player): number {
  if (player.contractMonths <= 18) {
    return 0;
  }

  const penalty =
    player.salary * TRANSFER_BALANCE.longContractPenaltySalaryMonths +
    player.marketValue * TRANSFER_BALANCE.releasePenaltyRate * 0.1;

  return roundTo(
    Math.min(penalty, TRANSFER_BALANCE.releasePenaltyMax),
    TRANSFER_BALANCE.releaseRoundTo,
  );
}

function isScoutedPlayerExpired(state: GameState, scoutedPlayer: ScoutedPlayer): boolean {
  return (
    scoutedPlayer.expiresAtYear * 12 + scoutedPlayer.expiresAtMonth <
    state.currentYear * 12 + state.currentMonth
  );
}

function getDefaultSignedStatus(state: GameState): Player["status"] {
  const benchCount = state.players.filter((player) => player.status === "bench").length;

  return benchCount < TEAM_POWER_BALANCE.expectedBenchCount ? "bench" : "reserve";
}

function getDefaultRestoredStatus(state: GameState, playerId: string): Player["status"] {
  const benchCount = state.players.filter(
    (player) => player.id !== playerId && player.status === "bench",
  ).length;

  return benchCount < TEAM_POWER_BALANCE.expectedBenchCount ? "bench" : "reserve";
}

function createActionLog(input: {
  state: GameState;
  actionName: string;
  reason: string;
  result: string;
  effects: ActionLog["effects"];
}): ActionLog {
  return {
    id: `transfer-${input.actionName}-${input.state.club.turn}-${Date.now()}`,
    turn: input.state.club.turn,
    year: input.state.currentYear,
    month: input.state.currentMonth,
    actorType: "player",
    actorName: input.state.ownerName,
    actionName: input.actionName,
    reason: input.reason,
    result: input.result,
    effects: input.effects,
  };
}

function createFinanceLog(state: GameState, description: string, amount: number): FinanceLog {
  return {
    id: `finance-transfer-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "other",
    amount,
    description,
  };
}

function getPlayerStatusLabel(status: Player["status"]): string {
  const labels: Record<Player["status"], string> = {
    starting: "スタメン",
    bench: "ベンチ",
    reserve: "控え",
    injured: "負傷中",
    transfer_listed: "放出候補",
    leaving: "退団予定",
    retired: "引退",
  };

  return labels[status];
}

function roundTo(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
