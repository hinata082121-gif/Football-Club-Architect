import {
  COACH_EXPERIENCE_PER_LEVEL,
  MAX_CLUB_RATING,
  MAX_CONDITION,
  MIN_CLUB_RATING,
  MIN_CONDITION,
  PLAYER_ACTION_COSTS,
  PLAYER_ACTION_EFFECTS,
  STAFF_GENERATION_BALANCE,
  STAFF_SALARY_BASE,
} from "@/game/balance";
import { addScoutedPlayers, generateScoutedPlayers } from "@/game/scoutEngine";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import type {
  ActionLog,
  FinanceCategory,
  FinanceLog,
  GameState,
  PlayerAction,
  PlayerActionType,
  Staff,
  StaffPersonality,
  StaffRole,
  StatEffects,
} from "@/types/game";

export const MVP_PLAYER_ACTIONS: PlayerAction[] = [
  createPlayerAction("recruit_player", "選手補強", "資金を使ってスカウト候補を追加調査します。"),
  createPlayerAction("train_coach", "監督研修", "監督の経験値と能力成長を支援します。"),
  createPlayerAction("do_pr", "地域PR", "地域向けの広報活動でファンと評判を増やします。"),
  createPlayerAction("sponsor_sales", "スポンサー営業", "営業活動で資金とスポンサー力を高めます。"),
  createPlayerAction("hire_staff", "スタッフ雇用", "ランダムなスタッフを1人雇用します。"),
  createPlayerAction("improve_teamwork", "連携強化", "練習環境を整えてチーム連携を高めます。"),
  createPlayerAction("rest_team", "休養指示", "チームを休ませてコンディションを回復します。"),
];

export function canPerformPlayerAction(state: GameState, action: PlayerAction): boolean {
  return getPlayerActionDisabledReason(state, action) === null;
}

export function getPlayerActionDisabledReason(
  state: GameState,
  action: PlayerAction,
): string | null {
  const cost = PLAYER_ACTION_COSTS[action.id] ?? action.actionPointCost;
  const effects = PLAYER_ACTION_EFFECTS[action.id];
  const moneyChange = effects.money ?? 0;

  if (hasPerformedPlayerActionThisMonth(state, action)) {
    return "今月すでに実行済みです。";
  }

  if (state.club.actionPoints < cost) {
    return "APが不足しています。";
  }

  if (moneyChange < 0 && state.club.money + moneyChange < 0) {
    return "資金が不足しています。";
  }

  return null;
}

export function getCurrentMonthPlayerActionLog(
  state: GameState,
  action: PlayerAction,
): ActionLog | null {
  return (
    state.actionLogs.find(
      (log) =>
        log.actorType === "player" &&
        log.actionName === action.name &&
        log.year === state.currentYear &&
        log.month === state.currentMonth,
    ) ?? null
  );
}

export function hasPerformedPlayerActionThisMonth(
  state: GameState,
  action: PlayerAction,
): boolean {
  return getCurrentMonthPlayerActionLog(state, action) !== null;
}

export function performPlayerAction(state: GameState, action: PlayerAction): GameState {
  if (!canPerformPlayerAction(state, action)) {
    return state;
  }

  const actionCost = PLAYER_ACTION_COSTS[action.id];
  const baseEffects = PLAYER_ACTION_EFFECTS[action.id];
  const { nextState, appliedEffects } = applyPlayerActionEffects(state, action.id, baseEffects);
  const actionLog = createActionLog(nextState, action, actionCost, appliedEffects);
  const financeLog = createFinanceLog(nextState, action, appliedEffects.money);

  return {
    ...nextState,
    actionLogs: [actionLog, ...nextState.actionLogs],
    financeLogs: financeLog ? [financeLog, ...nextState.financeLogs] : nextState.financeLogs,
  };
}

function createPlayerAction(
  id: PlayerActionType,
  name: string,
  description: string,
): PlayerAction {
  return {
    id,
    name,
    description,
    actionPointCost: PLAYER_ACTION_COSTS[id],
    requiresApproval: id === "hire_staff",
    effectsPreview: PLAYER_ACTION_EFFECTS[id],
  };
}

