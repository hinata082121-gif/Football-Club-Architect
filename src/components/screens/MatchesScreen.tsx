import { MatchPanel } from "@/components/MatchPanel";
import { TrainingMatchPanel } from "@/components/TrainingMatchPanel";
import type { GameState, OpponentClub, TrainingMatchType } from "@/types/game";

interface MatchesScreenProps {
  gameState: GameState;
  onTrainingMatch: (type: TrainingMatchType, opponent?: OpponentClub) => void;
  onEnterOfficialCompetition: () => void;
}

export function MatchesScreen({
  gameState,
  onTrainingMatch,
  onEnterOfficialCompetition,
}: MatchesScreenProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <MatchPanel
        gameState={gameState}
        latestMatch={gameState.matches[0]}
        report={gameState.lastMatchReport}
        onEnterOfficialCompetition={onEnterOfficialCompetition}
      />
      <TrainingMatchPanel gameState={gameState} onPlayTrainingMatch={onTrainingMatch} />
    </section>
  );
}
