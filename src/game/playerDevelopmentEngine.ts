import {
  PLAYER_DEVELOPMENT_BALANCE,
} from "@/game/balance";
import { calculateMarketValue } from "@/game/playerGenerator";
import { recalculateClubTeamPower } from "@/game/teamPowerEngine";
import { chance } from "@/utils/random";
import type {
  ActionLog,
  GameState,
  MatchType,
  Player,
  PlayerDevelopmentResult,
  PlayerDevelopmentStage,
} from "@/types/game";

type ExperienceMatchType = Extract<MatchType, "league" | "cup" | "training">;

export function updatePlayersMonthly(state: GameState): GameState {
  if (state.players.length === 0) {
    return state;
  }

  const aged = agePlayersIfNeeded(state.players);
  const agedState: GameState = {
    ...state,
    players: aged.players,
  };
  const developed = developPlayersMonthly(agedState);
  const stateBeforeRecalculation: GameState = {
    ...agedState,
    players: developed.players,
  };
  const recalculatedState = recalculateClubTeamPower(stateBeforeRecalculation);
  const results = mergeDevelopmentResults([...aged.results, ...developed.results]);
  const log = createMonthlyDevelopmentLog(state, recalculatedState, results);

  return {
    ...recalculatedState,
    actionLogs: log ? [log, ...recalculatedState.actionLogs] : recalculatedState.actionLogs,
  };
}

export function agePlayersIfNeeded(
  players: Player[],
): { players: Player[]; results: PlayerDevelopmentResult[] } {
  const results: PlayerDevelopmentResult[] = [];
  const agedPlayers = players.map((player) => {
    const nextMonths = player.monthsUntilBirthday - 1;

    if (nextMonths > 0) {
      return {
        ...player,
        monthsUntilBirthday: nextMonths,
        developmentStage: calculatePlayerDevelopmentStage(player),
      };
    }

    const nextAge = player.age + 1;
    const nextStage = calculatePlayerDevelopmentStage({
      ...player,
      age: nextAge,
      monthsUntilBirthday: 12,
    });
    const nextPlayer = {
      ...player,
      age: nextAge,
      monthsUntilBirthday: 12,
      developmentStage: nextStage,
    };

    results.push({
      playerId: player.id,
      playerName: player.name,
      previousOverall: player.overall,
      newOverall: player.overall,
      previousPotential: player.potential,
      newPotential: player.potential,
      ageChanged: true,
      stage: nextStage,
      notes: [`${player.name}が${nextAge}歳になりました。`],
    });

    return nextPlayer;
  });

  return { players: agedPlayers, results };
}

export function developPlayersMonthly(
  state: GameState,
): { players: Player[]; results: PlayerDevelopmentResult[] } {
  const results: PlayerDevelopmentResult[] = [];
  const players = state.players.map((player) => {
    if (player.status === "retired" || player.status === "leaving") {
      return player;
    }

    const previousOverall = player.overall;
    const previousPotential = player.potential;
    const stage = calculatePlayerDevelopmentStage(player);
    const growth = calculateMonthlyGrowth(player, state);
    const decline = calculateAgeDecline(player, state);
    const nextOverall = clamp(
      previousOverall + growth - decline,
      PLAYER_DEVELOPMENT_BALANCE.minOverall,
      Math.min(
        PLAYER_DEVELOPMENT_BALANCE.maxOverall,
        player.potential + PLAYER_DEVELOPMENT_BALANCE.potentialGrowthCapBuffer,
      ),
    );
    const potentialDecline =
      player.age >= PLAYER_DEVELOPMENT_BALANCE.potentialDeclineAge &&
      chance(PLAYER_DEVELOPMENT_BALANCE.potentialDeclineChance)
        ? 1
        : 0;
    const nextPotential = clamp(
      Math.max(nextOverall, previousPotential - potentialDecline),
      PLAYER_DEVELOPMENT_BALANCE.minPotential,
      PLAYER_DEVELOPMENT_BALANCE.maxPotential,
    );
    const nextPlayer: Player = {
      ...player,
      overall: nextOverall,
      potential: nextPotential,
      developmentStage: calculatePlayerDevelopmentStage({ ...player, overall: nextOverall }),
      experience: Math.round(player.experience * PLAYER_DEVELOPMENT_BALANCE.monthlyExperienceDecay),
      marketValue: calculateMarketValue({
        ...player,
        overall: nextOverall,
        potential: nextPotential,
      }),
    };
    const notes = createDevelopmentNotes(player, nextPlayer, growth, decline, potentialDecline);

    if (notes.length > 0) {
      results.push({
        playerId: player.id,
        playerName: player.name,
        previousOverall,
        newOverall: nextOverall,
        previousPotential,
        newPotential: nextPotential,
        ageChanged: false,
        stage,
        notes,
      });
    }

    return nextPlayer;
  });

  return { players, results };
}

