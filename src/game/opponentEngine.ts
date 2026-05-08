import type {
  GameState,
  Match,
  MatchType,
  OpponentClub,
  OpponentPlayStyle,
  TrainingMatchType,
} from "@/types/game";
import { randomInt } from "@/utils/random";

const CLUB_NAMES = [
  "Harbor Lights FC",
  "Sakura United",
  "Kita Ward Eleven",
  "Aoba City Club",
  "River Gate SC",
  "Minami Works FC",
  "Shiroyama Athletic",
  "East Line FC",
  "Bay Breeze United",
  "Midorigaoka Stars",
];

const OWNER_NAMES = [
  "田中社長",
  "佐々木オーナー",
  "Mika President",
  "Hayato GM",
  "Kobayashi社長",
  "Nao代表",
  "伊藤オーナー",
  "Rin Club Boss",
];

const PLAY_STYLES: OpponentPlayStyle[] = [
  "balanced",
  "attacking",
  "defensive",
  "youth",
  "commercial",
  "data_driven",
];

export function generateOpponentClubs(state: GameState, count: number): OpponentClub[] {
  return Array.from({ length: count }, (_, index) =>
    createOpponentClub(state, index, {
      powerOffset: randomInt(-8, 8),
      levelOffset: randomInt(-1, 1),
    }),
  );
}

export function findOfficialMatchOpponent(state: GameState): OpponentClub {
  const candidates = generateOpponentClubs(state, 8);

  return candidates
    .map((opponent) => ({
      opponent,
      score:
        Math.abs(opponent.clubLevel - state.club.clubLevel) * 8 +
        Math.abs(opponent.reputation - state.club.reputation) +
        Math.abs(opponent.teamPower - state.club.teamPower),
    }))
    .sort((a, b) => a.score - b.score)[0].opponent;
}

export function getTrainingMatchOpponents(
  state: GameState,
  type: TrainingMatchType,
): OpponentClub[] {
  const config = getTrainingOpponentConfig(type);

  return Array.from({ length: 3 }, (_, index) =>
    createOpponentClub(state, index, {
      powerOffset: randomInt(config.minPowerOffset, config.maxPowerOffset),
      levelOffset: randomInt(config.minLevelOffset, config.maxLevelOffset),
      preferredStyle: config.preferredStyle,
      localProfile: type === "local",
    }),
  );
}

export function convertOpponentToMatchInput(
  opponent: OpponentClub,
  type: MatchType,
): Partial<Match> {
  return {
    type,
    opponentName: opponent.clubName,
    opponentClubId: opponent.id,
    opponentOwnerName: opponent.ownerName,
    opponentClubLevel: opponent.clubLevel,
    opponentPlayStyle: opponent.playStyle,
    opponentPower: opponent.teamPower,
  };
}

function createOpponentClub(
  state: GameState,
  index: number,
  options: {
    powerOffset: number;
    levelOffset: number;
    preferredStyle?: OpponentPlayStyle;
    localProfile?: boolean;
  },
): OpponentClub {
  const playStyle = options.preferredStyle ?? pick(PLAY_STYLES);
  const clubLevel = Math.max(1, state.club.clubLevel + options.levelOffset);
  const teamPower = clamp(state.club.teamPower + options.powerOffset + getStylePowerBonus(playStyle), 8, 96);
  const reputationBase = options.localProfile ? state.club.reputation : state.club.reputation + randomInt(-4, 6);
  const fanBase = options.localProfile ? state.club.fans + randomInt(-120, 160) : state.club.fans + randomInt(-180, 260);

  return {
    id: `pseudo-opponent-${state.club.turn}-${typeSafeSlug(playStyle)}-${index}-${Date.now()}`,
    clubName: CLUB_NAMES[(state.club.turn + index + randomInt(0, CLUB_NAMES.length - 1)) % CLUB_NAMES.length],
    ownerName: OWNER_NAMES[(state.club.clubLevel + index + randomInt(0, OWNER_NAMES.length - 1)) % OWNER_NAMES.length],
    clubLevel,
    reputation: clamp(reputationBase, 1, 100),
    fans: Math.max(50, fanBase),
    teamPower,
    teamwork: clamp(state.club.teamwork + randomInt(-10, 10) + getStyleTeamworkBonus(playStyle), 5, 100),
    coachLevel: Math.max(1, state.coach.level + randomInt(-1, 2)),
    playStyle,
  };
}

function getTrainingOpponentConfig(type: TrainingMatchType): {
  minPowerOffset: number;
  maxPowerOffset: number;
  minLevelOffset: number;
  maxLevelOffset: number;
  preferredStyle?: OpponentPlayStyle;
} {
  const configs: Record<TrainingMatchType, {
    minPowerOffset: number;
    maxPowerOffset: number;
    minLevelOffset: number;
    maxLevelOffset: number;
    preferredStyle?: OpponentPlayStyle;
  }> = {
    weaker: { minPowerOffset: -16, maxPowerOffset: -6, minLevelOffset: -1, maxLevelOffset: 0 },
    equal: { minPowerOffset: -5, maxPowerOffset: 5, minLevelOffset: -1, maxLevelOffset: 1 },
    stronger: { minPowerOffset: 7, maxPowerOffset: 16, minLevelOffset: 0, maxLevelOffset: 2 },
    local: { minPowerOffset: -8, maxPowerOffset: 4, minLevelOffset: -1, maxLevelOffset: 1, preferredStyle: "balanced" },
    youth: { minPowerOffset: -10, maxPowerOffset: 2, minLevelOffset: -1, maxLevelOffset: 1, preferredStyle: "youth" },
  };

  return configs[type];
}

function getStylePowerBonus(style: OpponentPlayStyle): number {
  if (style === "attacking") return 2;
  if (style === "defensive") return -1;
  if (style === "youth") return -2;
  if (style === "data_driven") return 1;
  return 0;
}

function getStyleTeamworkBonus(style: OpponentPlayStyle): number {
  if (style === "balanced") return 3;
  if (style === "defensive") return 4;
  if (style === "data_driven") return 2;
  if (style === "attacking") return -1;
  return 0;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function typeSafeSlug(value: string): string {
  return value.replaceAll("_", "-");
}
