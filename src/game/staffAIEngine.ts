import {
  COACH_EXPERIENCE_PER_LEVEL,
  MAX_CLUB_RATING,
  MAX_CONDITION,
  MIN_CLUB_RATING,
  MIN_CONDITION,
  STAFF_ACTION_BASE_EFFECTS,
  STAFF_AI_BALANCE,
} from "@/game/balance";
import {
  addScoutedPlayers,
  calculateScoutAccuracy,
  generateScoutedPlayers,
  getScoutFocusLabel,
} from "@/game/scoutEngine";
import { chance, pick, randomFloat } from "@/utils/random";
import type {
  ActionLog,
  FinanceCategory,
  FinanceLog,
  GameState,
  Staff,
  StaffAction,
  StaffActionRisk,
  StaffActionType,
  StatEffects,
  ScoutFocus,
  ScoutedPlayer,
} from "@/types/game";

type StaffActionCandidate = {
  id: StaffActionType;
  name: string;
  baseScore: number;
  risk: StaffActionRisk;
  quality: "good" | "ok" | "poor";
  reason: string;
};

export function runStaffAIActions(state: GameState): GameState {
  return state.staff.reduce((currentState, staffMember) => {
    if (staffMember.delegationLevel === 0) {
      return currentState;
    }

    const action = chooseStaffAction(currentState, staffMember);
    return applyStaffAction(currentState, staffMember, action);
  }, state);
}

export function chooseStaffAction(state: GameState, staffMember: Staff): StaffAction {
  const candidates = getCandidatesForRole(staffMember.role);
  const scoredCandidates = candidates.map((candidate) => ({
    candidate,
    score: scoreCandidate(state, staffMember, candidate),
  }));
  const selected = weightedPick(scoredCandidates);
  const expectedEffects = createExpectedEffects(state, staffMember, selected);

  return {
    id: selected.id,
    staffId: staffMember.id,
    name: selected.name,
    reason: buildChoiceReason(state, staffMember, selected),
    expectedEffects,
    risk: selected.risk,
    requiresApproval: requiresApproval(staffMember, selected.risk, expectedEffects),
  };
}

export function applyStaffAction(
  state: GameState,
  staffMember: Staff,
  action: StaffAction,
): GameState {
  if (action.requiresApproval) {
    const actionLog = createStaffActionLog(
      state,
      staffMember,
      action,
      "承認待ちです。MVPでは重大または委任外の行動は効果を適用しません。",
      {},
    );

    return {
      ...state,
      actionLogs: [actionLog, ...state.actionLogs],
    };
  }

  if (!canPayForEffects(state, action.expectedEffects)) {
    const actionLog = createStaffActionLog(
      state,
      staffMember,
      action,
      "資金不足のため実行できませんでした。損失は発生していません。",
      {},
    );

    return {
      ...state,
      actionLogs: [actionLog, ...state.actionLogs],
    };
  }

  const resolvedEffects = resolveRiskyOutcome(staffMember, action);
  const { nextState, appliedEffects } = applyEffects(state, staffMember, resolvedEffects);
  const scoutResult = applyScoutDiscovery(nextState, staffMember, action);
  const result = scoutResult
    ? buildScoutActionResult(action, scoutResult.scoutedPlayers, staffMember)
    : buildActionResult(action, appliedEffects);
  const actionLog = createStaffActionLog(scoutResult?.state ?? nextState, staffMember, action, result, appliedEffects);
  const financeLog = createFinanceLog(scoutResult?.state ?? nextState, action, appliedEffects.money);

  return {
    ...(scoutResult?.state ?? nextState),
    actionLogs: [actionLog, ...(scoutResult?.state ?? nextState).actionLogs],
    financeLogs: financeLog
      ? [financeLog, ...(scoutResult?.state ?? nextState).financeLogs]
      : (scoutResult?.state ?? nextState).financeLogs,
  };
}

