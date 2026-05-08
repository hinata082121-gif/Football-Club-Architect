import type { GameState } from "@/types/game";

export const START_YEAR = 2026;
export const START_MONTH = 4;

export function getGameDateLabel(state: GameState): string {
  return formatYearMonth(state.currentYear, state.currentMonth);
}

export function advanceGameMonth(year: number, month: number): { year: number; month: number } {
  if (month >= 12) {
    return {
      year: year + 1,
      month: 1,
    };
  }

  return {
    year,
    month: month + 1,
  };
}

export function formatYearMonth(year: number | undefined, month: number | undefined): string {
  if (!year || !month) {
    return "年月未設定";
  }

  return `${year}年${month}月`;
}

export function formatDatedRecord(record: { year?: number; month?: number; turn: number }): string {
  if (record.year && record.month) {
    return formatYearMonth(record.year, record.month);
  }

  return formatYearMonthFromTurn(record.turn);
}

export function formatYearMonthFromTurn(turn: number): string {
  const elapsedMonths = Math.max(0, turn - 1);
  const monthIndex = START_MONTH - 1 + elapsedMonths;
  const year = START_YEAR + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;

  return formatYearMonth(year, month);
}
