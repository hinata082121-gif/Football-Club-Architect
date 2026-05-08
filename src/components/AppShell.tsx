import { TaskBar } from "@/components/TaskBar";
import { TopStatusBar } from "@/components/TopStatusBar";
import { getStadiumBackgroundByClubLevel } from "@/utils/background";
import type { ReactNode } from "react";
import type { GameState } from "@/types/game";

export type ActiveTab =
  | "home"
  | "actions"
  | "squad"
  | "staff"
  | "matches"
  | "records"
  | "finance"
  | "logs"
  | "events";

interface AppShellProps {
  gameState: GameState;
  activeTab: ActiveTab;
  eventCount: number;
  staffWarningCount: number;
  children: ReactNode;
  onTabChange: (tab: ActiveTab) => void;
  onAdvanceTurn: () => void;
  onResetGame: () => void;
}

export function AppShell({
  gameState,
  activeTab,
  eventCount,
  staffWarningCount,
  children,
  onTabChange,
  onAdvanceTurn,
  onResetGame,
}: AppShellProps) {
  const backgroundUrl = getStadiumBackgroundByClubLevel(gameState.club.clubLevel);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 bg-cover bg-fixed bg-center text-zinc-100"
      style={{
        backgroundColor: "#020617",
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/68" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-slate-950/25 to-slate-950/85" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5">
        <TopStatusBar
          gameState={gameState}
          onAdvanceTurn={onAdvanceTurn}
          onResetGame={onResetGame}
        />
        <TaskBar
          activeTab={activeTab}
          eventCount={eventCount}
          staffWarningCount={staffWarningCount}
          onTabChange={onTabChange}
        />
        <div className="pb-8">{children}</div>
      </div>
    </main>
  );
}
