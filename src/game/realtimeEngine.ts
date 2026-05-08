import { updatePlayersMonthly } from "@/game/playerDevelopmentEngine";
import type { GameState } from "@/types/game";

/**
 * MVPではリアル日程連動を使わないため、年月進行時の選手更新だけを薄く橋渡しする。
 * 将来リアルカレンダー連動を入れる場合は、この関数をスケジューラ側から呼ぶ。
 */
export function applyRealtimeMonthlyPlayerProgression(state: GameState): GameState {
  return updatePlayersMonthly(state);
}