function getCandidatesForRole(role: Staff["role"]): StaffActionCandidate[] {
  const candidates: Record<Staff["role"], StaffActionCandidate[]> = {
    scout: [
      createCandidate("scout_young_player", "若手候補調査", 54, "normal", "good", "成長余地のある若手を探します。"),
      createCandidate("scout_value_player", "割安選手調査", 58, "low", "good", "費用対効果の高い選手を探します。"),
      createCandidate("analyze_squad_depth", "選手層分析", 50, "low", "ok", "現有戦力の偏りを分析します。"),
    ],
    pr: [
      createCandidate("social_post", "SNS投稿", 54, "low", "ok", "低コストで日常的な接点を作ります。"),
      createCandidate("local_event", "地域イベント", 58, "normal", "good", "地域密着でファンを増やします。"),
      createCandidate("star_pr", "スターPR", 42, "normal", "good", "注目選手や評判を使って露出を狙います。"),
      createCandidate("wasteful_ad", "非効率広告", 18, "high", "poor", "派手ですが費用対効果が低い広告です。"),
    ],
    sales: [
      createCandidate("small_sponsor", "小口スポンサー営業", 56, "low", "ok", "安全に小口収入を積みます。"),
      createCandidate("local_business", "地元企業営業", 58, "normal", "good", "地域企業との関係を深めます。"),
      createCandidate("risky_big_pitch", "大型スポンサー提案", 30, "major", "good", "成功すれば大きい高リスク提案です。"),
    ],
    analyst: [
      createCandidate("opponent_analysis", "対戦相手分析", 56, "low", "good", "試合準備の精度を上げます。"),
      createCandidate("tactics_review", "戦術レビュー", 54, "low", "good", "連携と戦術理解を整えます。"),
      createCandidate("coach_feedback", "監督フィードバック", 52, "low", "ok", "監督の経験値を伸ばします。"),
    ],
    goods: [
      createCandidate("basic_goods_campaign", "定番グッズ施策", 56, "low", "ok", "小さな収益とグッズ力を伸ばします。"),
      createCandidate("limited_goods", "限定グッズ企画", 46, "normal", "good", "ファン数や評判を活かした企画です。"),
      createCandidate("overproduce_goods", "過剰生産", 18, "high", "poor", "在庫過多になりやすい施策です。"),
    ],
    facility: [
      createCandidate("maintain_training_ground", "練習場メンテ", 56, "low", "good", "状態と連携を少し改善します。"),
      createCandidate("improve_stadium_ops", "スタジアム運営改善", 48, "normal", "ok", "施設運営と収益性の土台を整えます。"),
      createCandidate("inefficient_maintenance", "非効率メンテ", 18, "high", "poor", "効果が薄い保守対応です。"),
    ],
  };

  return candidates[role];
}

function createCandidate(
  id: StaffActionType,
  name: string,
  baseScore: number,
  risk: StaffActionRisk,
  quality: StaffActionCandidate["quality"],
  reason: string,
): StaffActionCandidate {
  return { id, name, baseScore, risk, quality, reason };
}

function scoreCandidate(
  state: GameState,
  staffMember: Staff,
  candidate: StaffActionCandidate,
): number {
  const skill = getStaffSkill(staffMember);
  const noiseRange = interpolate(
    STAFF_AI_BALANCE.lowSkillNoise,
    STAFF_AI_BALANCE.highSkillNoise,
    skill / 100,
  );
  const qualityScore = candidate.quality === "good" ? skill * 0.28 : candidate.quality === "ok" ? skill * 0.14 : 0;
  const poorActionBias =
    candidate.quality === "poor"
      ? interpolate(STAFF_AI_BALANCE.poorActionBadDecisionBonus, 0, skill / 100)
      : 0;
  const goodActionPenalty =
    candidate.quality === "good"
      ? interpolate(STAFF_AI_BALANCE.goodActionBadDecisionPenalty, 0, skill / 100)
      : 0;

  return Math.max(
    1,
    candidate.baseScore +
      qualityScore +
      poorActionBias -
      goodActionPenalty +
      getStateScoreAdjustment(state, candidate) +
      getPersonalityScoreAdjustment(staffMember, candidate) +
      randomFloat(-noiseRange, noiseRange),
  );
}