export function calculatePlayerDevelopmentStage(player: Player): PlayerDevelopmentStage {
  if (player.age <= 19) {
    return "prospect";
  }

  if (player.age <= 23) {
    return "developing";
  }

  if (player.age <= 29) {
    return "prime";
  }

  if (player.age <= 33) {
    return "veteran";
  }

  if (player.age <= 36) {
    return "declining";
  }

  return "retirement_risk";
}

export function calculateMonthlyGrowth(player: Player, state: GameState): number {
  if (player.status === "injured" || player.overall >= player.potential) {
    return 0;
  }

  const stageMultiplier = getGrowthStageMultiplier(player);
  const potentialGap = Math.max(0, player.potential - player.overall);
  const youthPolicyBonus =
    state.club.policy === "youth_development"
      ? PLAYER_DEVELOPMENT_BALANCE.youthPolicyGrowthBonus
      : 0;
  const homegrownBonus = player.isHomegrown ? PLAYER_DEVELOPMENT_BALANCE.homegrownGrowthBonus : 0;
  const coachBonus = state.coach.development * PLAYER_DEVELOPMENT_BALANCE.coachDevelopmentWeight;
  const experienceBonus = player.experience * PLAYER_DEVELOPMENT_BALANCE.experienceWeight;
  const appearanceBonus =
    player.appearances * PLAYER_DEVELOPMENT_BALANCE.appearanceWeight +
    player.trainingMatchAppearances * PLAYER_DEVELOPMENT_BALANCE.trainingAppearanceWeight;
  const growthChance =
    (player.growth / PLAYER_DEVELOPMENT_BALANCE.growthBaseDivisor) *
      stageMultiplier *
      Math.min(1.4, 0.35 + potentialGap / 30) +
    youthPolicyBonus +
    homegrownBonus +
    coachBonus +
    experienceBonus +
    appearanceBonus;

  if (player.developmentStage === "prime" && !chance(PLAYER_DEVELOPMENT_BALANCE.primeSmallGrowthChance)) {
    return 0;
  }

  if (!chance(Math.min(0.88, growthChance))) {
    return 0;
  }

  return potentialGap >= 8 && chance(0.18)
    ? PLAYER_DEVELOPMENT_BALANCE.maxMonthlyGrowth
    : 1;
}

export function calculateAgeDecline(player: Player, state: GameState): number {
  const stage = calculatePlayerDevelopmentStage(player);
  let declineChance = 0;

  if (stage === "veteran") {
    declineChance = PLAYER_DEVELOPMENT_BALANCE.veteranDeclineChance;
  } else if (stage === "declining") {
    declineChance = PLAYER_DEVELOPMENT_BALANCE.decliningDeclineChance;
  } else if (stage === "retirement_risk") {
    declineChance = PLAYER_DEVELOPMENT_BALANCE.retirementRiskDeclineChance;
  } else {
    return 0;
  }

  if (player.condition < 55) {
    declineChance += PLAYER_DEVELOPMENT_BALANCE.lowConditionDeclineBonusChance;
  }

  if (player.morale >= 70) {
    declineChance -= PLAYER_DEVELOPMENT_BALANCE.moraleDeclineProtection;
  }

  if (state.coach.motivation >= 55) {
    declineChance -= PLAYER_DEVELOPMENT_BALANCE.coachMotivationDeclineProtection;
  }

  if (!chance(clamp(declineChance, 0.02, 0.72))) {
    return 0;
  }

  return stage === "retirement_risk" && chance(0.25)
    ? PLAYER_DEVELOPMENT_BALANCE.maxMonthlyDecline
    : 1;
}

export function addPlayerExperience(
  state: GameState,
  playerId: string,
  amount: number,
): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            experience: player.experience + amount,
          }
        : player,
    ),
  };
}

