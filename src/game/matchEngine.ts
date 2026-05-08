import {
  COACH_EXPERIENCE_PER_LEVEL,
  MATCH_BALANCE,
  MAX_CLUB_RATING,
  MAX_CONDITION,
  MIN_CLUB_RATING,
  MIN_CONDITION,
} from "@/game/balance";
import { autoSelectSquadByCoach } from "@/game/coachSelectionEngine";
import { convertOpponentToMatchInput, findOfficialMatchOpponent } from "@/game/opponentEngine";
import { applyMatchExperienceToPlayers } from "@/game/playerDevelopmentEngine";
import {
  getTeamPowerBreakdown,
  recalculateClubTeamPower,
} from "@/game/teamPowerEngine";
import { advanceGameMonth, formatYearMonth } from "@/utils/date";
import { chance, randomInt } from "@/utils/random";
import type {
  ActionLog,
  FinanceLog,
  GameState,
  Match,
  MatchPowerBreakdown,
  MatchReport,
  MatchResult,
  MatchType,
  ScoreBreakdown,
  StatEffects,
} from "@/types/game";

interface MatchReportParams {
  state: GameState;
  opponentName: string;
  result: MatchResult;
  goalsFor: number;
  goalsAgainst: number;
  breakdown: MatchPowerBreakdown;
}

export function simulateMatch(
  state: GameState,
  matchInput: Partial<Match>,
): { state: GameState; match: Match } {
  const selectedState = state.autoCoachSelectionEnabled ? autoSelectSquadByCoach(state) : state;
  const matchReadyState = recalculateClubTeamPower(selectedState);
  const opponentPower = matchInput.opponentPower ?? matchReadyState.club.teamPower;
  const isHome = matchInput.isHome ?? true;
  const opponentName = matchInput.opponentName ?? "Prototype FC";
  const type: MatchType = matchInput.type ?? "league";
  const breakdown = calculateMatchPower(matchReadyState, opponentPower, isHome);
  const result = determineResult(breakdown.powerDifference);
  const { goalsFor, goalsAgainst } = generateScore(result, breakdown.powerDifference);
  const report = generateMatchReport({
    state: matchReadyState,
    opponentName,
    result,
    goalsFor,
    goalsAgainst,
    breakdown,
  });
  const match: Match = {
    id: matchInput.id ?? `match-${matchReadyState.club.turn}-${Date.now()}`,
    turn: matchInput.turn ?? matchReadyState.club.turn,
    year: matchInput.year ?? matchReadyState.currentYear,
    month: matchInput.month ?? matchReadyState.currentMonth,
    type,
    opponentName,
    opponentClubId: matchInput.opponentClubId,
    opponentOwnerName: matchInput.opponentOwnerName,
    opponentClubLevel: matchInput.opponentClubLevel,
    opponentPlayStyle: matchInput.opponentPlayStyle,
    opponentPower,
    isHome,
    result,
    goalsFor,
    goalsAgainst,
    report,
  };
  const { nextState, appliedEffects } = applyPostMatchEffects(matchReadyState, result);
  const experiencedState = applyMatchExperienceToPlayers(nextState, type);
  const completedMatch = {
    ...match,
    postMatchEffects: appliedEffects,
  };
  const actionLog = createMatchActionLog(experiencedState, completedMatch, appliedEffects);
  const financeLog = createMatchFinanceLog(experiencedState, completedMatch, appliedEffects.money);

  return {
    state: {
      ...experiencedState,
      matches: [completedMatch, ...experiencedState.matches],
      lastMatchReport: report,
      scheduledOfficialMatch:
        matchReadyState.scheduledOfficialMatch?.id === matchInput.id
          ? null
          : matchReadyState.scheduledOfficialMatch,
      hasEnteredOfficialCompetition:
        matchReadyState.scheduledOfficialMatch?.id === matchInput.id
          ? false
          : matchReadyState.hasEnteredOfficialCompetition,
      actionLogs: [actionLog, ...experiencedState.actionLogs],
      financeLogs: financeLog
        ? [financeLog, ...experiencedState.financeLogs]
        : experiencedState.financeLogs,
    },
    match: completedMatch,
  };
}

export function canEnterOfficialCompetition(state: GameState): boolean {
  return !state.hasEnteredOfficialCompetition && state.club.money >= MATCH_BALANCE.officialEntryFee;
}

