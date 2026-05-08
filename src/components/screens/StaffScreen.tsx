import { StaffPanel } from "@/components/StaffPanel";
import { TURN_BALANCE } from "@/game/balance";
import type { DelegationLevel, Staff } from "@/types/game";

interface StaffScreenProps {
  staff: Staff[];
  onDelegationChange: (staffId: string, delegationLevel: DelegationLevel) => void;
}

export function StaffScreen({ staff, onDelegationChange }: StaffScreenProps) {
  const unhappyStaff = staff.filter(
    (member) => member.dissatisfaction >= TURN_BALANCE.highDissatisfactionWarning,
  );

  return (
    <section className="grid gap-5">
      {unhappyStaff.length > 0 ? (
        <div className="rounded-md border border-amber-400/30 bg-amber-950/20 p-4 text-sm text-amber-100">
          不満が高いスタッフが{unhappyStaff.length}人います。提案のみへの変更やイベント対応を検討してください。
        </div>
      ) : null}
      <StaffPanel staff={staff} onDelegationChange={onDelegationChange} />
      <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <h2 className="text-lg font-semibold">スタッフ育成</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          MVPでは育成専用コマンドは未実装です。月次進行、委任、イベント対応を通じて運用感を確認します。
        </p>
      </section>
    </section>
  );
}
