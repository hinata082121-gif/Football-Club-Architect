import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-md border border-slate-800 bg-slate-900/82 p-6">
        <p className="text-sm font-semibold text-emerald-300">Football Club Architect</p>
        <h1 className="mt-3 text-3xl font-semibold">ページが見つかりません</h1>
        <p className="mt-4 leading-7 text-slate-300">
          指定されたページは存在しないか、移動した可能性があります。ゲーム本体、遊び方、FAQ、用語集など主要ページへ戻れます。
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/play" className="rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950">
            Playへ戻る
          </Link>
          <Link href="/how-to-play" className="rounded-md border border-slate-700 px-4 py-2 text-slate-200">
            遊び方
          </Link>
          <Link href="/faq" className="rounded-md border border-slate-700 px-4 py-2 text-slate-200">
            FAQ
          </Link>
          <Link href="/glossary" className="rounded-md border border-slate-700 px-4 py-2 text-slate-200">
            用語集
          </Link>
        </div>
      </section>
    </main>
  );
}
