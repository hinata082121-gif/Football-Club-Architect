import type { Metadata } from "next";
import { ContentPage, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "更新情報",
  description:
    "Football Club Architectの開発ログ、行動UI、月次進行、公式戦4か月自動開催、スマートフォン表示、保存仕様の改善をまとめます。",
};

const updates = [
  ["最近の更新: 行動UIと月次進行の改善", "プレイヤーが社長として行った判断を月ごとに把握しやすくするため、社長アクションの表示を改善しました。以前は実行した行動が別の場所にも表示される構成でしたが、現在は各行動カード内で「実行可能」から「今月実行済み」へ変わる形に整理しています。どの行動を今月すでに実行したのかを、行動画面内で確認しやすくするための更新です。"],
  ["最近の更新: 公式戦4か月自動進行の整理", "公式戦は、一度参加すると4か月間にわたって自動で試合が進む仕様に整理しました。毎月手動で公式戦を申し込むのではなく、クラブの状態、資金、選手層、コンディションを見て、参加タイミングを判断する設計です。社長として「いつ勝負に出るか」を考える要素を強めるための調整です。"],
  ["最近の更新: スマートフォン表示の改善", "スマートフォンでも試合画面や行動カードが横にはみ出さないよう、レイアウト調整を行いました。Football Club Architectはブラウザで遊べるゲームのため、PCだけでなくスマートフォンでもクラブ経営の情報を読み取りやすいことを重視しています。特に試合結果、行動ボタン、月次情報は小さい画面でも確認しやすいよう改善を続けています。"],
  ["最近の更新: localStorage保存仕様の明確化", "現在のセーブデータは、ブラウザのlocalStorageに保存されます。同じ端末・同じブラウザであれば続きから遊べますが、ブラウザのデータ削除、シークレットモード、別端末でのアクセスではセーブが引き継がれない場合があります。この仕様を遊び方ページやFAQでも確認できるよう、説明を補強しています。"],
  ["α版公開", "ローカル状態で遊べるシングルプレイMVPとして、クラブ作成、月次進行、社長アクション、スタッフAI、試合、財務の基本ループを実装しました。"],
  ["localStorage保存改善", "ページをリロードしても同じブラウザで続きから遊べるよう、GameStateをlocalStorageに保存・復元する仕組みを追加しました。"],
  ["月次進行UX改善", "翌月へ進む前の確認画面、先月の振り返り、行動効果の上下表示を追加し、前月の判断と結果を追いやすくしました。"],
  ["公式戦4か月自動開催", "一度エントリーすると4か月間、毎月公式戦が自動実行される方式へ変更しました。"],
  ["選手・スカウト・契約管理", "初期選手生成、編成画面、チーム戦力算出、スカウト候補、獲得・放出、監督委託、年齢成長、契約・年俸を追加しました。"],
  ["財務リカバリー", "財務状態判定、融資、スポンサー前借り、短期リカバリー、債務超過警告、再建リスタートを追加しました。"],
  ["AdSense審査向けサイト構造改善", "About、How to Play、Features、FAQ、Privacy Policy、Terms、Disclaimer、Contact、Glossary、Updatesを整備し、Header/Footerから移動できる構造にしました。"],
];

export default function UpdatesPage() {
  return (
    <ContentPage
      title="更新情報"
      lead="Football Club Architectが継続開発されている独自プロジェクトであることを示すため、最近の主な更新内容をまとめています。"
    >
      <div className="grid gap-4">
        {updates.map(([title, body]) => (
          <section key={title} className="rounded-md border border-slate-800 bg-slate-950/55 p-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-2 text-slate-300">{body}</p>
          </section>
        ))}
      </div>
      <PageSection title="今後の予定">
        <p>
          今後は、オンライン保存、ランキング、シーズン管理、選手育成の深掘り、監督AI判断、UI改善、モバイル操作性の改善を進める予定です。具体的な公開時期は、開発状況に応じて更新します。
        </p>
      </PageSection>
    </ContentPage>
  );
}
