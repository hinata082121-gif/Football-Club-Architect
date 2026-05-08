"use client";

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
      <section className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-950/88 p-6 shadow-2xl backdrop-blur">
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
    </main>
  );
}
