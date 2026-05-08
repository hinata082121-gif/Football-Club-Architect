import {
  COACH_EXPERIENCE_PER_LEVEL,
  MATCH_BALANCE,
  MAX_CLUB_RATING,
  MAX_CONDITION,
  MIN_CLUB_RATING,
  MIN_CONDITION,
  TRAINING_MATCH_BALANCE,
} from "@/game/balance";
import { autoSelectSquadByCoach } from "@/game/coachSelectionEngine";
import { calculateMatchPower, generateMatchReport } from "@/game/matchEngine";
import { convertOpponentToMatchInput, getTrainingMatchOpponents } from "@/game/opponentEngine";
import {
  applyMatchExperienceToPlayers,
  applyYouthTrainingMatchExperience,
} from "@/game/playerDevelopmentEngine";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import { chance, randomInt } from "@/utils/random";
import type {
  ActionLog,
  FinanceLog,
  GameState,
  Match,
  MatchPowerBreakdown,
  MatchResult,
  OpponentClub,
  StatEffects,
  TrainingMatchPreview,
  TrainingMatchType,
} from "@/types/game";

export function canPlayTrainingMatch(state: GameState): boolean {
  if (state.club.actionPoints <= 0) {
    return false;
  }

  if (state.trainingMatchPlayedTurn === state.club.turn) {
    return false;
  }

  if (
    state.scheduledOfficialMatch &&
    state.scheduledOfficialMatch.turn === state.club.turn
  ) {
    return false;
  }

  return true;
}

export function playTrainingMatch(
  state: GameState,
  type: TrainingMatchType,
  opponent?: OpponentClub,
): GameState {
  if (!canPlayTrainingMatch(state)) {
    return {
      ...state,
      actionLogs: [
        createActionLog(state, "練習試合不可", "実行条件を満たしていません。AP、同月実行済み、または公式戦予定を確認してください。", {}),
        ...state.actionLogs,
      ],
    };
  }

  const selectedState = state.autoCoachSelectionEnabled ? autoSelectSquadByCoach(state) : state;
  const matchReadyState = recalculateClubTeamPower(selectedState);
  const balance = TRAINING_MATCH_BALANCE[type];
  const selectedOpponent = opponent ?? getTrainingMatchOpponents(matchReadyState, type)[0];
  const opponentInput = convertOpponentToMatchInput(selectedOpponent, "training");
  const opponentPower = opponentInput.opponentPower ?? Math.max(1, matchReadyState.club.teamPower + balance.opponentPowerModifier);
  const opponentName = opponentInput.opponentName ?? getTrainingOpponentName(type);
  const breakdown = calculateMatchPower(matchReadyState, opponentPower, true);
  const result = determineTrainingResult(type, breakdown.powerDifference);
  const { goalsFor, goalsAgainst } = generateTrainingScore(result, breakdown.powerDifference);
  const match: Match = {
    id: `training-${type}-${matchReadyState.club.turn}-${Date.now()}`,
    turn: matchReadyState.club.turn,
    year: matchReadyState.currentYear,
    month: matchReadyState.currentMonth,
    type: "training",
    opponentName,
    opponentClubId: opponentInput.opponentClubId,
    opponentOwnerName: opponentInput.opponentOwnerName,
    opponentClubLevel: opponentInput.opponentClubLevel,
    opponentPlayStyle: opponentInput.opponentPlayStyle,
    opponentPower,
    isHome: true,
    result,
    goalsFor,
    goalsAgainst,
    report: generateMatchReport({
      state: matchReadyState,
      opponentName,
      result,
      goalsFor,
      goalsAgainst,
      breakdown,
    }),
  };
  const effects = resolveTrainingEffects(type, result);
  const { nextState, appliedEffects } = applyTrainingEffects(matchReadyState, type, effects);
  const baseExperiencedState = applyMatchExperienceToPlayers(nextState, "training");
  const experiencedState =
    type === "youth"
      ? applyYouthTrainingMatchExperience(baseExperiencedState)
      : baseExperiencedState;
  const completedMatch = {
    ...match,
    postMatchEffects: appliedEffects,
  };
  const actionLog = createTrainingActionLog(
    experiencedState,
    completedMatch,
    type,
    breakdown,
    appliedEffects,
  );
  const financeLog = createFinanceLog(experiencedState, type, appliedEffects.money);

  return {
    ...experiencedState,
    matches: [completedMatch, ...experiencedState.matches],
    lastMatchReport: completedMatch.report,
    trainingMatchPlayedTurn: matchReadyState.club.turn,
    actionLogs: [actionLog, ...experiencedState.actionLogs],
    financeLogs: financeLog
      ? [financeLog, ...experiencedState.financeLogs]
      : experiencedState.financeLogs,
  };
}

