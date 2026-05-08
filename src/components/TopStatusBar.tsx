import { getGameDateLabel } from "@/utils/date";
import type { GameState } from "@/types/game";

interface TopStatusBarProps {
  gameState: GameState;
  onAdvanceTurn: () => void;
  onResetGame: () => void;
}

export function TopStatusBar({ gameState, onAdvanceTurn, onResetGame }: TopStatusBarProps) {
  return (
    <header className="rounded-md border border-zinc-800 bg-zinc-950/86 p-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-emerald-300">
            Football Club Architect / AIクラブ経営シミュレーション
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-normal">
            {gameState.club.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            社長: {gameState.ownerName} / {getGameDateLabel(gameState)}
          </p>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-4 lg:min-w-[520px]">
          <Status label="資金" value={`${gameState.club.money.toLocaleString()}円`} />
          <Status label="AP" value={`${gameState.club.actionPoints}/${gameState.club.maxActionPoints}`} />
          <Status label="クラブLv" value={gameState.club.clubLevel.toString()} />
          <Status label="年月" value={getGameDateLabel(gameState)} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onResetGame}
            className="h-10 rounded-md border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            初期設定へ戻る
          </button>
          <button
            type="button"
            onClick={onAdvanceTurn}
            className="h-10 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            翌月へ進む
          </button>
        </div>
      </div>
    </header>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/88 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