export function enterOfficialCompetition(state: GameState): GameState {
  if (!canEnterOfficialCompetition(state)) {
    return state;
  }

  const scheduledTurn = state.club.turn + 1;
  const scheduledDate = advanceGameMonth(state.currentYear, state.currentMonth);
  const opponent = findOfficialMatchOpponent(state);
  const opponentInput = convertOpponentToMatchInput(opponent, "league");
  const opponentPower = Math.max(
    1,
    (opponentInput.opponentPower ?? state.club.teamPower) +
      randomInt(
        -Math.floor(MATCH_BALANCE.officialOpponentVariance / 2),
        Math.floor(MATCH_BALANCE.officialOpponentVariance / 2),
      ),
  );
  const scheduledOfficialMatch: Match = {
    id: `official-league-${scheduledTurn}-${Date.now()}`,
    turn: scheduledTurn,
    year: scheduledDate.year,
    month: scheduledDate.month,
    type: "league",
    opponentName: opponent.clubName,
    opponentClubId: opponent.id,
    opponentOwnerName: opponent.ownerName,
    opponentClubLevel: opponent.clubLevel,
    opponentPlayStyle: opponent.playStyle,
    opponentPower,
    isHome: true,
    result: "pending",
    goalsFor: 0,
    goalsAgainst: 0,
    report: createPendingMatchReport(state, opponentPower),
  };
  const nextMoney = state.club.money - MATCH_BALANCE.officialEntryFee;
  const actionLog: ActionLog = {
    id: `official-entry-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: "公式戦エントリー",
    reason: "簡易リーグ戦に参加し、公式戦報酬とクラブ成長を狙うため。",
    result: `参加費${MATCH_BALANCE.officialEntryFee.toLocaleString()}円を支払い、${formatYearMonth(scheduledDate.year, scheduledDate.month)}に${scheduledOfficialMatch.opponentName}（${opponent.ownerName}）戦を予定しました。`,
    effects: {
      money: -MATCH_BALANCE.officialEntryFee,
    },
  };
  const financeLog: FinanceLog = {
    id: `finance-official-entry-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "other",
    amount: -MATCH_BALANCE.officialEntryFee,
    description: "簡易リーグ戦エントリー費",
  };

  return {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
    },
    hasEnteredOfficialCompetition: true,
    scheduledOfficialMatch,
    actionLogs: [actionLog, ...state.actionLogs],
    financeLogs: [financeLog, ...state.financeLogs],
  };
}

export function calculateMatchPower(
  state: GameState,
  opponentPower: number,
  isHome: boolean,
): MatchPowerBreakdown {
  const teamPowerBreakdown = getTeamPowerBreakdown(state);
  const teamPower = teamPowerBreakdown.finalTeamPower;
  const teamworkBonus = Math.round(state.club.teamwork * MATCH_BALANCE.teamworkWeight);
  const conditionBonus = Math.round((state.club.condition - 50) * MATCH_BALANCE.conditionWeight);
  const coachLevelBonus = Math.round(state.coach.level * MATCH_BALANCE.coachLevelWeight);
  const tacticsBonus = Math.round(state.coach.tactics * MATCH_BALANCE.tacticsWeight);
  const inGameManagementBonus = Math.round(
    state.coach.inGameManagement * MATCH_BALANCE.inGameManagementWeight,
  );
  const motivationBonus = Math.round(state.coach.motivation * MATCH_BALANCE.motivationWeight);
  const homeBonus = isHome ? MATCH_BALANCE.homeAdvantage : 0;
  const luck = randomInt(-MATCH_BALANCE.luckRange, MATCH_BALANCE.luckRange);
  const opponentLuck = randomInt(-MATCH_BALANCE.luckRange, MATCH_BALANCE.luckRange);
  const clubMatchPower =
    teamPower +
    teamworkBonus +
    conditionBonus +
    coachLevelBonus +
    tacticsBonus +
    inGameManagementBonus +
    motivationBonus +
    homeBonus +
    luck;
  const opponentMatchPower = opponentPower + opponentLuck;

  return {
    clubMatchPower,
    opponentMatchPower,
    teamPower,
    teamPowerBreakdown,
    teamworkBonus,
    conditionBonus,
    coachLevelBonus,
    tacticsBonus,
    inGameManagementBonus,
    motivationBonus,
    homeBonus,
    luck,
    opponentBasePower: opponentPower,
    opponentLuck,
    powerDifference: clubMatchPower - opponentMatchPower,
  };
}

export function generateMatchReport(params: MatchReportParams): MatchReport {
  const { state, opponentName, result, goalsFor, goalsAgainst, breakdown } = params;
  const summary = `${opponentName}戦は${goalsFor}-${goalsAgainst}で${getResultLabel(result)}でした。`;
  const reasons = createReasons(state, breakdown, result);
  const positives = createPositives(state, breakdown, result);
  const improvements = createImprovements(state, breakdown, result);
  const recommendedActions = createRecommendedActions(state, breakdown, result);

  return {
    summary,
    reasons,
    positives,
    improvements,
    recommendedActions,
    scoreBreakdown: toScoreBreakdown(breakdown),
  };
}

