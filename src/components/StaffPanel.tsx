import {
  getDelegationLevelDescription,
  getDelegationLevelLabel,
} from "@/game/staffManagementEngine";
import type { DelegationLevel, Staff } from "@/types/game";

interface StaffPanelProps {
  staff: Staff[];
  onDelegationChange: (staffId: string, delegationLevel: DelegationLevel) => void;
}

const DELEGATION_LEVELS: DelegationLevel[] = [0, 1, 2, 3, 4];

export function StaffPanel({ staff, onDelegationChange }: StaffPanelProps) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">スタッフAI</h2>
      <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-5 text-zinc-400">
        {DELEGATION_LEVELS.map((level) => (
          <p key={level}>
            {level}: {getDelegationLevelLabel(level)} - {getDelegationLevelDescription(level)}
          </p>
        ))}
      </div>
      {staff.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          まだスタッフはいません。社長アクションの「スタッフ雇用」で追加できます。
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {staff.map((member) => (
            <li key={member.id} className="rounded-md border border-zinc-800 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {member.role} / {member.specialty} / {member.personality}
                  </p>
                </div>
                <label className="text-xs text-zinc-400">
                  委任
                  <select
                    value={member.delegationLevel}
                    onChange={(event) =>
                      onDelegationChange(member.id, Number(event.target.value) as DelegationLevel)
                    }
                    className="ml-2 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                  >
                    {DELEGATION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}: {getDelegationLevelLabel(level)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                現在: {getDelegationLevelDescription(member.delegationLevel)}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 md:grid-cols-4">
                <Stat label="Lv" value={member.level} />
                <Stat label="判断" value={member.judgment} />
                <Stat label="成長" value={member.growth} />
                <Stat label="忠誠" value={member.loyalty} />
                <Stat label="不満" value={member.dissatisfaction} />
                <Stat label="AI精度" value={member.aiAccuracy} />
                <Stat label="給与" value={`${member.salary.toLocaleString()}円`} />
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="mt-1 font-medium text-zinc-100">{value}</dd>
    </div>
  );
}