export function getTrainingMatchPreview(
  state: GameState,
  type: TrainingMatchType,
): TrainingMatchPreview {
  const balance = TRAINING_MATCH_BALANCE[type];

  return {
    type,
    difficulty: getDifficultyLabel(type),
    purpose: getPurpose(type),
    opponentPower: Math.max(1, state.club.teamPower + balance.opponentPowerModifier),
    expectedRewards: {
      money: balance.money,
      fans: balance.fans,
      reputation: balance.reputation,
      teamPower: balance.teamPower,
      teamwork: balance.teamwork,
      condition: balance.condition,
      coachExperience: balance.coachExperience,
      actionPoints: -balance.actionPointCost,
    },
    conditionCost: Math.abs(Math.min(0, balance.condition)),
    canPlay: canPlayTrainingMatch(state),
  };
}

export function simulateTrainingMatch(state: GameState): { state: GameState; report: Match["report"] } {
  const nextState = playTrainingMatch(state, "local");

  return {
    state: nextState,
    report: nextState.lastMatchReport ?? {
      summary: "練習試合は実行されませんでした。",
      reasons: ["実行条件を満たしていません。"],
      positives: ["状態は変化していません。"],
      improvements: ["AP、公式戦予定、同月実行済みかを確認してください。"],
      scoreBreakdown: {
        teamPower: state.club.teamPower,
        teamwork: 0,
        condition: 0,
        coachLevel: state.coach.level,
        tactics: 0,
        inGameManagement: 0,
        motivation: 0,
        homeAdvantage: 0,
        luck: 0,
        total: state.club.teamPower,
        opponentPower: state.club.teamPower,
        opponentLuck: 0,
        opponentTotal: state.club.teamPower,
        powerDifference: 0,
      },
    },
  };
}

function determineTrainingResult(type: TrainingMatchType, powerDifference: number): MatchResult {
  const typeBias: Record<TrainingMatchType, number> = {
    weaker: 6,
    equal: 0,
    stronger: -6,
    local: 3,
    youth: 4,
  };
  const adjusted = powerDifference + typeBias[type];

  if (adjusted >= 4) {
    return "win";
  }
  if (adjusted <= -5) {
    return "lose";
  }

  return "draw";
}

function generateTrainingScore(
  result: MatchResult,
  powerDifference: number,
): { goalsFor: number; goalsAgainst: number } {
  const absDifference = Math.abs(powerDifference);

  if (result === "win") {
    const goalsFor = absDifference > MATCH_BALANCE.closePowerDifference ? randomInt(2, 3) : randomInt(1, 2);
    const goalsAgainst = randomInt(0, 1);
    return goalsFor <= goalsAgainst
      ? { goalsFor: goalsAgainst + 1, goalsAgainst }
      : { goalsFor, goalsAgainst };
  }

  if (result === "lose") {
    const goalsFor = randomInt(0, 1);
    const goalsAgainst = absDifference > MATCH_BALANCE.closePowerDifference ? randomInt(2, 3) : randomInt(1, 2);
    return goalsAgainst <= goalsFor
      ? { goalsFor, goalsAgainst: goalsFor + 1 }
      : { goalsFor, goalsAgainst };
  }

  const goals = randomInt(0, 2);
  return { goalsFor: goals, goalsAgainst: goals };
}

function resolveTrainingEffects(type: TrainingMatchType, result: MatchResult): StatEffects {
  const balance = TRAINING_MATCH_BALANCE[type];
  const resultMultiplier = result === "win" ? 1.15 : result === "draw" ? 1 : 0.85;
  const learningMultiplier = result === "lose" ? 1.15 : 1;
  const teamworkBonus = chance(type === "equal" || type === "stronger" ? 0.75 : 0.45) ? 1 : 0;

  return {
    money: balance.money,
    fans: Math.round(balance.fans * resultMultiplier),
    reputation: result === "lose" ? Math.max(0, balance.reputation) : balance.reputation,
    teamPower: Math.max(0, Math.round(balance.teamPower * learningMultiplier)),
    teamwork: Math.max(0, Math.round(balance.teamwork * learningMultiplier) + teamworkBonus),
    condition: balance.condition,
    coachExperience: Math.round(balance.coachExperience * learningMultiplier),
  };
}

