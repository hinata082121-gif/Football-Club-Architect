import type { Metadata } from "next";
import { ContentPage, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "更新情報 | Football Club Architect",
  description:
    "Football Club Architectの最近の更新、localStorage保存改善、月次進行UX、公式戦4か月自動開催、AdSense審査向け改善をまとめます。",
};

const updates = [
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