export function applyMatchExperienceToPlayers(
  state: GameState,
  matchType: ExperienceMatchType,
): GameState {
  const experienceBalance = PLAYER_DEVELOPMENT_BALANCE.experience[matchType];

  return {
    ...state,
    players: state.players.map((player) => {
      if (player.status === "retired" || player.status === "leaving" || player.status === "injured") {
        return player;
      }

      const baseExperience =
        player.status === "starting"
          ? experienceBalance.starting
          : player.status === "bench"
            ? experienceBalance.bench
            : matchType === "training"
              ? experienceBalance.reserve
              : 0;
      const youthBonus =
        matchType === "training" && player.age <= 23
          ? PLAYER_DEVELOPMENT_BALANCE.experience.training.youthBonus
          : 0;
      const experienceGain = baseExperience + youthBonus;

      if (experienceGain <= 0) {
        return player;
      }

      return {
        ...player,
        experience: player.experience + experienceGain,
        appearances: player.status === "starting" || player.status === "bench"
          ? player.appearances + 1
          : player.appearances,
        trainingMatchAppearances:
          matchType === "training"
            ? player.trainingMatchAppearances + 1
            : player.trainingMatchAppearances,
      };
    }),
  };
}

export function applyYouthTrainingMatchExperience(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => {
      if (
        player.age > 23 ||
        player.status === "retired" ||
        player.status === "leaving" ||
        player.status === "injured"
      ) {
        return player;
      }

      return {
        ...player,
        experience:
          player.experience +
          PLAYER_DEVELOPMENT_BALANCE.experience.training.youthFocusedBonus,
      };
    }),
  };
}

function getGrowthStageMultiplier(player: Player): number {
  const multipliers: Record<PlayerDevelopmentStage, number> = {
    prospect: 1.25,
    developing: 1.05,
    prime: 0.38,
    veteran: 0.08,
    declining: 0,
    retirement_risk: 0,
  };

  return multipliers[calculatePlayerDevelopmentStage(player)];
}

function createDevelopmentNotes(
  previous: Player,
  next: Player,
  growth: number,
  decline: number,
  potentialDecline: number,
): string[] {
  const notes: string[] = [];

  if (growth > 0) {
    notes.push(`${previous.name}の総合能力が${previous.overall}→${next.overall}に成長しました。`);
  }

  if (decline > 0) {
    notes.push(`${previous.name}の総合能力が${previous.overall}→${next.overall}に低下しました。`);
  }

  if (potentialDecline > 0) {
    notes.push(`${previous.name}の将来性が${previous.potential}→${next.potential}に変化しました。`);
  }

  return notes;
}

function mergeDevelopmentResults(
  results: PlayerDevelopmentResult[],
): PlayerDevelopmentResult[] {
  const merged = new Map<string, PlayerDevelopmentResult>();

  for (const result of results) {
    const existing = merged.get(result.playerId);

    if (!existing) {
      merged.set(result.playerId, result);
      continue;
    }

    merged.set(result.playerId, {
      ...existing,
      newOverall: result.newOverall,
      newPotential: result.newPotential,
      ageChanged: existing.ageChanged || result.ageChanged,
      stage: result.stage,
      notes: [...existing.notes, ...result.notes],
    });
  }

  return [...merged.values()];
}

function createMonthlyDevelopmentLog(
  previousState: GameState,
  nextState: GameState,
  results: PlayerDevelopmentResult[],
): ActionLog | null {
  const notableResults = results.filter(
    (result) =>
      result.ageChanged ||
      result.previousOverall !== result.newOverall ||
      result.previousPotential !== result.newPotential,
  );

  if (notableResults.length === 0) {
    return null;
  }

  const logItems = notableResults
    .slice(0, PLAYER_DEVELOPMENT_BALANCE.maxDevelopmentLogItems)
    .flatMap((result) => result.notes)
    .slice(0, PLAYER_DEVELOPMENT_BALANCE.maxDevelopmentLogItems);
  const omittedCount = Math.max(0, notableResults.length - logItems.length);
  const suffix = omittedCount > 0 ? ` ほか${omittedCount}件の変化があります。` : "";

  return {
    id: `player-development-${nextState.club.turn}-${Date.now()}`,
    turn: nextState.club.turn,
    year: nextState.currentYear,
    month: nextState.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName: "選手成長・年齢更新",
    reason: "月次処理で選手の年齢、経験、成長、衰退を反映したため。",
    result: `${logItems.join(" ")}${suffix}`,
    effects: {
      teamPower: roundOneDecimal(nextState.club.teamPower - previousState.club.teamPower),
    },
  };
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