function determineResult(powerDifference: number): MatchResult {
  if (powerDifference >= 4) {
    return "win";
  }
  if (powerDifference <= -4) {
    return "lose";
  }

  return "draw";
}

function generateScore(
  result: MatchResult,
  powerDifference: number,
): { goalsFor: number; goalsAgainst: number } {
  const absDifference = Math.abs(powerDifference);

  if (result === "win") {
    const goalsFor = absDifference >= MATCH_BALANCE.decisivePowerDifference
      ? randomInt(2, 4)
      : randomInt(1, 3);
    const goalsAgainst = absDifference >= MATCH_BALANCE.decisivePowerDifference
      ? randomInt(0, 1)
      : randomInt(0, 2);
    return ensureResultScore(result, goalsFor, goalsAgainst);
  }

  if (result === "lose") {
    const goalsFor = absDifference >= MATCH_BALANCE.decisivePowerDifference
      ? randomInt(0, 1)
      : randomInt(0, 2);
    const goalsAgainst = absDifference >= MATCH_BALANCE.decisivePowerDifference
      ? randomInt(2, 4)
      : randomInt(1, 3);
    return ensureResultScore(result, goalsFor, goalsAgainst);
  }

  const drawGoals = absDifference <= MATCH_BALANCE.closePowerDifference ? randomInt(0, 2) : randomInt(0, 1);
  return { goalsFor: drawGoals, goalsAgainst: drawGoals };
}

function ensureResultScore(
  result: MatchResult,
  goalsFor: number,
  goalsAgainst: number,
): { goalsFor: number; goalsAgainst: number } {
  if (result === "win" && goalsFor <= goalsAgainst) {
    return { goalsFor: goalsAgainst + 1, goalsAgainst };
  }

  if (result === "lose" && goalsAgainst <= goalsFor) {
    return { goalsFor, goalsAgainst: goalsFor + 1 };
  }

  return { goalsFor, goalsAgainst };
}

function applyPostMatchEffects(
  state: GameState,
  result: MatchResult,
): { nextState: GameState; appliedEffects: StatEffects } {
  const resultEffects = getResultEffects(result);
  const teamworkGain = chance(MATCH_BALANCE.teamworkGainChance)
    ? MATCH_BALANCE.teamworkGainOnMatch
    : 0;
  const nextCondition = clamp(
    state.club.condition + resultEffects.condition,
    MIN_CONDITION,
    MAX_CONDITION,
  );
  const nextTeamwork = clampRating(state.club.teamwork + teamworkGain);
  const nextReputation = clampRating(state.club.reputation + resultEffects.reputation);
  const nextFans = Math.max(0, state.club.fans + resultEffects.fans);
  const nextMoney = state.club.money + resultEffects.money;
  const coachUpdate = applyCoachExperience(state);
  const stateBeforePowerRecalculation: GameState = {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
      fans: nextFans,
      reputation: nextReputation,
      condition: nextCondition,
      teamwork: nextTeamwork,
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
      condition: nextCondition - state.club.condition,
      teamwork: nextTeamwork - state.club.teamwork,
      teamPower: recalculatedState.club.teamPower - state.club.teamPower,
      coachExperience: coachUpdate.experienceDelta,
      coachLevel: coachUpdate.levelDelta,
    },
  };
}

function getResultEffects(result: MatchResult): Required<Pick<StatEffects, "money" | "fans" | "reputation" | "condition">> {
  if (result === "win") {
    return {
      money: MATCH_BALANCE.winMoneyGain,
      fans: MATCH_BALANCE.winFansGain,
      reputation: MATCH_BALANCE.winReputationGain,
      condition: -MATCH_BALANCE.conditionLossPerMatch,
    };
  }

  if (result === "draw") {
    return {
      money: MATCH_BALANCE.drawMoneyGain,
      fans: MATCH_BALANCE.drawFansGain,
      reputation: MATCH_BALANCE.drawReputationGain,
      condition: -MATCH_BALANCE.conditionLossPerMatch,
    };
  }

  return {
    money: MATCH_BALANCE.lossMoneyGain,
    fans: MATCH_BALANCE.lossFansChange,
    reputation: MATCH_BALANCE.lossReputationChange,
    condition: -MATCH_BALANCE.conditionLossPerMatch,
  };
}

