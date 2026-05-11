import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "遊び方 | Football Club Architect",
  description:
    "Football Club Architectの基本的な遊び方、月次進行、社長アクション、公式戦、練習試合、財務管理について解説します。",
};

export default function HowToPlayPage() {
  return (
    <ContentPage
      title="遊び方"
      lead="初めてプレイする方向けに、クラブ作成から月次進行、スタッフ委任、選手編成、財務管理までの流れをまとめます。"
    >
      <PageSection title="ゲーム開始">
        <p>
          まずクラブ名と社長名を入力します。未入力の場合はデフォルト名で開始できます。開始後はブラウザのlocalStorageに保存されるため、同じブラウザであればリロード後も続きから遊べます。
        </p>
      </PageSection>
      <PageSection title="基本の流れ">
        <InfoList
          items={[
            "毎月、社長アクションで補強、広報、スポンサー営業、監督育成、休養などを選びます。",
            "スタッフを採用すると、委任レベルに応じてAIが提案または自動行動を行います。",
            "選手編成画面では所属選手、契約、年齢、能力、スカウト候補を確認できます。",
            "監督には起用方針を設定でき、自動でスタメンやベンチを選ばせることができます。",
            "試合画面では練習試合を選び、公式戦はエントリー後4か月間自動で行われます。",
            "翌月へ進む前に確認画面が出ます。AP残り、未解決イベント、試合実施状況を確認できます。",
          ]}
        />
      </PageSection>
      <PageSection title="財務と再建">
        <p>
          資金が不足すると財務警告が表示されます。融資、スポンサー前借り、緊急スポンサー営業、選手放出などで短期資金を確保できます。債務超過が続くと最終救済や再建リスタートの判断が必要になります。
        </p>
      </PageSection>
      <PageSection title="スマホでの遊び方">
        <p>
          スマホではタスクバーを横スクロールして画面を切り替えます。行動カードや試合カードは縦に並び、操作ボタンはカード下部に配置されています。
        </p>
      </PageSection>
      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
