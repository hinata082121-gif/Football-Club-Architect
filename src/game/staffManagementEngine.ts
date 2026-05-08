import type { ActionLog, DelegationLevel, GameState } from "@/types/game";

export function updateStaffDelegationLevel(
  state: GameState,
  staffId: string,
  delegationLevel: number,
): GameState {
  if (!isDelegationLevel(delegationLevel)) {
    return state;
  }

  const targetStaff = state.staff.find((member) => member.id === staffId);

  if (!targetStaff || targetStaff.delegationLevel === delegationLevel) {
    return state;
  }

  const actionLog: ActionLog = {
    id: `delegation-change-${staffId}-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "player",
    actorName: state.ownerName,
    actionName: "委任レベル変更",
    reason: "スタッフへの業務委任範囲を調整した",
    result: `${targetStaff.name}の委任レベルを${targetStaff.delegationLevel}から${delegationLevel}へ変更しました。`,
    effects: {},
  };

  return {
    ...state,
    staff: state.staff.map((member) =>
      member.id === staffId ? { ...member, delegationLevel } : member,
    ),
    actionLogs: [actionLog, ...state.actionLogs],
  };
}

export function getDelegationLevelLabel(level: DelegationLevel): string {
  const labels: Record<DelegationLevel, string> = {
    0: "自分で担当",
    1: "提案のみ",
    2: "小規模行動のみ自動",
    3: "通常委任",
    4: "完全委任",
  };

  return labels[level];
}

export function getDelegationLevelDescription(level: DelegationLevel): string {
  const descriptions: Record<DelegationLevel, string> = {
    0: "スタッフAIは行動しません。社長が直接管理します。",
    1: "スタッフAIは提案ログだけを残し、効果は自動適用しません。",
    2: "低リスクで小規模な行動のみ自動実行します。",
    3: "通常リスクの行動まで自動実行します。",
    4: "高リスク行動も自動実行できます。ただし重大行動は承認待ちになります。",
  };

  return descriptions[level];
}

function isDelegationLevel(value: number): value is DelegationLevel {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4;
}
