import { PLAYER_GENERATION_BALANCE } from "@/game/balance";
import type {
  Player,
  PlayerDevelopmentStage,
  PlayerPosition,
  PlayerStatus,
} from "@/types/game";
import { pick, randomInt } from "@/utils/random";

interface NumberRange {
  min: number;
  max: number;
}

export interface PlayerGenerationParams {
  position?: PlayerPosition;
  ageRange?: NumberRange;
  overallRange?: NumberRange;
  potentialRange?: NumberRange;
  isHomegrown?: boolean;
}

type AgeProfile = "young" | "growth" | "prime" | "veteran" | "older";

const POSITIONS: PlayerPosition[] = ["GK", "DF", "MF", "FW"];

const FAMILY_NAMES = [
  "佐藤",
  "鈴木",
  "高橋",
  "田中",
  "伊藤",
  "渡辺",
  "中村",
  "小林",
  "山本",
  "加藤",
  "Martin",
  "Silva",
  "Garcia",
  "Rossi",
  "Costa",
  "Nielsen",
  "Santos",
  "Muller",
] as const;

const GIVEN_NAMES = [
  "蓮",
  "悠真",
  "大翔",
  "湊",
  "蒼",
  "陽斗",
  "颯太",
  "樹",
  "Leon",
  "Mateo",
  "Lucas",
  "Diego",
  "Noah",
  "Emil",
  "Rafael",
  "Tomas",
] as const;

export function generateInitialPlayers(year: number, month: number): Player[] {
  const positionPlan = createInitialPositionPlan();
  const startingCounts = { ...PLAYER_GENERATION_BALANCE.initialStartingCounts };

  return positionPlan.map((position, index) => {
    const status: PlayerStatus = startingCounts[position] > 0 ? "starting" : "bench";

    if (status === "starting") {
      startingCounts[position] -= 1;
    }

    const player = generatePlayer({
      position,
      isHomegrown: index < 10,
    });

    return {
      ...player,
      id: `initial-player-${index + 1}`,
      status,
      joinedAtYear: year,
      joinedAtMonth: month,
    };
  });
}

export function generatePlayer(params?: Partial<PlayerGenerationParams>): Player {
  const position = params?.position ?? pick(POSITIONS);
  const age = randomIntFromRange(params?.ageRange ?? getAgeRange(selectAgeProfile()));
  const profile = getAgeProfileByAge(age);
  const overall = randomIntFromRange(params?.overallRange ?? getOverallRange(profile));
  const potentialRange = params?.potentialRange ?? getPotentialRange(profile, overall);
  const potential = Math.max(overall, randomIntFromRange(potentialRange));
  const growth = generateGrowth(profile);
  const contractMonths = generateContractMonths(age);

  const draftPlayer: Player = {
    id: `player-${randomInt(100_000, 999_999)}`,
    name: generatePlayerName(),
    age,
    position,
    overall,
    potential,
    growth,
    condition: randomInt(
      PLAYER_GENERATION_BALANCE.condition.min,
      PLAYER_GENERATION_BALANCE.condition.max,
    ),
    morale: randomInt(PLAYER_GENERATION_BALANCE.morale.min, PLAYER_GENERATION_BALANCE.morale.max),
    salary: 0,
    contractMonths,
    marketValue: 0,
    status: "reserve",
    developmentStage: calculateInitialDevelopmentStage(age),
    monthsUntilBirthday: randomInt(
      PLAYER_GENERATION_BALANCE.birthdayMonths.min,
      PLAYER_GENERATION_BALANCE.birthdayMonths.max,
    ),
    experience: 0,
    appearances: 0,
    trainingMatchAppearances: 0,
    isHomegrown: params?.isHomegrown ?? false,
    joinedAtYear: 0,
    joinedAtMonth: 0,
  };

  const salary = calculatePlayerSalary(draftPlayer);
  const marketValue = calculateMarketValue({ ...draftPlayer, salary });

  return {
    ...draftPlayer,
    salary,
    marketValue,
  };
}

export function calculateMarketValue(player: Player): number {
  const balance = PLAYER_GENERATION_BALANCE.marketValue;
  const rawValue =
    balance.base +
    player.overall * balance.overallMultiplier +
    player.potential * balance.potentialMultiplier +
    player.growth * balance.growthMultiplier;

  const ageMultiplier = getMarketAgeMultiplier(player.age);
  return roundTo(clamp(rawValue * ageMultiplier, balance.min, balance.max), balance.roundTo);
}

export function calculatePlayerSalary(player: Player): number {
  const balance = PLAYER_GENERATION_BALANCE.salary;
  const rawSalary =
    balance.base +
    player.overall * balance.overallMultiplier +
    player.potential * balance.potentialMultiplier;

  const positionMultiplier = balance.positionMultiplier[player.position];
  const ageMultiplier = getSalaryAgeMultiplier(player.age);

  return roundTo(
    clamp(rawSalary * positionMultiplier * ageMultiplier, balance.min, balance.max),
    balance.roundTo,
  );
}