function applyTrainingEffects(
  state: GameState,
  type: TrainingMatchType,
  effects: StatEffects,
): { nextState: GameState; appliedEffects: StatEffects } {
  const balance = TRAINING_MATCH_BALANCE[type];
  const nextMoney = state.club.money + (effects.money ?? 0);
  const nextFans = Math.max(0, state.club.fans + (effects.fans ?? 0));
  const nextReputation = clampRating(state.club.reputation + (effects.reputation ?? 0));
  const nextTeamPower = clampRating(state.club.teamPower + (effects.teamPower ?? 0));
  const nextTeamwork = clampRating(state.club.teamwork + (effects.teamwork ?? 0));
  const nextCondition = clamp(state.club.condition + (effects.condition ?? 0), MIN_CONDITION, MAX_CONDITION);
  const nextActionPoints = Math.max(0, state.club.actionPoints - balance.actionPointCost);
  const coachUpdate = applyCoachExperience(state, effects.coachExperience ?? 0);
  const stateBeforePowerRecalculation: GameState = {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
      fans: nextFans,
      reputation: nextReputation,
      teamPower: nextTeamPower,
      teamwork: nextTeamwork,
      condition: nextCondition,
      actionPoints: nextActionPoints,
    },
    coach: coachUpdate.coach,
  };
  const recalculatedState = recalculateClubTeamPower(stateBeforePowerRecalculation);

  return {
    nextState: recalculatedState,
    appliedEffects: {
      money: nextMoney - state.club.money,
      fans: nextFans - state.club.fans,
      reputation: nextReputation - state.club.reputation,
      teamPower: recalculatedState.club.teamPower - state.club.teamPower,
      teamwork: nextTeamwork - state.club.teamwork,
      condition: nextCondition - state.club.condition,
      actionPoints: nextActionPoints - state.club.actionPoints,
      coachExperience: coachUpdate.experienceDelta,
      coachLevel: coachUpdate.levelDelta,
    },
  };
}

function applyCoachExperience(state: GameState, experienceGain: number) {
  const totalExperience = state.coach.experience + experienceGain;
  const levelGain = Math.floor(totalExperience / COACH_EXPERIENCE_PER_LEVEL);
  const nextExperience = totalExperience % COACH_EXPERIENCE_PER_LEVEL;
  const developmentGain = levelGain + (experienceGain >= 15 ? 1 : 0);

  return {
    coach: {
      ...state.coach,
      level: state.coach.level + levelGain,
      experience: nextExperience,
      development: clampRating(state.coach.development + developmentGain),
      tactics: clampRating(state.coach.tactics + levelGain),
      inGameManagement: clampRating(state.coach.inGameManagement + levelGain),
      motivation: clampRating(state.coach.motivation + levelGain),
    },
    experienceDelta: experienceGain,
    levelDelta: levelGain,
  };
}

function createTrainingActionLog(
  state: GameState,
  match: Match,
  type: TrainingMatchType,
  breakdown: MatchPowerBreakdown,
  effects: StatEffects,
): ActionLog {
  return {
    id: `training-result-${match.id}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: `${getTypeLabel(type)}を実施`,
    reason: "公式大会に参加していない月でも育成と調整を進めるため。",
    result: `${match.report.summary} 練習試合のため公式成績には影響しません。戦力差は${breakdown.powerDifference}でした。`,
    effects,
  };
}

function createActionLog(state: GameState, actionName: string, result: string, effects: StatEffects): ActionLog {
  return {
    id: `training-unavailable-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName,
    reason: "練習試合の実行可否を確認したため。",
    result,
    effects,
  };
}

function createFinanceLog(
  state: GameState,
  type: TrainingMatchType,
  moneyChange: number | undefined,
): FinanceLog | null {
  if (!moneyChange) {
    return null;
  }

  return {
    id: `finance-training-${type}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "training_match",
    amount: moneyChange,
    description: `${getTypeLabel(type)}の収入`,
  };
}

function getTrainingOpponentName(type: TrainingMatchType): string {
  const names: Record<TrainingMatchType, string> = {
    weaker: "Regional B Team",
    equal: "Neighbor Club",
    stronger: "Premier Reserve",
    local: "Local Selection",
    youth: "Youth Academy XI",
  };

  return names[type];
}

function getTypeLabel(type: TrainingMatchType): string {
  const labels: Record<TrainingMatchType, string> = {
    weaker: "格下との練習試合",
    equal: "同格との練習試合",
    stronger: "格上との練習試合",
    local: "地域交流試合",
    youth: "若手育成試合",
  };

  return labels[type];
}

function getDifficultyLabel(type: TrainingMatchType): string {
  const labels: Record<TrainingMatchType, string> = {
    weaker: "低",
    equal: "標準",
    stronger: "高",
    local: "低め",
    youth: "育成向け",
  };

  return labels[type];
}

function getPurpose(type: TrainingMatchType): string {
  const purposes: Record<TrainingMatchType, string> = {
    weaker: "勝ち癖づくりと軽い調整",
    equal: "標準的な試合経験と連携確認",
    stronger: "格上相手からの学習と監督経験",
    local: "地域交流、ファン増加、少額収入",
    youth: "若手育成の代替として戦力と連携を微増",
  };

  return purposes[type];
}

function clampRating(value: number): number {
  return clamp(value, MIN_CLUB_RATING, MAX_CLUB_RATING);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
