export type ClubVisualStage = "grassroots" | "regional" | "professional" | "elite";

const STADIUM_BACKGROUNDS: Record<ClubVisualStage, string> = {
  grassroots: "/backgrounds/stadium-level-1.png",
  regional: "/backgrounds/stadium-level-2.png",
  professional: "/backgrounds/stadium-level-3.png",
  elite: "/backgrounds/stadium-level-4.png",
};

export function getClubVisualStage(clubLevel: number): ClubVisualStage {
  if (clubLevel <= 2) {
    return "grassroots";
  }

  if (clubLevel <= 4) {
    return "regional";
  }

  if (clubLevel <= 6) {
    return "professional";
  }

  return "elite";
}

export function getStadiumBackgroundByClubLevel(clubLevel: number): string {
  return STADIUM_BACKGROUNDS[getClubVisualStage(clubLevel)];
}