function applyPlayerActionEffects(
  state: GameState,
  actionType: PlayerActionType,
  effects: StatEffects,
): { nextState: GameState; appliedEffects: StatEffects } {
  const nextActionPoints = Math.max(0, state.club.actionPoints - PLAYER_ACTION_COSTS[actionType]);
  const nextMoney = Math.max(0, state.club.money + (effects.money ?? 0));
  const nextFans = Math.max(0, state.club.fans + (effects.fans ?? 0));
  const nextReputation = clampRating(state.club.reputation + (effects.reputation ?? 0));
  const nextTeamPower = clampRating(state.club.teamPower + (effects.teamPower ?? 0));
  const nextTeamwork = clampRating(state.club.teamwork + (effects.teamwork ?? 0));
  const nextCondition = clamp(state.club.condition + (effects.condition ?? 0), MIN_CONDITION, MAX_CONDITION);
  const nextClubLevel = Math.max(1, state.club.clubLevel + (effects.clubLevel ?? 0));
  const nextStadiumCapacity = Math.max(0, state.club.stadiumCapacity + (effects.stadiumCapacity ?? 0));
  const nextGoodsPower = clampRating(state.club.goodsPower + (effects.goodsPower ?? 0));
  const nextSponsorPower = clampRating(state.club.sponsorPower + (effects.sponsorPower ?? 0));
  const coachUpdate = applyCoachEffects(state, effects);
  const hiredStaff = actionType === "hire_staff" ? createRandomStaff(state) : null;
  const scoutedPlayers =
    actionType === "recruit_player"
      ? generateScoutedPlayers(state, undefined, state.scoutFocus, randomInt(1, 2))
      : [];

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
      actionPoints: nextActionPoints,
      clubLevel: nextClubLevel,
      stadiumCapacity: nextStadiumCapacity,
      goodsPower: nextGoodsPower,
      sponsorPower: nextSponsorPower,
    },
    coach: coachUpdate.coach,
    staff: hiredStaff ? [...state.staff, hiredStaff] : state.staff,
  };
  const scoutedState =
    scoutedPlayers.length > 0 ? addScoutedPlayers(nextState, scoutedPlayers) : nextState;
  const poweredState = recalculateClubTeamPower(scoutedState);

  return {
    nextState: poweredState,
    appliedEffects: {
      money: nextMoney - state.club.money,
      fans: nextFans - state.club.fans,
      reputation: nextReputation - state.club.reputation,
      teamPower: poweredState.club.teamPower - state.club.teamPower,
      teamwork: nextTeamwork - state.club.teamwork,
      condition: nextCondition - state.club.condition,
      actionPoints: nextActionPoints - state.club.actionPoints,
      clubLevel: nextClubLevel - state.club.clubLevel,
      stadiumCapacity: nextStadiumCapacity - state.club.stadiumCapacity,
      goodsPower: nextGoodsPower - state.club.goodsPower,
      sponsorPower: nextSponsorPower - state.club.sponsorPower,
      coachExperience: coachUpdate.experienceDelta,
      coachLevel: coachUpdate.levelDelta,
    },
  };
}

function applyCoachEffects(state: GameState, effects: StatEffects) {
  const experienceGain = effects.coachExperience ?? 0;
  const totalExperience = state.coach.experience + experienceGain;
  const levelGain = Math.floor(totalExperience / COACH_EXPERIENCE_PER_LEVEL);
  const nextExperience = totalExperience % COACH_EXPERIENCE_PER_LEVEL;
  const nextLevel = state.coach.level + levelGain + (effects.coachLevel ?? 0);
  const abilityGain = levelGain > 0 ? levelGain : 0;

  return {
    coach: {
      ...state.coach,
      level: nextLevel,
      experience: nextExperience,
      tactics: clampRating(state.coach.tactics + abilityGain),
      playerSelection: clampRating(state.coach.playerSelection + abilityGain),
      inGameManagement: clampRating(state.coach.inGameManagement + abilityGain),
      development: clampRating(state.coach.development + abilityGain),
      motivation: clampRating(state.coach.motivation + abilityGain),
      charisma: clampRating(state.coach.charisma + abilityGain),
      aiJudgment: clampRating(state.coach.aiJudgment + abilityGain),
    },
    experienceDelta: experienceGain,
    levelDelta: nextLevel - state.coach.level,
  };
}

function createActionLog(
  state: GameState,
  action: PlayerAction,
  actionCost: number,
  effects: StatEffects,
): ActionLog {
  return {
    id: `player-action-${action.id}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: action.name,
    reason: getActionReason(action.id),
    result: getActionResult(action.id, actionCost),
    effects,
  };
}

function createFinanceLog(
  state: GameState,
  action: PlayerAction,
  moneyChange: number | undefined,
): FinanceLog | null {
  if (!moneyChange) {
    return null;
  }

  return {
    id: `finance-${action.id}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: getFinanceCategory(action.id),
    amount: moneyChange,
    description: `${action.name}: ${moneyChange > 0 ? "収入" : "支出"}`,
  };
}

