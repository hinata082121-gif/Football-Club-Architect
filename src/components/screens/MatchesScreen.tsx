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
    <section className="grid w-full max-w-full min-w-0 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
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
