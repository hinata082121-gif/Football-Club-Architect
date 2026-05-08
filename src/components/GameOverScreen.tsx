import { getMatchRecords } from "@/game/recordEngine";
import { getGameDateLabel } from "@/utils/date";
import type { GameState } from "@/types/game";

interface GameOverScreenProps {
  gameState: GameState;
  onRestart: () => void;
  onDownsizeRestart: () => void;
}

export function GameOverScreen({
  gameState,
  onRestart,
  onDownsizeRestart,
}: GameOverScreenProps) {
  const records = getMatchRecords(gameState.matches);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-50">
      <section className="mx-auto grid max-w-4xl gap-5 rounded-md border border-rose-400/45 bg-zinc-900/90 p-6 shadow-2xl">
        <div>
          <p className="text-sm font-semibold text-rose-200">Football Club Architect / GAME OVER</p>
          <h1 className="mt-2 text-3xl font-semibold">経営破綻</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            {gameState.gameOverReason ?? gameState.bankruptcyState.bankruptcyReason ?? "債務超過状態を改善できず、クラブ経営が終了しました。"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="クラブ" value={gameState.club.name} />
          <Stat label="社長" value={gameState.ownerName} />
          <Stat label="最終年月" value={getGameDateLabel(gameState)} />
          <Stat label="クラブLv" value={gameState.club.clubLevel.toString()} />
          <Stat label="最終資金" value={`${gameState.club.money.toLocaleString()}円`} />
          <Stat label="通算試合" value={`${records.totalMatches}試合`} />
          <Stat label="通算勝利" value={`${records.wins}勝`} />
          <Stat label="最終ファン" value={`${gameState.club.fans.toLocaleString()}人`} />
          <Stat label="最終戦力" value={gameState.club.teamPower.toFixed(1)} />
          <Stat label="勝率" value={`${records.winRate}%`} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {gameState.bankruptcyState.canDownsizeRestart ? (
            <button
              type="button"
              onClick={onDownsizeRestart}
              className="h-11 rounded-md bg-amber-300 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200"
            >
              ペナルティ付きで縮小再建
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRestart}
            className="h-11 rounded-md border border-zinc-700 px-5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-300 hover:text-emerald-200"
          >
            新しく始める
          </button>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
