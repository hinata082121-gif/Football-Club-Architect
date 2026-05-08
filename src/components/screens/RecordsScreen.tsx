"use client";

import { useMemo, useState } from "react";
import { MatchResultCard } from "@/components/MatchResultCard";
import {
  getMatchRecords,
  getOfficialMatchRecords,
  getOpponentRecords,
  getRecentMatches,
  getRecordsByMatchType,
} from "@/game/recordEngine";
import { formatDatedRecord } from "@/utils/date";
import type {
  Match,
  MatchRecordsSummary,
  MatchResult,
  MatchType,
  OpponentRecord,
} from "@/types/game";

interface RecordsScreenProps {
  matches: Match[];
  clubName: string;
}

export function RecordsScreen({ matches, clubName }: RecordsScreenProps) {
  const recentMatches = useMemo(() => getRecentMatches(matches, 30), [matches]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const selectedMatch = recentMatches.find((match) => match.id === selectedMatchId) ?? recentMatches[0];
  const allRecords = useMemo(() => getMatchRecords(matches), [matches]);
  const officialRecords = useMemo(() => getOfficialMatchRecords(matches), [matches]);
  const leagueRecords = useMemo(() => getRecordsByMatchType(matches, "league"), [matches]);
  const cupRecords = useMemo(() => getRecordsByMatchType(matches, "cup"), [matches]);
  const trainingRecords = useMemo(() => getRecordsByMatchType(matches, "training"), [matches]);
  const opponentRecords = useMemo(() => getOpponentRecords(matches), [matches]);

  if (recentMatches.length === 0) {
    return (
      <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
        <h2 className="text-lg font-semibold">試合履歴と対戦成績</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          まだ試合履歴がありません。公式戦または練習試合を行うと、成績とレポートがここに蓄積されます。
        </p>
      </section>
    );
  }

  return (
    <section className="grid w-full max-w-full min-w-0 gap-5 overflow-hidden">
      <div className="grid min-w-0 gap-3 xl:grid-cols-4">
        <RecordSummary title="全体成績" records={allRecords} />
        <RecordSummary title="公式戦成績" records={officialRecords} />
        <RecordSummary title="練習試合成績" records={trainingRecords} />
        <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
          <h2 className="text-lg font-semibold">公式戦内訳</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <SmallRecord label="リーグ" records={leagueRecords} />
            <SmallRecord label="カップ" records={cupRecords} />
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <OpponentRecords records={opponentRecords} />
        <MatchDetail match={selectedMatch} clubName={clubName} />
      </div>

      <MatchHistory
        matches={recentMatches}
        selectedMatchId={selectedMatch?.id}
        onSelectMatch={setSelectedMatchId}
      />
    </section>
  );
}

function RecordSummary({ title, records }: { title: string; records: MatchRecordsSummary }) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
        <SummaryStat label="試合" value={records.totalMatches} />
        <SummaryStat label="勝率" value={`${records.winRate}%`} />
        <SummaryStat label="勝" value={records.wins} />
        <SummaryStat label="分" value={records.draws} />
        <SummaryStat label="敗" value={records.losses} />
        <SummaryStat label="得失点" value={formatSigned(records.goalDifference)} />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        得点 {records.goalsFor} / 失点 {records.goalsAgainst}
      </p>
    </section>
  );
}

function SmallRecord({ label, records }: { label: string; records: MatchRecordsSummary }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-zinc-300">{label}</span>
      <span className="break-words text-zinc-500">
        {records.totalMatches}試合 / {records.wins}勝 / 勝率 {records.winRate}%
      </span>
    </div>
  );
}

function OpponentRecords({ records }: { records: OpponentRecord[] }) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">対戦相手別成績</h2>
      {records.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">対戦相手別の成績はまだありません。</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {records.map((record) => (
            <li
              key={record.opponentClubId ?? record.opponentName}
              className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100">{record.opponentName}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    相手社長: {record.opponentOwnerName ?? "不明"}
                  </p>
                </div>
                <p className="break-words text-xs text-zinc-400">
                  {record.totalMatches}試合 / {record.wins}勝{record.draws}分{record.losses}敗
                </p>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                得点 {record.goalsFor} / 失点 {record.goalsAgainst} / 勝率 {record.winRate}%
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MatchHistory({
  matches,
  selectedMatchId,
  onSelectMatch,
}: {
  matches: Match[];
  selectedMatchId: string | undefined;
  onSelectMatch: (matchId: string) => void;
}) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">試合履歴一覧</h2>
          <p className="mt-1 text-sm text-zinc-400">新しい順に直近30試合を表示します。</p>
        </div>
      </div>

      <ul className="mt-4 grid gap-3">
        {matches.map((match) => {
          const selected = selectedMatchId === match.id;

          return (
            <li
              key={match.id}
              className={`rounded-md border p-3 text-sm ${
                selected
                  ? "border-emerald-300 bg-emerald-400/10"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-zinc-100">
                    {formatDatedRecord(match)} / <TypeLabel type={match.type} /> / {match.opponentName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    相手社長: {match.opponentOwnerName ?? "不明"} / {match.isHome ? "ホーム" : "アウェイ"}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                  <p className={`text-lg font-bold ${getResultClass(match.result)}`}>
                    {getResultLabel(match.result)} {match.goalsFor}-{match.goalsAgainst}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="h-9 w-full rounded-md border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:border-emerald-300 sm:w-auto"
                  >
                    詳細
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MatchDetail({ match, clubName }: { match: Match | undefined; clubName: string }) {
  if (!match) {
    return null;
  }

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold">試合詳細・レポート</h2>
      <div className="mt-4">
        <MatchResultCard match={match} clubName={clubName} />
      </div>
    </section>
  );
}

function TypeLabel({ type }: { type: MatchType }) {
  return (
    <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
      {getMatchTypeLabel(type)}
    </span>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-100">{value}</p>
    </div>
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
  if (result === "draw") return "引分";
  if (result === "lose") return "敗北";
  return "未消化";
}

function getResultClass(result: MatchResult): string {
  if (result === "win") return "text-emerald-300";
  if (result === "lose") return "text-rose-300";
  if (result === "draw") return "text-zinc-300";
  return "text-zinc-500";
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}
