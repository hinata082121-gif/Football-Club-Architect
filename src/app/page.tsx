"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { GameOverScreen } from "@/components/GameOverScreen";
import { MonthAdvanceConfirmModal } from "@/components/MonthAdvanceConfirmModal";
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
import { createMonthlyResultSummary } from "@/game/monthlySummaryEngine";
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

const SAVE_KEY = "football-club-architect-save-v1";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isSaveLoaded, setIsSaveLoaded] = useState(false);
  const [isAdvanceConfirmOpen, setIsAdvanceConfirmOpen] = useState(false);
  const [dismissedMonthlySummaryKey, setDismissedMonthlySummaryKey] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(SAVE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved) as GameState;
          setGameState(normalizeLoadedGameState(parsed));
          setGameStarted(true);
          setActiveTab("home");
        }
      } catch (error) {
        console.error("Failed to load saved game:", error);
        window.localStorage.removeItem(SAVE_KEY);
      } finally {
        setIsSaveLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isSaveLoaded) {
      return;
    }

    try {
      if (gameStarted && gameState) {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      }
    } catch (error) {
      console.error("Failed to save game:", error);
    }
  }, [gameState, gameStarted, isSaveLoaded]);

  function handleStart(options: { clubName?: string; ownerName?: string }) {
    setGameState(createInitialGameState(options));
    setActiveTab("home");
    setIsAdvanceConfirmOpen(false);
    setDismissedMonthlySummaryKey(null);
    setGameStarted(true);
  }

  function handleResetGame() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error("Failed to reset saved game:", error);
    }

    setGameState(null);
    setActiveTab("home");
    setIsAdvanceConfirmOpen(false);
    setDismissedMonthlySummaryKey(null);
    setGameStarted(false);
  }

  function handlePlayerAction(action: PlayerAction) {
    setGameState((current) => (current ? performPlayerAction(current, action) : current));
  }

  function handleAdvanceTurn() {
    setIsAdvanceConfirmOpen(true);
  }

  function handleConfirmAdvanceTurn() {
    setGameState((current) => {
      if (!current) {
        return current;
      }

      const before = current;
      const after = advanceTurn(current);
      const summary = createMonthlyResultSummary(before, after);

      return {
        ...after,
        lastMonthlyResultSummary: summary,
      };
    });
    setDismissedMonthlySummaryKey(null);
    setIsAdvanceConfirmOpen(false);
    setActiveTab("home");
  }

  function handleDismissMonthlySummary() {
    const summary = gameState?.lastMonthlyResultSummary;

    if (!summary) {
      return;
    }

    setDismissedMonthlySummaryKey(`${summary.year}-${summary.month}`);
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

  if (!isSaveLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl bg-black/60 px-6 py-4">
          セーブデータを読み込み中...
        </div>
      </div>
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
    <>
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
        dismissedMonthlySummaryKey={dismissedMonthlySummaryKey}
        onDismissMonthlySummary={handleDismissMonthlySummary}
      />
      {isAdvanceConfirmOpen ? (
        <MonthAdvanceConfirmModal
          gameState={gameState}
          onCancel={() => setIsAdvanceConfirmOpen(false)}
          onConfirm={handleConfirmAdvanceTurn}
        />
      ) : null}
    </>
  );
}

function normalizeLoadedGameState(saved: GameState): GameState {
  const fallback = createInitialGameState({
    clubName: saved.club?.name,
    ownerName: saved.ownerName,
  });
  const officialCompetitionEntry = saved.officialCompetitionEntry;

  return {
    ...fallback,
    ...saved,
    club: {
      ...fallback.club,
      ...saved.club,
    },
    coach: {
      ...fallback.coach,
      ...saved.coach,
    },
    staff: saved.staff ?? fallback.staff,
    players: saved.players ?? fallback.players,
    scoutedPlayers: saved.scoutedPlayers ?? fallback.scoutedPlayers,
    matches: saved.matches ?? [],
    actionLogs: saved.actionLogs ?? [],
    financeLogs: saved.financeLogs ?? [],
    events: saved.events ?? [],
    loans: saved.loans ?? [],
    contractAlerts: saved.contractAlerts ?? [],
    bankruptcyState: saved.bankruptcyState ?? fallback.bankruptcyState,
    financialHealth: saved.financialHealth ?? fallback.financialHealth,
    sponsorAdvance: saved.sponsorAdvance,
    lastMonthlyResultSummary: saved.lastMonthlyResultSummary,
    officialCompetitionEntry,
    hasEnteredOfficialCompetition: Boolean(
      officialCompetitionEntry?.active || saved.scheduledOfficialMatch,
    ),
  };
}
