"use client";

import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { GameOverScreen } from "@/components/GameOverScreen";
import { StartScreen } from "@/components/StartScreen";
import type { ActiveTab } from "@/components/AppShell";
import {
  executeFinalRecoveryOption,
  updateBankruptcyState,
} from "@/game/bankruptcyEngine";
import {
  autoSelectSquadByCoach,
  setCoachSelectionPolicy,
} from "@/game/coachSelectionEngine";
import { renewPlayerContract } from "@/game/contractEngine";
import { createInitialGameState } from "@/game/initialState";
import { takeLoan } from "@/game/loanEngine";
import { enterOfficialCompetition } from "@/game/matchEngine";
import { performPlayerAction } from "@/game/playerActionEngine";
import { executeRecoveryAction } from "@/game/recoveryActionEngine";
import { playTrainingMatch } from "@/game/trainingMatchEngine";
import { advanceTurn } from "@/game/turnEngine";
import { resolveEventChoice } from "@/game/eventEngine";
import { setScoutFocus } from "@/game/scoutEngine";
import { updateStaffDelegationLevel } from "@/game/staffManagementEngine";
import {
  releasePlayer,
  setPlayerTransferListed,
  signScoutedPlayer,
} from "@/game/transferEngine";
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

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  function handleStart(options: { clubName?: string; ownerName?: string }) {
    setGameState(createInitialGameState(options));
    setActiveTab("home");
    setGameStarted(true);
  }

  function handleResetGame() {
    setGameState(null);
    setActiveTab("home");
    setGameStarted(false);
  }

  function handlePlayerAction(action: PlayerAction) {
    setGameState((current) => (current ? performPlayerAction(current, action) : current));
  }

  function handleAdvanceTurn() {
    setGameState((current) => (current ? advanceTurn(current) : current));
  }

  function handleTrainingMatch(type: TrainingMatchType, opponent?: OpponentClub) {
    setGameState((current) => (current ? playTrainingMatch(current, type, opponent) : current));
  }

  function handleResolveEvent(eventId: string, choiceId: string) {
    setGameState((current) => (current ? resolveEventChoice(current, eventId, choiceId) : current));
  }

  function handleEnterOfficialCompetition() {
    setGameState((current) => (current ? enterOfficialCompetition(current) : current));
  }

  function handleDelegationChange(staffId: string, delegationLevel: DelegationLevel) {
    setGameState((current) =>
      current ? updateStaffDelegationLevel(current, staffId, delegationLevel) : current,
    );
  }

  function handleScoutFocusChange(focus: ScoutFocus) {
    setGameState((current) => (current ? setScoutFocus(current, focus) : current));
  }

  function handleSignScoutedPlayer(scoutedPlayerId: string) {
    setGameState((current) => (current ? signScoutedPlayer(current, scoutedPlayerId) : current));
  }

  function handleTransferListedChange(playerId: string, transferListed: boolean) {
    setGameState((current) =>
      current ? setPlayerTransferListed(current, playerId, transferListed) : current,
    );
  }

  function handleReleasePlayer(playerId: string) {
    setGameState((current) => (current ? releasePlayer(current, playerId) : current));
  }

  function handleCoachSelectionPolicyChange(policy: CoachSelectionPolicy) {
    setGameState((current) => (current ? setCoachSelectionPolicy(current, policy) : current));
  }

  function handleAutoSelectSquadByCoach() {
    setGameState((current) => (current ? autoSelectSquadByCoach(current) : current));
  }

  function handleRenewPlayerContract(playerId: string, months: number) {
    setGameState((current) => (current ? renewPlayerContract(current, playerId, months) : current));
  }

  function handleTakeLoan(offerId: string) {
    setGameState((current) => (current ? updateBankruptcyState(takeLoan(current, offerId)) : current));
  }

  function handleExecuteRecoveryAction(actionType: RecoveryActionType) {
    setGameState((current) =>
      current ? updateBankruptcyState(executeRecoveryAction(current, actionType)) : current,
    );
  }

  function handleExecuteFinalRecoveryOption(option: FinalRecoveryOptionType) {
    setGameState((current) =>
      current ? updateBankruptcyState(executeFinalRecoveryOption(current, option)) : current,
    );
  }

  if (!gameStarted || !gameState) {
    return <StartScreen onStart={handleStart} />;
  }

  if (gameState.isGameOver || gameState.bankruptcyState.isBankrupt) {
    return (
      <GameOverScreen
        gameState={gameState}
        onRestart={handleResetGame}
        onDownsizeRestart={() => handleExecuteFinalRecoveryOption("downsize_club")}
      />
    );
  }

  return (
    <Dashboard
      gameState={gameState}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onAdvanceTurn={handleAdvanceTurn}
      onPlayerAction={handlePlayerAction}
      onTrainingMatch={handleTrainingMatch}
      onResolveEvent={handleResolveEvent}
      onDelegationChange={handleDelegationChange}
      onEnterOfficialCompetition={handleEnterOfficialCompetition}
      onScoutFocusChange={handleScoutFocusChange}
      onSignScoutedPlayer={handleSignScoutedPlayer}
      onTransferListedChange={handleTransferListedChange}
      onReleasePlayer={handleReleasePlayer}
      onCoachSelectionPolicyChange={handleCoachSelectionPolicyChange}
      onAutoSelectSquadByCoach={handleAutoSelectSquadByCoach}
      onRenewPlayerContract={handleRenewPlayerContract}
      onTakeLoan={handleTakeLoan}
      onExecuteRecoveryAction={handleExecuteRecoveryAction}
      onExecuteFinalRecoveryOption={handleExecuteFinalRecoveryOption}
      onResetGame={handleResetGame}
    />
  );
}