function getStateScoreAdjustment(state: GameState, candidate: StaffActionCandidate): number {
  let score = 0;
  const effects = STAFF_ACTION_BASE_EFFECTS[candidate.id];

  if ((effects.money ?? 0) > 0 && state.club.money < STAFF_AI_BALANCE.lowCashThreshold) {
    score += 18;
  }

  if ((effects.money ?? 0) < 0 && state.club.money < STAFF_AI_BALANCE.lowCashThreshold) {
    score -= 26;
  }

  if (candidate.id === "star_pr" && state.club.teamPower >= STAFF_AI_BALANCE.strongClubThreshold) {
    score += 20;
  }

  if (candidate.id === "limited_goods" && state.club.fans >= STAFF_AI_BALANCE.popularClubFanThreshold) {
    score += 16;
  }

  if (candidate.id === "maintain_training_ground" && state.club.condition < 60) {
    score += 20;
  }

  if (candidate.id === "tactics_review" && state.club.teamwork < 45) {
    score += 16;
  }

  return score;
}

function getPersonalityScoreAdjustment(staffMember: Staff, candidate: StaffActionCandidate): number {
  const bonus = STAFF_AI_BALANCE.personalityScoreBonus;

  if (staffMember.personality === "frugal" && (STAFF_ACTION_BASE_EFFECTS[candidate.id].money ?? 0) >= 0) {
    return bonus;
  }
  if (staffMember.personality === "aggressive" && candidate.risk === "high") {
    return bonus;
  }
  if (staffMember.personality === "ambitious" && candidate.risk === "major") {
    return bonus;
  }
  if (staffMember.personality === "steady" && candidate.risk === "low") {
    return bonus;
  }
  if (staffMember.personality === "craftsman" && ["tactics_review", "maintain_training_ground", "basic_goods_campaign"].includes(candidate.id)) {
    return bonus;
  }
  if (staffMember.personality === "popular" && ["social_post", "local_event", "star_pr"].includes(candidate.id)) {
    return bonus;
  }

  return 0;
}

function createExpectedEffects(
  state: GameState,
  staffMember: Staff,
  candidate: StaffActionCandidate,
): StatEffects {
  const baseEffects = STAFF_ACTION_BASE_EFFECTS[candidate.id];
  const multiplier = getEffectMultiplier(staffMember);
  const dynamicEffects = getDynamicEffects(state, candidate.id);

  return mergeEffects(scaleEffects(baseEffects, multiplier), dynamicEffects);
}

function applyScoutDiscovery(
  state: GameState,
  staffMember: Staff,
  action: StaffAction,
): { state: GameState; scoutedPlayers: ScoutedPlayer[] } | null {
  const focus = getScoutFocusFromAction(action.id);

  if (!focus || staffMember.role !== "scout") {
    return null;
  }

  const count = action.id === "analyze_squad_depth" ? 1 : 2;
  const scoutedPlayers = generateScoutedPlayers(state, staffMember, focus, count);

  return {
    state: addScoutedPlayers(state, scoutedPlayers),
    scoutedPlayers,
  };
}

function getScoutFocusFromAction(actionType: StaffActionType): ScoutFocus | null {
  const focusByAction: Partial<Record<StaffActionType, ScoutFocus>> = {
    scout_young_player: "youth",
    scout_value_player: "low_cost",
    analyze_squad_depth: "position_specific",
  };

  return focusByAction[actionType] ?? null;
}

function getDynamicEffects(state: GameState, actionType: StaffActionType): StatEffects {
  if (actionType === "star_pr") {
    return {
      fans: state.club.teamPower >= STAFF_AI_BALANCE.strongClubThreshold ? 35 : 0,
      reputation: state.club.reputation >= 35 ? 1 : 0,
    };
  }

  if (actionType === "limited_goods") {
    return {
      money: Math.min(50_000, Math.floor(state.club.fans / 30) * 1_000),
      fans: state.club.reputation >= 30 ? 15 : 0,
    };
  }

  return {};
}

