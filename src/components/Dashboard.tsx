import { AppShell, type ActiveTab } from "@/components/AppShell";
import { ActionsScreen } from "@/components/screens/ActionsScreen";
import { EventsScreen } from "@/components/screens/EventsScreen";
import { FinanceScreen } from "@/components/screens/FinanceScreen";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LogsScreen } from "@/components/screens/LogsScreen";
import { MatchesScreen } from "@/components/screens/MatchesScreen";
import { RecordsScreen } from "@/components/screens/RecordsScreen";
import { SquadScreen } from "@/components/screens/SquadScreen";
import { StaffScreen } from "@/components/screens/StaffScreen";
import { TURN_BALANCE } from "@/game/balance";
import type {
  CoachSelectionPolicy,
  DelegationLevel,
  FinalRecoveryOptionType,
  GameState,
  OpponentClub,
  PlayerAction,
  RecoveryActionType,
  ScoutFocus,
  TrainingMatchType,
} from "@/types/game";

interface DashboardProps {
  gameState: GameState;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onAdvanceTurn: () => void;
  onPlayerAction: (action: PlayerAction) => void;
  onTrainingMatch: (type: TrainingMatchType, opponent?: OpponentClub) => void;
  onResolveEvent: (eventId: string, choiceId: string) => void;
  onDelegationChange: (staffId: string, delegationLevel: DelegationLevel) => void;
  onEnterOfficialCompetition: () => void;
  onScoutFocusChange: (focus: ScoutFocus) => void;
  onSignScoutedPlayer: (scoutedPlayerId: string) => void;
  onTransferListedChange: (playerId: string, transferListed: boolean) => void;
  onReleasePlayer: (playerId: string) => void;
  onCoachSelectionPolicyChange: (policy: CoachSelectionPolicy) => void;
  onAutoSelectSquadByCoach: () => void;
  onRenewPlayerContract: (playerId: string, months: number) => void;
  onTakeLoan: (offerId: string) => void;
  onExecuteRecoveryAction: (actionType: RecoveryActionType) => void;
  onExecuteFinalRecoveryOption: (option: FinalRecoveryOptionType) => void;
  onResetGame: () => void;
  dismissedMonthlySummaryKey: string | null;
  onDismissMonthlySummary: () => void;
}

export function Dashboard({
  gameState,
  activeTab,
  onTabChange,
  onAdvanceTurn,
  onPlayerAction,
  onTrainingMatch,
  onResolveEvent,
  onDelegationChange,
  onEnterOfficialCompetition,
  onScoutFocusChange,
  onSignScoutedPlayer,
  onTransferListedChange,
  onReleasePlayer,
  onCoachSelectionPolicyChange,
  onAutoSelectSquadByCoach,
  onRenewPlayerContract,
  onTakeLoan,
  onExecuteRecoveryAction,
  onExecuteFinalRecoveryOption,
  onResetGame,
  dismissedMonthlySummaryKey,
  onDismissMonthlySummary,
}: DashboardProps) {
  const pendingEvents = gameState.events.filter((event) => event.status === "pending");
  const staffWarningCount = gameState.staff.filter(
    (member) => member.dissatisfaction >= TURN_BALANCE.highDissatisfactionWarning,
  ).length;

  return (
    <AppShell
      gameState={gameState}
      activeTab={activeTab}
      eventCount={pendingEvents.length}
      staffWarningCount={staffWarningCount}
      onTabChange={onTabChange}
      onAdvanceTurn={onAdvanceTurn}
      onResetGame={onResetGame}
    >
      {renderActiveScreen()}
    </AppShell>
  );

  function renderActiveScreen() {
    if (activeTab === "home") {
      return (
        <HomeScreen
          gameState={gameState}
          onTabChange={onTabChange}
          onExecuteFinalRecoveryOption={onExecuteFinalRecoveryOption}
          dismissedMonthlySummaryKey={dismissedMonthlySummaryKey}
          onDismissMonthlySummary={onDismissMonthlySummary}
        />
      );
    }
    if (activeTab === "actions") {
      return (
        <ActionsScreen
          gameState={gameState}
          onPlayerAction={onPlayerAction}
          onEnterOfficialCompetition={onEnterOfficialCompetition}
          onTakeLoan={onTakeLoan}
          onExecuteRecoveryAction={onExecuteRecoveryAction}
        />
      );
    }
    if (activeTab === "staff") {
      return <StaffScreen staff={gameState.staff} onDelegationChange={onDelegationChange} />;
    }
    if (activeTab === "squad") {
      return (
        <SquadScreen
          gameState={gameState}
          onScoutFocusChange={onScoutFocusChange}
          onSignScoutedPlayer={onSignScoutedPlayer}
          onTransferListedChange={onTransferListedChange}
          onReleasePlayer={onReleasePlayer}
          onCoachSelectionPolicyChange={onCoachSelectionPolicyChange}
          onAutoSelectSquadByCoach={onAutoSelectSquadByCoach}
          onRenewPlayerContract={onRenewPlayerContract}
        />
      );
    }
    if (activeTab === "matches") {
      return (
        <MatchesScreen
          gameState={gameState}
          onTrainingMatch={onTrainingMatch}
          onEnterOfficialCompetition={onEnterOfficialCompetition}
        />
      );
    }
    if (activeTab === "records") {
      return <RecordsScreen matches={gameState.matches} clubName={gameState.club.name} />;
    }
    if (activeTab === "finance") {
      return (
        <FinanceScreen
          gameState={gameState}
          onTakeLoan={onTakeLoan}
          onExecuteRecoveryAction={onExecuteRecoveryAction}
          onExecuteFinalRecoveryOption={onExecuteFinalRecoveryOption}
        />
      );
    }
    if (activeTab === "logs") {
      return <LogsScreen logs={gameState.actionLogs} />;
    }
    if (activeTab === "glossary") {
      return <GlossaryPanel />;
    }

    return <EventsScreen gameState={gameState} events={gameState.events} onResolveEvent={onResolveEvent} />;
  }
}
