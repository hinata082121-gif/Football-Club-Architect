import type { ActiveTab } from "@/components/AppShell";

interface TaskBarProps {
  activeTab: ActiveTab;
  eventCount: number;
  staffWarningCount: number;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "home", label: "ホーム" },
  { id: "actions", label: "行動" },
  { id: "squad", label: "編成" },
  { id: "staff", label: "スタッフ" },
  { id: "matches", label: "試合" },
  { id: "records", label: "成績" },
  { id: "finance", label: "財務" },
  { id: "logs", label: "ログ" },
  { id: "events", label: "イベント" },
];

export function TaskBar({
  activeTab,
  eventCount,
  staffWarningCount,
  onTabChange,
}: TaskBarProps) {
  return (
    <nav
      aria-label="メイン画面切り替え"
      className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950/82 p-2 backdrop-blur"
    >
      <div className="flex min-w-max gap-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const badgeCount = tab.id === "events" ? eventCount : tab.id === "staff" ? staffWarningCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`relative h-10 rounded-md px-4 text-sm font-semibold transition ${
                active
                  ? "bg-emerald-400 text-zinc-950"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
              }`}
            >
              {tab.label}
              {badgeCount > 0 ? (
                <span
                  className={`ml-2 inline-flex min-w-5 justify-center rounded-full px-1.5 py-0.5 text-xs ${
                    active ? "bg-zinc-950 text-emerald-300" : "bg-amber-400 text-zinc-950"
                  }`}
                >
                  {badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
