import { formatDatedRecord } from "@/utils/date";
import type { Match, MatchResult, MatchType, ScoreBreakdown, StatEffects } from "@/types/game";

interface MatchResultCardProps {
  match: Match;
  clubName: string;
  compact?: boolean;
}

export function MatchResultCard({ match, clubName, compact = false }: MatchResultCardProps) {
  const report = match.report;

  return (
    <article className="rounded-md border border-zinc-800 bg-zinc-950/55 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs text-zinc-500">
            {getMatchTypeLabel(match.type)} | {formatDatedRecord(match)} | {match.isHome ? "ホーム" : "アウェイ"}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <p className="text-lg font-semibold text-zinc-100">{clubName}</p>
            <p className="text-3xl font-bold tracking-normal text-zinc-50">
              {match.goalsFor} - {match.goalsAgainst}
            </p>
            <div className="sm:text-right">
              <p className="text-lg font-semibold text-zinc-100">{match.opponentName}</p>
              <p className="mt-1 text-xs text-zinc-500">相手社長: {match.opponentOwnerName ?? "不明"}</p>
            </div>
          </div>
        </div>
        <ResultBadge result={match.result} />
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-zinc-100">主な変化</p>
        <EffectGrid effects={match.postMatchEffects ?? {}} />
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-4 text-sm">
          <section>
            <h3 className="text-sm font-semibold text-zinc-100">試合総評</h3>
            <p className="mt-2 leading-6 text-zinc-300">{report.summary}</p>
          </section>
          <ReportList title="勝因 / 敗因" items={report.reasons} />
          <ReportList title="良かった点" items={report.positives} />
          <ReportList title="改善点" items={report.improvements} />
          <ReportList title="次におすすめの行動" items={report.recommendedActions ?? []} />
          <ScoreBreakdownGrid breakdown={report.scoreBreakdown} />
        </div>
      ) : null}
    </article>
  );
}

function ResultBadge({ result }: { result: MatchResult }) {
  const className =
    result === "win"
      ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
      : result === "lose"
        ? "border-rose-300/40 bg-rose-400/15 text-rose-100"
        : result === "draw"
          ? "border-zinc-400/40 bg-zinc-400/10 text-zinc-100"
          : "border-zinc-700 bg-zinc-800 text-zinc-300";

  return (
    <div className={`rounded-md border px-5 py-3 text-center ${className}`}>
      <p className="text-xs text-current/80">結果</p>
      <p className="mt-1 text-2xl font-bold tracking-normal">{getResultLabel(result)}</p>
    </div>
  );
}

function EffectGrid({ effects }: { effects: StatEffects }) {
  const entries: [keyof StatEffects, number | undefined][] = [
    ["money", effects.money],
    ["fans", effects.fans],
    ["reputation", effects.reputation],
    ["teamwork", effects.teamwork],
    ["condition", effects.condition],
    ["coachExperience", effects.coachExperience],
  ];
  const visibleEntries = entries.filter(([, value]) => value !== undefined && value !== 0);

  if (visibleEntries.length === 0) {
    return <p className="mt-2 text-xs text-zinc-500">目立つ数値変化はありません。</p>;
  }

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {visibleEntries.map(([key, value]) => (
        <div key={key} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
          <p className="text-xs text-zinc-500">{getEffectLabel(key)}</p>
          <p className={Number(value) >= 0 ? "mt-1 font-semibold text-emerald-200" : "mt-1 font-semibold text-rose-200"}>
            {formatEffectValue(key, Number(value))}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScoreBreakdownGrid({ breakdown }: { breakdown: ScoreBreakdown }) {
  const items = [
    ["チーム戦力", breakdown.teamPower],
    ["スタメン戦力", breakdown.startingPower],
    ["控え層補正", breakdown.benchDepth],
    ["編成コンディション補正", breakdown.conditionModifier],
    ["編成連携補正", breakdown.teamworkModifier],
    ["編成監督補正", breakdown.coachModifier],
    ["連携補正", breakdown.teamwork],
    ["コンディション補正", breakdown.condition],
    ["監督Lv補正", breakdown.coachLevel],
    ["戦術補正", breakdown.tactics],
    ["采配補正", breakdown.inGameManagement],
    ["ホーム補正", breakdown.homeAdvantage],
    ["運要素", breakdown.luck],
    ["相手戦力", breakdown.opponentPower],
    ["相手運要素", breakdown.opponentLuck],
  ];

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-100">数値内訳</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {items.filter(([, value]) => value !== undefined).map(([label, value]) => (
          <div key={label} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2 text-xs">
            <p className="text-zinc-500">{label}</p>
            <p className="mt-1 font-semibold text-zinc-100">{formatSigned(Number(value))}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        自クラブ合計 {breakdown.total} / 相手合計 {breakdown.opponentTotal} / 差分{" "}
        {formatSigned(breakdown.powerDifference)}
      </p>
    </section>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function getMatchTypeLabel(type: MatchType): string {
  const labels: Record<MatchType, string> = {
    league: "公式戦",
    cup: "カップ戦",
    training: "練習試合",
  };

  return labels[type];
}

function getResultLabel(result: MatchResult): string {
  if (result === "win") return "勝利";
  if (result === "draw") return "引き分け";
  if (result === "lose") return "敗北";
  return "未消化";
}

function getEffectLabel(key: keyof StatEffects): string {
  const labels: Record<keyof StatEffects, string> = {
    money: "獲得資金",
    fans: "ファン増減",
    reputation: "評判変動",
    teamPower: "チーム戦力",
    teamwork: "チーム連携",
    condition: "コンディション",
    actionPoints: "AP",
    clubLevel: "クラブLv",
    stadiumCapacity: "収容人数",
    goodsPower: "グッズ力",
    sponsorPower: "スポンサー力",
    coachExperience: "監督経験値",
    coachLevel: "監督Lv",
    coachDevelopment: "監督育成",
    staffDissatisfaction: "スタッフ不満",
    staffLoyalty: "スタッフ忠誠",
  };

  return labels[key];
}

function formatEffectValue(key: keyof StatEffects, value: number): string {
  const formatted = `${value > 0 ? "+" : ""}${value.toLocaleString()}`;

  if (key === "money") return `${formatted}円`;
  return formatted;
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}
