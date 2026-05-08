import {
  INITIAL_CLUB_BALANCE,
  INITIAL_COACH_BALANCE,
  STAFF_SALARY_BASE,
} from "@/game/balance";
import {
  createInitialFinancialHealth,
  updateFinancialHealth,
} from "@/game/financeHealthEngine";
import { generateInitialPlayers } from "@/game/playerGenerator";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import { START_MONTH, START_YEAR } from "@/utils/date";
import type { Club, Coach, GameState, Staff } from "@/types/game";

export const DEFAULT_CLUB_NAME = "Soccer FC";
export const DEFAULT_OWNER_NAME = "ユーザー名社長";
export const CLUB_NAME_MAX_LENGTH = 24;
export const OWNER_NAME_MAX_LENGTH = 16;

export interface InitialGameStateOptions {
  clubName?: string;
  ownerName?: string;
}

export function createInitialClub(clubName = DEFAULT_CLUB_NAME): Club {
  return {
    id: "club-namiki-fc",
    name: normalizeName(clubName, DEFAULT_CLUB_NAME, CLUB_NAME_MAX_LENGTH),
    money: INITIAL_CLUB_BALANCE.money,
    fans: INITIAL_CLUB_BALANCE.fans,
    reputation: INITIAL_CLUB_BALANCE.reputation,
    teamPower: INITIAL_CLUB_BALANCE.teamPower,
    teamwork: INITIAL_CLUB_BALANCE.teamwork,
    condition: INITIAL_CLUB_BALANCE.condition,
    actionPoints: INITIAL_CLUB_BALANCE.actionPoints,
    maxActionPoints: INITIAL_CLUB_BALANCE.maxActionPoints,
    turn: INITIAL_CLUB_BALANCE.turn,
    clubLevel: INITIAL_CLUB_BALANCE.clubLevel,
    policy: "local_first",
    stadiumCapacity: INITIAL_CLUB_BALANCE.stadiumCapacity,
    goodsPower: INITIAL_CLUB_BALANCE.goodsPower,
    sponsorPower: INITIAL_CLUB_BALANCE.sponsorPower,
  };
}

export function createInitialCoach(): Coach {
  return {
    id: "coach-initial",
    name: "佐藤 智也",
    level: INITIAL_COACH_BALANCE.level,
    tactics: INITIAL_COACH_BALANCE.tactics,
    playerSelection: INITIAL_COACH_BALANCE.playerSelection,
    inGameManagement: INITIAL_COACH_BALANCE.inGameManagement,
    development: INITIAL_COACH_BALANCE.development,
    motivation: INITIAL_COACH_BALANCE.motivation,
    charisma: INITIAL_COACH_BALANCE.charisma,
    aiJudgment: INITIAL_COACH_BALANCE.aiJudgment,
    experience: INITIAL_COACH_BALANCE.experience,
  };
}

export function createInitialStaff(): Staff[] {
  return [];
}

export function createStaffCandidates(): Staff[] {
  return [
    {
      id: "candidate-scout-1",
      name: "高橋 蓮",
      role: "scout",
      level: 1,
      judgment: 32,
      specialty: "若手発掘",
      growth: 75,
      loyalty: 65,
      dissatisfaction: 5,
      personality: "steady",
      aiAccuracy: 35,
      delegationLevel: 1,
      salary: STAFF_SALARY_BASE.scout,
    },
    {
      id: "candidate-pr-1",
      name: "森下 ひかり",
      role: "pr",
      level: 1,
      judgment: 30,
      specialty: "地域PR",
      growth: 70,
      loyalty: 72,
      dissatisfaction: 4,
      personality: "popular",
      aiAccuracy: 34,
      delegationLevel: 1,
      salary: STAFF_SALARY_BASE.pr,
    },
    {
      id: "candidate-sales-1",
      name: "中村 圭",
      role: "sales",
      level: 1,
      judgment: 34,
      specialty: "地元スポンサー",
      growth: 62,
      loyalty: 60,
      dissatisfaction: 6,
      personality: "ambitious",
      aiAccuracy: 36,
      delegationLevel: 1,
      salary: STAFF_SALARY_BASE.sales,
    },
  ];
}

export function createInitialGameState(options?: InitialGameStateOptions): GameState {
  const clubName = normalizeName(options?.clubName, DEFAULT_CLUB_NAME, CLUB_NAME_MAX_LENGTH);
  const ownerName = normalizeName(options?.ownerName, DEFAULT_OWNER_NAME, OWNER_NAME_MAX_LENGTH);
  const club = createInitialClub(clubName);
  const players = generateInitialPlayers(START_YEAR, START_MONTH);

  const state: GameState = {
    ownerName,
    currentYear: START_YEAR,
    currentMonth: START_MONTH,
    elapsedMonths: 0,
    club,
    coach: createInitialCoach(),
    staff: createInitialStaff(),
    players,
    scoutedPlayers: [],
    scoutFocus: "balanced",
    coachSelectionPolicy: "balanced",
    autoCoachSelectionEnabled: true,
    contractAlerts: [],
    financialHealth: createInitialFinancialHealth(club.money),
    monthsInInsolvency: 0,
    isGameOver: false,
    bankruptcyState: {
      isBankrupt: false,
      monthsInInsolvency: 0,
      finalWarningIssued: false,
      canDownsizeRestart: true,
    },
    loans: [],
    matches: [],
    actionLogs: [
      {
        id: "log-initial",
        turn: club.turn,
        year: START_YEAR,
        month: START_MONTH,
        actorType: "system",
        actorName: "System",
        actionName: "クラブ設立",
        reason: "MVP開始時の初期状態を作成するため。",
        result: `${club.name}の経営を開始しました。${ownerName}として、まずは自分で業務を担当します。`,
        effects: {},
      },
    ],
    financeLogs: [
      {
        id: "finance-initial",
        turn: club.turn,
        year: START_YEAR,
        month: START_MONTH,
        category: "initial",
        amount: club.money,
        description: "初期資金",
      },
    ],
    events: [],
    lastMatchReport: null,
    lastMonthlyResultSummary: undefined,
    scheduledOfficialMatch: null,
    hasEnteredOfficialCompetition: false,
    officialCompetitionEntry: undefined,
    trainingMatchPlayedTurn: null,
  };

  return updateFinancialHealth(recalculateClubTeamPower(state));
}

export const initialGameState: GameState = createInitialGameState();

function normalizeName(value: string | undefined, fallback: string, maxLength: number): string {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, maxLength);
}