function applyCoachExperience(state: GameState) {
  const totalExperience = state.coach.experience + MATCH_BALANCE.coachExperienceGain;
  const levelGain = Math.floor(totalExperience / COACH_EXPERIENCE_PER_LEVEL);
  const nextExperience = totalExperience % COACH_EXPERIENCE_PER_LEVEL;

  return {
    coach: {
      ...state.coach,
      level: state.coach.level + levelGain,
      experience: nextExperience,
      tactics: clampRating(state.coach.tactics + levelGain),
      playerSelection: clampRating(state.coach.playerSelection + levelGain),
      inGameManagement: clampRating(state.coach.inGameManagement + levelGain),
      development: clampRating(state.coach.development + levelGain),
      motivation: clampRating(state.coach.motivation + levelGain),
      charisma: clampRating(state.coach.charisma + levelGain),
      aiJudgment: clampRating(state.coach.aiJudgment + levelGain),
    },
    experienceDelta: MATCH_BALANCE.coachExperienceGain,
    levelDelta: levelGain,
  };
}

function createReasons(
  state: GameState,
  breakdown: MatchPowerBreakdown,
  result: MatchResult,
): string[] {
  const reasons: string[] = [];

  if (state.club.teamPower < breakdown.opponentBasePower) {
    reasons.push("相手との純粋な戦力差が試合全体に影響しました。");
  }
  if (state.club.condition < 55) {
    reasons.push("コンディション不足により後半の運動量が落ちました。");
  }
  if (state.club.teamwork < 45) {
    reasons.push("連携不足で攻守の切り替えにズレが出ました。");
  }
  if (state.coach.inGameManagement < 35) {
    reasons.push("試合中の修正や交代判断に伸びしろがありました。");
  }
  if (state.coach.tactics < 35) {
    reasons.push("相手戦術への対応力がまだ十分ではありません。");
  }
  if (breakdown.luck < -6) {
    reasons.push("不運な流れもありましたが、基礎能力の改善で吸収できる範囲です。");
  }

  if (reasons.length === 0) {
    reasons.push(
      result === "win"
        ? "戦力、連携、コンディションが噛み合い、優位に試合を進めました。"
        : "大きな弱点は出ませんでしたが、細部の積み重ねが結果を左右しました。",
    );
  }

  return reasons;
}

function createPositives(
  state: GameState,
  breakdown: MatchPowerBreakdown,
  result: MatchResult,
): string[] {
  const positives: string[] = [];

  if (state.club.teamPower >= breakdown.opponentBasePower) {
    positives.push("戦力面では相手と十分に戦える水準でした。");
  }
  if (state.club.teamwork >= 50) {
    positives.push("チーム連携が試合内容を安定させました。");
  }
  if (state.club.condition >= 70) {
    positives.push("コンディション管理が良く、最後まで運動量を保てました。");
  }
  if (state.coach.motivation >= 40) {
    positives.push("監督のモチベートにより選手の集中力が維持されました。");
  }
  if (result !== "lose") {
    positives.push("勝点につながる結果を残し、ファンと評判に良い影響がありました。");
  }

  if (positives.length === 0) {
    positives.push("敗戦でも監督経験値と試合経験を得られました。次の改善材料になります。");
  }

  return positives;
}

function createImprovements(
  state: GameState,
  breakdown: MatchPowerBreakdown,
  result: MatchResult,
): string[] {
  const improvements: string[] = [];

  if (state.club.teamPower < breakdown.opponentBasePower) {
    improvements.push("選手補強やスカウト活動でチーム戦力を底上げしましょう。");
  }
  if (state.club.condition < 65) {
    improvements.push("休養指示や施設整備でコンディションを戻しましょう。");
  }
  if (state.club.teamwork < 55) {
    improvements.push("連携強化や分析スタッフの活用でチームワークを高めましょう。");
  }
  if (state.coach.tactics < 40 || state.coach.inGameManagement < 40) {
    improvements.push("監督研修や戦術レビューで試合中の対応力を伸ばしましょう。");
  }
  if (result === "lose" && breakdown.powerDifference > -MATCH_BALANCE.closePowerDifference) {
    improvements.push("僅差の敗戦です。小さな改善で次は勝ち切れる可能性があります。");
  }

  if (improvements.length === 0) {
    improvements.push("現状の強みを維持しつつ、次戦へ向けてコンディションを整えましょう。");
  }

  return improvements;
}

