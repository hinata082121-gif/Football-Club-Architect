import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "特徴",
  description:
    "社長視点のクラブ経営、AIスタッフ委任、監督AI、自動試合、選手成長、財務リカバリーなどFootball Club Architectの特徴を紹介します。",
};

const features = [
  ["社長視点のクラブ経営", "プレイヤーは監督ではなく社長です。試合操作よりも、資金、人材、方針、委任、財務再建を判断します。"],
  ["AIスタッフへの業務委任", "スカウト、広報、営業、分析、グッズ、施設管理などをスタッフAIに任せられます。能力やAI精度が低いスタッフは提案中心にするなど、委任範囲を調整できます。"],
  ["監督AIと自動試合", "監督の戦術、采配、育成、モチベーションが試合に影響します。試合は完全自動で、結果後には敗因、良かった点、改善提案が表示されます。"],
  ["選手の年齢・成長・衰退", "選手は年齢を重ね、若手は成長し、ベテランは衰退や引退リスクを抱えます。戦力を固定化せず、世代交代を促します。"],
  ["スカウトと世代交代", "スカウト方針により候補の傾向が変わります。推定能力には誤差があり、スカウト能力が候補の見極めに関わります。"],
  ["公式戦4か月自動開催", "エントリー後は4か月間、毎月公式戦が自動で行われます。毎月再エントリーする必要がなく、クラブ運営に集中できます。"],
  ["練習試合による育成", "大会に参加していない月でも、練習試合で選手経験、監督経験、連携、ファン増加を得られます。"],
  ["財務リカバリーと融資制度", "資金不足時は融資、スポンサー前借り、緊急スポンサー営業などを使えます。ただし返済や将来収入減少があるため、経営判断になります。"],
  ["債務超過と再建", "債務超過が続くと経営破綻リスクが高まります。即終了ではなく、警告、猶予、最終救済、縮小再建の選択肢があります。"],
  ["スタジアム成長", "クラブレベルに応じて背景スタジアムが変わり、地域クラブから強豪クラブへの成長を視覚的に表現します。"],
  ["用語解説と月次UX", "AP、委任レベル、債務超過、スカウト方針などを用語ページで確認できます。翌月進行前確認と先月結果サマリーで、行動結果を追いやすくしています。"],
];

export default function FeaturesPage() {
  return (
    <ContentPage
      title="特徴"
      lead="Football Club Architectは、AI組織を育てながらクラブを経営することに重点を置いたブラウザシミュレーションです。"
    >
      <div className="grid gap-4">
        {features.map(([title, body]) => (
          <section key={title} className="rounded-md border border-slate-800 bg-slate-950/55 p-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-2 text-slate-300">{body}</p>
          </section>
        ))}
      </div>
      <PageSection title="広告とゲーム体験の分離">
        <p>
          広告表示が有効な場合でも、ゲーム開始、社長アクション、試合実行、翌月進行などの操作ボタン付近には配置しない方針です。広告閲覧によるゲーム内報酬はありません。
        </p>
      </PageSection>
      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