function applyEffects(
  state: GameState,
  staffMember: Staff,
  effects: StatEffects,
): { nextState: GameState; appliedEffects: StatEffects } {
  const nextMoney = Math.max(0, state.club.money + (effects.money ?? 0));
  const nextFans = Math.max(0, state.club.fans + (effects.fans ?? 0));
  const nextReputation = clampRating(state.club.reputation + (effects.reputation ?? 0));
  const nextTeamPower = clampRating(state.club.teamPower + (effects.teamPower ?? 0));
  const nextTeamwork = clampRating(state.club.teamwork + (effects.teamwork ?? 0));
  const nextCondition = clamp(state.club.condition + (effects.condition ?? 0), MIN_CONDITION, MAX_CONDITION);
  const nextStadiumCapacity = Math.max(0, state.club.stadiumCapacity + (effects.stadiumCapacity ?? 0));
  const nextGoodsPower = clampRating(state.club.goodsPower + (effects.goodsPower ?? 0));
  const nextSponsorPower = clampRating(state.club.sponsorPower + (effects.sponsorPower ?? 0));
  const coachUpdate = applyCoachExperience(state, effects.coachExperience ?? 0);
  const staffDissatisfaction = effects.staffDissatisfaction ?? 0;

  const nextState: GameState = {
    ...state,
    club: {
      ...state.club,
      money: nextMoney,
      fans: nextFans,
      reputation: nextReputation,
      teamPower: nextTeamPower,
      teamwork: nextTeamwork,
      condition: nextCondition,
      stadiumCapacity: nextStadiumCapacity,
      goodsPower: nextGoodsPower,
      sponsorPower: nextSponsorPower,
    },
    coach: coachUpdate.coach,
    staff: state.staff.map((member) =>
      member.id === staffMember.id
        ? {
            ...member,
            dissatisfaction: clamp(
              member.dissatisfaction + staffDissatisfaction,
              MIN_CLUB_RATING,
              MAX_CLUB_RATING,
            ),
          }
        : member,
    ),
  };

  return {
    nextState,
    appliedEffects: {
      money: nextMoney - state.club.money,
      fans: nextFans - state.club.fans,
      reputation: nextReputation - state.club.reputation,
      teamPower: nextTeamPower - state.club.teamPower,
      teamwork: nextTeamwork - state.club.teamwork,
      condition: nextCondition - state.club.condition,
      stadiumCapacity: nextStadiumCapacity - state.club.stadiumCapacity,
      goodsPower: nextGoodsPower - state.club.goodsPower,
      sponsorPower: nextSponsorPower - state.club.sponsorPower,
      coachExperience: coachUpdate.experienceDelta,
      coachLevel: coachUpdate.levelDelta,
      staffDissatisfaction,
    },
  };
}

function resolveRiskyOutcome(staffMember: Staff, action: StaffAction): StatEffects {
  if (action.id !== "risky_big_pitch") {
    return action.expectedEffects;
  }

  const successRate = clamp(0.35 + getStaffSkill(staffMember) / 180, 0.35, 0.82);

  if (chance(successRate)) {
    return action.expectedEffects;
  }

  return {
    money: -20_000,
    reputation: -1,
    staffDissatisfaction: 4,
  };
}

function applyCoachExperience(state: GameState, experienceGain: number) {
  const totalExperience = state.coach.experience + experienceGain;
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
    experienceDelta: experienceGain,
    levelDelta: levelGain,
  };
}

function requiresApproval(
  staffMember: Staff,
  risk: StaffActionRisk,
  effects: StatEffects,
): boolean {
  if (staffMember.delegationLevel === 1) {
    return true;
  }

  if (risk === "major") {
    return true;
  }

  if (Math.abs(Math.min(0, effects.money ?? 0)) >= STAFF_AI_BALANCE.majorExpenseThreshold) {
    return true;
  }

  if (risk === "high") {
    return staffMember.delegationLevel < STAFF_AI_BALANCE.highRiskAutoDelegationLevel;
  }

  if (risk === "normal") {
    return staffMember.delegationLevel < STAFF_AI_BALANCE.normalRiskAutoDelegationLevel;
  }

  return staffMember.delegationLevel < STAFF_AI_BALANCE.lowRiskAutoDelegationLevel;
}

function createStaffActionLog(
  state: GameState,
  staffMember: Staff,
  action: StaffAction,
  result: string,
  effects: StatEffects,
): ActionLog {
  return {
    id: `staff-action-${action.id}-${staffMember.id}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "staff",
    actorName: staffMember.name,
    actionName: action.name,
    reason: action.reason,
    result,
    effects,
  };
}

function createFinanceLog(
  state: GameState,
  action: StaffAction,
  moneyChange: number | undefined,
): FinanceLog | null {
  if (!moneyChange) {
    return null;
  }

  return {
    id: `finance-staff-${action.id}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: getFinanceCategory(action.id),
    amount: moneyChange,
    description: `${action.name}: ${moneyChange > 0 ? "収入" : "支出"}`,
  };
}