function createRecommendedActions(
  state: GameState,
  breakdown: MatchPowerBreakdown,
  result: MatchResult,
): string[] {
  const actions: string[] = [];

  if (state.club.condition < 65) {
    actions.push("休養を入れてコンディションを回復しましょう。");
  }
  if (state.club.teamwork < 55) {
    actions.push("連携強化を行い、試合中のズレを減らしましょう。");
  }
  if (state.club.teamPower < breakdown.opponentBasePower) {
    actions.push("選手補強やスカウト活動で戦力差を縮めましょう。");
  }
  if (state.coach.inGameManagement < 40) {
    actions.push("監督研修で試合中采配を強化しましょう。");
  }
  if (state.club.fans < 800 && result !== "win") {
    actions.push("広報活動や地域イベントでファン基盤を広げましょう。");
  }

  if (actions.length === 0) {
    actions.push("次戦へ向けてAPを使い切り、強みを維持しましょう。");
  }

  return actions.slice(0, 4);
}

function toScoreBreakdown(breakdown: MatchPowerBreakdown): ScoreBreakdown {
  return {
    teamPower: breakdown.teamPower,
    startingPower: breakdown.teamPowerBreakdown?.startingPower,
    benchDepth: breakdown.teamPowerBreakdown?.benchDepth,
    conditionModifier: breakdown.teamPowerBreakdown?.conditionModifier,
    teamworkModifier: breakdown.teamPowerBreakdown?.teamworkModifier,
    coachModifier: breakdown.teamPowerBreakdown?.coachModifier,
    teamwork: breakdown.teamworkBonus,
    condition: breakdown.conditionBonus,
    coachLevel: breakdown.coachLevelBonus,
    tactics: breakdown.tacticsBonus,
    inGameManagement: breakdown.inGameManagementBonus,
    motivation: breakdown.motivationBonus,
    homeAdvantage: breakdown.homeBonus,
    luck: breakdown.luck,
    total: breakdown.clubMatchPower,
    opponentPower: breakdown.opponentBasePower,
    opponentLuck: breakdown.opponentLuck,
    opponentTotal: breakdown.opponentMatchPower,
    powerDifference: breakdown.powerDifference,
    teamPowerBreakdown: breakdown.teamPowerBreakdown,
  };
}

function createMatchActionLog(
  state: GameState,
  match: Match,
  effects: StatEffects,
): ActionLog {
  return {
    id: `match-result-${match.id}-${state.club.turn}`,
    turn: state.club.turn,
    year: match.year,
    month: match.month,
    actorType: "system",
    actorName: "System",
    actionName: "試合結果",
    reason: "自動試合が完了したため。",
    result: match.report.summary,
    effects,
  };
}

function createMatchFinanceLog(
  state: GameState,
  match: Match,
  moneyChange: number | undefined,
): FinanceLog | null {
  if (!moneyChange) {
    return null;
  }

  return {
    id: `finance-match-${match.id}-${state.club.turn}`,
    turn: state.club.turn,
    year: match.year,
    month: match.month,
    category: "ticket",
    amount: moneyChange,
    description: `${match.opponentName}戦の試合収入`,
  };
}

function createPendingMatchReport(state: GameState, opponentPower: number): MatchReport {
  const teamPowerBreakdown = getTeamPowerBreakdown(state);

  return {
    summary: "公式戦は翌月に自動実行されます。",
    reasons: ["エントリー済みの公式戦予定です。"],
    positives: ["公式戦は練習試合より大きな報酬と経験値を得られます。"],
    improvements: ["試合前に休養、連携強化、監督研修などで準備できます。"],
    recommendedActions: ["試合前にコンディションと連携を確認しましょう。"],
    scoreBreakdown: {
      teamPower: teamPowerBreakdown.finalTeamPower,
      startingPower: teamPowerBreakdown.startingPower,
      benchDepth: teamPowerBreakdown.benchDepth,
      conditionModifier: teamPowerBreakdown.conditionModifier,
      teamworkModifier: teamPowerBreakdown.teamworkModifier,
      coachModifier: teamPowerBreakdown.coachModifier,
      teamwork: 0,
      condition: 0,
      coachLevel: state.coach.level,
      tactics: 0,
      inGameManagement: 0,
      motivation: 0,
      homeAdvantage: 0,
      luck: 0,
      total: teamPowerBreakdown.finalTeamPower,
      opponentPower,
      opponentLuck: 0,
      opponentTotal: opponentPower,
      powerDifference: teamPowerBreakdown.finalTeamPower - opponentPower,
      teamPowerBreakdown,
    },
  };
}

function getResultLabel(result: MatchResult): string {
  if (result === "win") {
    return "勝利";
  }
  if (result === "draw") {
    return "引き分け";
  }
  if (result === "lose") {
    return "敗戦";
  }

  return "未消化";
}

function clampRating(value: number): number {
  return clamp(value, MIN_CLUB_RATING, MAX_CLUB_RATING);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
