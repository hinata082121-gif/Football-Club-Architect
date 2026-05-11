import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "Features | Football Club Architect",
  description:
    "AIスタッフ委任、選手スカウト、公式戦4か月開催、財務リカバリーなどFootball Club Architectの特徴を紹介します。",
};

export default function FeaturesPage() {
  return (
    <ContentPage
      title="Features"
      lead="Football Club Architectは、サッカークラブを社長視点で育てるための経営判断と、AI組織への委任を重視したシミュレーションです。"
    >
      <PageSection title="主な特徴">
        <InfoList
          items={[
            "AIスタッフへの委任: スカウト、広報、営業、分析、グッズ、施設管理などをスタッフに任せられます。",
            "社長視点のクラブ経営: 監督ではなく経営者として、予算、人材、ファン、財務、方針を管理します。",
            "選手の年齢・成長・衰退: 若手の育成、全盛期、ベテランの衰退、契約管理がクラブ戦力に影響します。",
            "スカウトと世代交代: スカウトAIが候補を発見し、社長が最終承認して獲得します。",
            "公式戦4か月自動開催: 一度エントリーすると4か月間、毎月公式戦が自動で行われます。",
            "練習試合による育成: 格下、同格、格上、地域交流、若手育成など目的別に練習試合を選べます。",
            "財務リカバリー: 融資、スポンサー前借り、短期資金策、再建リスタートなどを判断できます。",
            "スタジアム成長: クラブレベルに応じて背景スタジアムが変化し、成長を視覚的に感じられます。",
            "用語解説: AP、委任レベル、債務超過、スカウト方針などをゲーム内で確認できます。",
            "月次結果サマリー: 翌月進行前の確認と、先月の振り返りで行動結果を把握できます。",
          ]}
        />
      </PageSection>
      <PageSection title="広告とゲーム体験">
        <p>
          広告枠を設定する場合でも、ゲーム開始、社長アクション、試合実行、翌月進行などの操作ボタン付近には配置しない方針です。広告閲覧によるゲーム内報酬はありません。
        </p>
      </PageSection>
      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