function buildChoiceReason(
  state: GameState,
  staffMember: Staff,
  candidate: StaffActionCandidate,
): string {
  const skill = Math.round(getStaffSkill(staffMember));
  const stateNote =
    state.club.money < STAFF_AI_BALANCE.lowCashThreshold
      ? "資金が少ないため、収支への影響も考慮しました。"
      : "現在のクラブ状態に対する効果を見込みました。";

  return `${candidate.reason} 判断力・AI精度から見た適合度は${skill}です。${stateNote}`;
}

function buildActionResult(action: StaffAction, effects: StatEffects): string {
  const changedKeys = Object.entries(effects).filter(([, value]) => value !== undefined && value !== 0);

  if (changedKeys.length === 0) {
    return "行動しましたが、目立つ数値変化はありませんでした。";
  }

  return "スタッフAIが自動実行し、クラブ状態に小さな変化がありました。";
}

function buildScoutActionResult(
  action: StaffAction,
  scoutedPlayers: ScoutedPlayer[],
  staffMember: Staff,
): string {
  const accuracy = calculateScoutAccuracy(staffMember);
  const focus = getScoutFocusFromAction(action.id) ?? "balanced";
  const summaries = scoutedPlayers
    .map(
      (scoutedPlayer) =>
        `${scoutedPlayer.player.position} ${scoutedPlayer.player.name} 推定総合${scoutedPlayer.estimatedOverall}/推定将来性${scoutedPlayer.estimatedPotential}`,
    )
    .join("、");

  return `${staffMember.name}が${getScoutFocusLabel(focus)}で${scoutedPlayers.length}人の候補を発見しました。推定精度は${accuracy}です。候補: ${summaries}`;
}

function canPayForEffects(state: GameState, effects: StatEffects): boolean {
  return state.club.money + (effects.money ?? 0) >= 0;
}

function getEffectMultiplier(staffMember: Staff): number {
  const skill = getStaffSkill(staffMember);
  const base = interpolate(
    STAFF_AI_BALANCE.minEffectMultiplier,
    STAFF_AI_BALANCE.maxEffectMultiplier,
    skill / 100,
  );

  return randomFloat(base - 0.08, base + 0.08);
}

function getStaffSkill(staffMember: Staff): number {
  return clamp(
    staffMember.judgment * 0.45 +
      staffMember.aiAccuracy * 0.35 +
      staffMember.level * 4 +
      staffMember.growth * 0.08 -
      staffMember.dissatisfaction * 0.2,
    0,
    100,
  );
}

function scaleEffects(effects: StatEffects, multiplier: number): StatEffects {
  const scaled: StatEffects = {};

  for (const [key, value] of Object.entries(effects) as [keyof StatEffects, number][]) {
    scaled[key] = Math.round(value * multiplier);
  }

  return scaled;
}

function mergeEffects(primary: StatEffects, secondary: StatEffects): StatEffects {
  const merged: StatEffects = { ...primary };

  for (const [key, value] of Object.entries(secondary) as [keyof StatEffects, number][]) {
    merged[key] = (merged[key] ?? 0) + value;
  }

  return merged;
}

function weightedPick(
  items: { candidate: StaffActionCandidate; score: number }[],
): StaffActionCandidate {
  const total = items.reduce((sum, item) => sum + item.score, 0);
  let cursor = randomFloat(0, total);

  for (const item of items) {
    cursor -= item.score;
    if (cursor <= 0) {
      return item.candidate;
    }
  }

  return pick(items).candidate;
}

function getFinanceCategory(actionType: StaffActionType): FinanceCategory {
  if (["small_sponsor", "local_business", "risky_big_pitch"].includes(actionType)) {
    return "sponsor";
  }
  if (["basic_goods_campaign", "limited_goods", "overproduce_goods"].includes(actionType)) {
    return "goods";
  }
  if (["maintain_training_ground", "improve_stadium_ops", "inefficient_maintenance"].includes(actionType)) {
    return "facility";
  }

  return "other";
}

function clampRating(value: number): number {
  return clamp(value, MIN_CLUB_RATING, MAX_CLUB_RATING);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function interpolate(from: number, to: number, ratio: number): number {
  return from + (to - from) * clamp(ratio, 0, 1);
}