function createRandomStaff(state: GameState): Staff {
  const role = pick<StaffRole>(["scout", "pr", "sales", "analyst", "goods", "facility"]);
  const personality = pick<StaffPersonality>([
    "steady",
    "aggressive",
    "frugal",
    "ambitious",
    "craftsman",
    "popular",
  ]);
  const baseSalary = STAFF_SALARY_BASE[role];
  const salary = baseSalary + randomInt(0, STAFF_GENERATION_BALANCE.salaryVariance);

  return {
    id: `staff-${state.club.turn}-${state.staff.length + 1}-${Date.now()}`,
    name: pick(["青木 翔", "水野 葵", "川田 亮", "白石 真央", "原田 匠", "藤井 陽"]),
    role,
    level: randomInt(STAFF_GENERATION_BALANCE.minLevel, STAFF_GENERATION_BALANCE.maxLevel),
    judgment: randomInt(STAFF_GENERATION_BALANCE.minJudgment, STAFF_GENERATION_BALANCE.maxJudgment),
    specialty: getSpecialty(role),
    growth: randomInt(STAFF_GENERATION_BALANCE.minGrowth, STAFF_GENERATION_BALANCE.maxGrowth),
    loyalty: randomInt(STAFF_GENERATION_BALANCE.minLoyalty, STAFF_GENERATION_BALANCE.maxLoyalty),
    dissatisfaction: randomInt(
      STAFF_GENERATION_BALANCE.minDissatisfaction,
      STAFF_GENERATION_BALANCE.maxDissatisfaction,
    ),
    personality,
    aiAccuracy: randomInt(
      STAFF_GENERATION_BALANCE.minAiAccuracy,
      STAFF_GENERATION_BALANCE.maxAiAccuracy,
    ),
    delegationLevel: 1,
    salary,
  };
}

function getActionReason(actionType: PlayerActionType): string {
  const reasons: Record<PlayerActionType, string> = {
    recruit_player: "獲得候補を増やし、社長が承認できる補強選択肢を作るため。",
    train_coach: "監督の判断力と育成力を伸ばし、試合結果の安定を狙うため。",
    do_pr: "地域の認知度を上げ、ファン基盤を広げるため。",
    sponsor_sales: "クラブ運営資金を確保し、スポンサー力を高めるため。",
    hire_staff: "社長一人では対応できない業務を委任する準備のため。",
    improve_teamwork: "チーム連携を高め、試合で力を出しやすくするため。",
    rest_team: "コンディションを回復し、次の試合や活動に備えるため。",
  };

  return reasons[actionType];
}

function getActionResult(actionType: PlayerActionType, actionCost: number): string {
  const results: Record<PlayerActionType, string> = {
    recruit_player: "補強調査を行い、スカウト候補が追加されました。",
    train_coach: "監督研修を実施し、監督経験値が増加しました。",
    do_pr: "地域PRを実施し、ファンと評判が増加しました。",
    sponsor_sales: "スポンサー営業により資金を獲得しました。",
    hire_staff: "新しいスタッフを1人雇用しました。",
    improve_teamwork: "連携強化メニューを実施し、チームワークが上昇しました。",
    rest_team: "休養を取り、コンディションが回復しました。",
  };

  return `${results[actionType]} APを${actionCost}消費しました。`;
}

function getFinanceCategory(actionType: PlayerActionType): FinanceCategory {
  const categories: Record<PlayerActionType, FinanceCategory> = {
    recruit_player: "other",
    train_coach: "other",
    do_pr: "other",
    sponsor_sales: "sponsor",
    hire_staff: "staff_hiring",
    improve_teamwork: "facility",
    rest_team: "other",
  };

  return categories[actionType];
}

function getSpecialty(role: StaffRole): string {
  const specialties: Record<StaffRole, string> = {
    scout: "選手発掘",
    pr: "地域広報",
    sales: "スポンサー営業",
    analyst: "試合分析",
    goods: "グッズ企画",
    facility: "施設運営",
  };

  return specialties[role];
}

function clampRating(value: number): number {
  return clamp(value, MIN_CLUB_RATING, MAX_CLUB_RATING);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}
