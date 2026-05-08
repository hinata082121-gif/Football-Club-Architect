import { EventPanel } from "@/components/EventPanel";
import type { GameState, RandomEvent } from "@/types/game";

interface EventsScreenProps {
  gameState: GameState;
  events: RandomEvent[];
  onResolveEvent: (eventId: string, choiceId: string) => void;
}

export function EventsScreen({ gameState, events, onResolveEvent }: EventsScreenProps) {
  const pendingEvents = events.filter((event) => event.status === "pending");

  return (
    <section className="grid gap-5">
      {pendingEvents.length === 0 ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h2 className="text-lg font-semibold">発生中イベント</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            現在、未解決イベントはありません。翌月へ進むとチャンスや判断イベントが発生します。
          </p>
        </div>
      ) : (
        <EventPanel events={pendingEvents} gameState={gameState} onResolve={onResolveEvent} />
      )}
    </section>
  );
}
