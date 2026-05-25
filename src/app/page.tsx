import type { Metadata } from "next";
import Link from "next/link";
import { CallToActionCard } from "@/components/site/CallToActionCard";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { UpdateTimeline } from "@/components/site/UpdateTimeline";

export const metadata: Metadata = {
  title: {
    absolute: "Football Club Architect",
  },
  description:
    "Football Club Architectの概要、実装済みシステム、遊び方、更新情報をまとめた公式ランディングページです。",
};

const features = [
  {
    title: "社長視点のクラブ経営",
    description:
      "プレイヤーは監督ではなくクラブ社長です。資金、スタッフ、選手編成、公式戦参加、財務リカバリーを月ごとに判断します。",
  },
  {
    title: "AIスタッフへの委任",
    description:
      "スカウト、広報、営業、分析などのスタッフを雇い、委任レベルを調整して業務を任せられます。",
  },
  {
    title: "選手と世代交代",
    description:
      "選手には年齢、総合能力、将来性、契約、年俸があります。若手育成とベテラン整理の判断が戦力を左右します。",
  },
  {
    title: "公式戦4か月自動開催",
    description:
      "一度公式戦にエントリーすると、4か月間の試合が月次進行に合わせて自動開催されます。",
  },
  {
    title: "練習試合と育成",
    description:
      "格下、同格、格上、地域、若手向けの練習試合を使い分け、経験、連携、ファン獲得を狙えます。",
  },
  {
    title: "財務リカバリー",
    description:
      "資金悪化時には融資、スポンサー前借り、緊急営業、再建リスタートなどの導線が用意されています。",
  },
];

const implementedSystems = [
  "クラブ名と社長名を設定して始めるローカルシングルプレイ",
  "1ターン1か月の月次進行と、翌月へ進む前の確認UI",
  "APを使う社長アクションと、実行済み状態のカード表示",
  "スタッフAIの行動ログ、委任レベル、スタッフ不満",
  "監督育成、自動編成、選手の成長・衰退・契約管理",
  "疑似他プレイヤークラブとの公式戦・練習試合",
  "試合履歴、対戦成績、試合後レポート",
  "財務状態判定、融資、短期リカバリー、債務超過警告",
  "ブラウザのlocalStorageによるセーブとリロード復元",
];

const updates = [
  {
    title: "localStorage保存と復元",
    description:
      "ページをリロードしてもゲーム画面に戻れるよう、ブラウザ内にGameStateを保存する仕組みを追加しました。",
  },
  {
    title: "月次進行UXの改善",
    description:
      "翌月へ進む前の確認、先月の振り返り、行動効果の上下表示を追加し、月次結果を追いやすくしました。",
  },
  {
    title: "公式戦4か月自動開催",
    description:
      "公式戦は毎月エントリーし直す方式ではなく、4か月間の参加状態として管理されるようになりました。",
  },
  {
    title: "モバイルレイアウト改善",
    description:
      "試合画面や行動カードがスマートフォン幅で横にはみ出さないよう、縦積み中心の構成に調整しました。",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-14">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-300">AIで創る名門クラブ</p>
          <h1 className="mt-4 break-words text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Football Club Architect
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            AIスタッフを雇い、選手をスカウトし、監督に采配を委ねながら、弱小サッカークラブを名門へ育てるクラブ経営シミュレーションです。
            プレイヤーはピッチ上の監督ではなく、クラブの未来を設計する社長として毎月の経営判断を行います。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/play"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              今すぐプレイ
            </Link>
            <Link
              href="/how-to-play"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900"
            >
              遊び方を見る
            </Link>
          </div>
        </div>

        <CallToActionCard
          title="ブラウザでそのまま開始"
          description="現在のα版はDBや認証を使わず、セーブデータをブラウザのlocalStorageに保存します。同じブラウザであればリロード後も続きから遊べます。"
          href="/play"
          label="ゲーム本体へ移動"
        />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-white">ゲームの特徴</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Football Club Architectは、選手補強だけでなく、スタッフAIへの委任、監督の判断、財務再建まで含めてクラブを育てる設計です。
        </p>
        <div className="mt-6">
          <FeatureGrid features={features} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-white">Football Club Architectとは</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <p>
              このゲームは、監督として戦術を細かく指示するゲームではありません。社長として「誰に任せるか」「どの分野へ投資するか」「財務危機をどう避けるか」を選ぶ経営シミュレーションです。
            </p>
            <p>
              低能力のスタッフも安価さや成長余地があり、高能力スタッフは判断精度が高い代わりに人件費が重くなります。公式戦に出られない月でも練習試合で育成できるため、失敗を即終了にしない導線を重視しています。
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-white">現在の実装済みシステム</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-7 text-slate-300">
            {implementedSystems.map((item) => (
              <li key={item} className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">最近の更新</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                実装済みの変更を、プレイヤーが確認しやすい形で記録しています。
              </p>
            </div>
            <Link href="/updates" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">
              更新情報を読む
            </Link>
          </div>
          <div className="mt-5">
            <UpdateTimeline updates={updates} />
          </div>
        </article>

        <aside className="grid gap-4">
          <CallToActionCard
            title="初めて遊ぶ場合"
            description="月次進行、AP、公式戦、練習試合、財務管理の基本は遊び方ページにまとめています。"
            href="/how-to-play"
            label="遊び方ページへ"
          />
          <CallToActionCard
            title="用語を確認する"
            description="AP、委任レベル、債務超過、スカウト方針など、ゲーム内で使う用語をカテゴリ別に確認できます。"
            href="/glossary"
            label="用語集へ"
          />
        </aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-semibold text-white">運営・開発情報</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            本作はα版として継続開発中です。保存仕様、問い合わせ、プライバシー、利用条件、免責事項は以下の固定ページで確認できます。
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {[
              ["About", "/about"],
              ["Contact", "/contact"],
              ["Privacy Policy", "/privacy"],
              ["Terms", "/terms"],
              ["Disclaimer", "/disclaimer"],
              ["FAQ", "/faq"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-800"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
