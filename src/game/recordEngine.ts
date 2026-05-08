import type { Match, MatchRecordsSummary, MatchType, OpponentRecord } from "@/types/game";

export function getMatchRecords(matches: Match[]): MatchRecordsSummary {
  const completedMatches = matches.filter((match) => match.result !== "pending");
  const wins = completedMatches.filter((match) => match.result === "win").length;
  const draws = completedMatches.filter((match) => match.result === "draw").length;
  const losses = completedMatches.filter((match) => match.result === "lose").length;
  const goalsFor = completedMatches.reduce((sum, match) => sum + match.goalsFor, 0);
  const goalsAgainst = completedMatches.reduce((sum, match) => sum + match.goalsAgainst, 0);

  return {
    totalMatches: completedMatches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    winRate: calculateWinRate(wins, draws, losses),
  };
}

export function getRecordsByMatchType(
  matches: Match[],
  type: MatchType,
): MatchRecordsSummary {
  return getMatchRecords(matches.filter((match) => match.type === type));
}

export function getOfficialMatchRecords(matches: Match[]): MatchRecordsSummary {
  return getMatchRecords(matches.filter((match) => match.type === "league" || match.type === "cup"));
}

export function getOpponentRecords(matches: Match[]): OpponentRecord[] {
  const completedMatches = matches.filter((match) => match.result !== "pending");
  const records = new Map<string, Match[]>();

  for (const match of completedMatches) {
    const key = match.opponentClubId ?? match.opponentName;
    records.set(key, [...(records.get(key) ?? []), match]);
  }

  return Array.from(records.values())
    .map((opponentMatches) => {
      const firstMatch = opponentMatches[0];
      const summary = getMatchRecords(opponentMatches);

      return {
        opponentClubId: firstMatch.opponentClubId,
        opponentName: firstMatch.opponentName,
        opponentOwnerName: firstMatch.opponentOwnerName,
        totalMatches: summary.totalMatches,
        wins: summary.wins,
        draws: summary.draws,
        losses: summary.losses,
        goalsFor: summary.goalsFor,
        goalsAgainst: summary.goalsAgainst,
        winRate: summary.winRate,
      };
    })
    .sort((a, b) => b.totalMatches - a.totalMatches || b.winRate - a.winRate);
}

export function getRecentMatches(matches: Match[], limit: number): Match[] {
  return [...matches]
    .filter((match) => match.result !== "pending")
    .sort((a, b) => b.turn - a.turn)
    .slice(0, limit);
}

export function calculateWinRate(wins: number, draws: number, losses: number): number {
  const totalMatches = wins + draws + losses;

  if (totalMatches === 0) {
    return 0;
  }

  return Math.round((wins / totalMatches) * 1000) / 10;
}
