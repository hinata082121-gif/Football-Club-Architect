"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CLUB_NAME_MAX_LENGTH,
  DEFAULT_CLUB_NAME,
  DEFAULT_OWNER_NAME,
  OWNER_NAME_MAX_LENGTH,
} from "@/game/initialState";

interface StartScreenProps {
  onStart: (options: { clubName?: string; ownerName?: string }) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [clubName, setClubName] = useState("");
  const [ownerName, setOwnerName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onStart({
      clubName,
      ownerName,
    });
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-zinc-950 bg-cover bg-center px-5 py-8 text-zinc-100"
      style={{
        backgroundImage:
          "linear-gradient(rgba(9, 9, 11, 0.5), rgba(9, 9, 11, 0.82)), url('/initial-stadium.svg')",
      }}
    >
      <section className="grid w-full max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-md border border-zinc-700 bg-zinc-950/88 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm font-medium text-emerald-300">Football Club Architect</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">AIで創る名門クラブ</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-300">
            弱小サッカークラブの社長として、AIスタッフ、監督、スカウト、選手契約、財務判断を組み合わせてクラブを育てるブラウザゲームです。試合操作ではなく、経営判断と委任設計が中心です。
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "AIスタッフに広報・営業・分析・スカウトを委任",
              "選手の年齢、成長、衰退、契約を管理",
              "公式戦4か月自動開催と練習試合で育成",
              "融資やスポンサー前借りで財務を再建",
            ].map((item) => (
              <div key={item} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-xs leading-5 text-zinc-300">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-zinc-500">
            現在はα版です。セーブデータはこのブラウザのlocalStorageに保存されます。ブラウザデータを削除するとセーブも失われる場合があります。
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <Link href="/how-to-play" className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:border-emerald-300">
              遊び方
            </Link>
            <Link href="/privacy" className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:border-emerald-300">
              プライバシー
            </Link>
            <Link href="/terms" className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-200 hover:border-emerald-300">
              利用規約
            </Link>
          </div>
        </div>

      <section className="w-full rounded-md border border-zinc-700 bg-zinc-950/88 p-6 shadow-2xl backdrop-blur">
        <p className="text-sm font-medium text-emerald-300">Football Club Architect</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">AIで創る名門クラブ</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          AIクラブ経営シミュレーションを開始します。未入力の場合はデフォルト名で始まります。
        </p>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-200">クラブ名</span>
            <input
              value={clubName}
              onChange={(event) => setClubName(event.target.value)}
              maxLength={CLUB_NAME_MAX_LENGTH}
              placeholder={DEFAULT_CLUB_NAME}
              className="h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
            />
            <span className="text-xs text-zinc-500">
              最大{CLUB_NAME_MAX_LENGTH}文字
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-200">社長名</span>
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              maxLength={OWNER_NAME_MAX_LENGTH}
              placeholder={DEFAULT_OWNER_NAME}
              className="h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
            />
            <span className="text-xs text-zinc-500">
              最大{OWNER_NAME_MAX_LENGTH}文字
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 h-11 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            ゲーム開始
          </button>
        </form>
      </section>
      </section>
    </main>
  );
}