function createInitialPositionPlan(): PlayerPosition[] {
  const counts = PLAYER_GENERATION_BALANCE.initialPositionCounts;

  return [
    ...Array.from({ length: counts.GK }, () => "GK" as const),
    ...Array.from({ length: counts.DF }, () => "DF" as const),
    ...Array.from({ length: counts.MF }, () => "MF" as const),
    ...Array.from({ length: counts.FW }, () => "FW" as const),
  ];
}

function selectAgeProfile(): AgeProfile {
  const weights = PLAYER_GENERATION_BALANCE.ageProfileWeights;
  const total = weights.young + weights.growth + weights.prime + weights.veteran + weights.older;
  const roll = randomInt(1, total);

  if (roll <= weights.young) {
    return "young";
  }

  if (roll <= weights.young + weights.growth) {
    return "growth";
  }

  if (roll <= weights.young + weights.growth + weights.prime) {
    return "prime";
  }

  if (roll <= weights.young + weights.growth + weights.prime + weights.veteran) {
    return "veteran";
  }

  return "older";
}

function getAgeRange(profile: AgeProfile): NumberRange {
  const ranges: Record<AgeProfile, NumberRange> = {
    young: { min: 17, max: 20 },
    growth: { min: 21, max: 24 },
    prime: { min: 25, max: 29 },
    veteran: { min: 30, max: 33 },
    older: { min: 34, max: 36 },
  };

  return ranges[profile];
}

function getAgeProfileByAge(age: number): AgeProfile {
  if (age <= 20) {
    return "young";
  }

  if (age <= 24) {
    return "growth";
  }

  if (age <= 29) {
    return "prime";
  }

  if (age <= 33) {
    return "veteran";
  }

  return "older";
}

function getOverallRange(profile: AgeProfile): NumberRange {
  const ranges: Record<AgeProfile, NumberRange> = {
    young: { min: 20, max: 32 },
    growth: { min: 24, max: 38 },
    prime: { min: 30, max: 45 },
    veteran: { min: 28, max: 42 },
    older: { min: 24, max: 38 },
  };

  return ranges[profile];
}

function getPotentialRange(profile: AgeProfile, overall: number): NumberRange {
  const ranges: Record<AgeProfile, NumberRange> = {
    young: { min: Math.max(45, overall + 8), max: 70 },
    growth: { min: Math.max(42, overall + 5), max: 68 },
    prime: { min: Math.max(38, overall), max: Math.min(70, overall + 14) },
    veteran: { min: Math.max(35, overall), max: Math.min(62, overall + 8) },
    older: { min: Math.max(35, overall), max: Math.min(55, overall + 4) },
  };

  return normalizeRange(ranges[profile]);
}

function generateGrowth(profile: AgeProfile): number {
  const ranges: Record<AgeProfile, NumberRange> = {
    young: { min: 55, max: 80 },
    growth: { min: 45, max: 72 },
    prime: { min: 28, max: 55 },
    veteran: { min: 20, max: 38 },
    older: { min: 20, max: 30 },
  };

  return randomIntFromRange(ranges[profile]);
}

function generateContractMonths(age: number): number {
  const balance = PLAYER_GENERATION_BALANCE.contractMonths;
  const maxMonths = age >= 34 ? balance.olderMax : age >= 30 ? balance.veteranMax : balance.max;

  return randomInt(balance.min, maxMonths);
}

function calculateInitialDevelopmentStage(age: number): PlayerDevelopmentStage {
  if (age <= 19) {
    return "prospect";
  }

  if (age <= 23) {
    return "developing";
  }

  if (age <= 29) {
    return "prime";
  }

  if (age <= 33) {
    return "veteran";
  }

  if (age <= 36) {
    return "declining";
  }

  return "retirement_risk";
}

function generatePlayerName(): string {
  const familyName = pick(FAMILY_NAMES);
  const givenName = pick(GIVEN_NAMES);

  return `${familyName} ${givenName}`;
}

function getSalaryAgeMultiplier(age: number): number {
  if (age <= 20) {
    return PLAYER_GENERATION_BALANCE.salary.youngDiscount;
  }

  if (age >= 34) {
    return PLAYER_GENERATION_BALANCE.salary.veteranDiscount;
  }

  return 1;
}

function getMarketAgeMultiplier(age: number): number {
  if (age <= 20) {
    return PLAYER_GENERATION_BALANCE.marketValue.youngPremium;
  }

  if (age <= 29) {
    return PLAYER_GENERATION_BALANCE.marketValue.primeMultiplier;
  }

  if (age <= 33) {
    return PLAYER_GENERATION_BALANCE.marketValue.veteranDiscount;
  }

  return PLAYER_GENERATION_BALANCE.marketValue.olderDiscount;
}

function randomIntFromRange(range: NumberRange): number {
  const normalizedRange = normalizeRange(range);
  return randomInt(normalizedRange.min, normalizedRange.max);
}

function normalizeRange(range: NumberRange): NumberRange {
  return {
    min: Math.min(range.min, range.max),
    max: Math.max(range.min, range.max),
  };
}

function roundTo(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
