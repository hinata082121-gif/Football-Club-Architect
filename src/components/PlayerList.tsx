import { PlayerCard } from "@/components/PlayerCard";
import type { GameState, Player } from "@/types/game";

interface PlayerListProps {
  title: string;
  players: Player[];
  emptyMessage?: string;
  gameState?: GameState;
  onTransferListedChange?: (playerId: string, transferListed: boolean) => void;
  onReleasePlayer?: (playerId: string) => void;
  onRenewPlayerContract?: (playerId: string, months: number) => void;
}

export function PlayerList({
  title,
  players,
  emptyMessage = "該当する選手はいません。",
  gameState,
  onTransferListedChange,
  onReleasePlayer,
  onRenewPlayerContract,
}: PlayerListProps) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
        <span className="rounded bg-zinc-950/70 px-2 py-1 text-xs font-semibold text-zinc-300">
          {players.length}人
        </span>
      </div>

      {players.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-zinc-700 bg-zinc-950/40 p-4 text-sm text-zinc-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              gameState={gameState}
              onTransferListedChange={onTransferListedChange}
              onReleasePlayer={onReleasePlayer}
              onRenewPlayerContract={onRenewPlayerContract}
            />
          ))}
        </div>
      )}
    </section>
  );
}
