import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "About | Football Club Architect",
  description:
    "Football Club Architectの概要、AIクラブ経営シミュレーションとしての特徴、α版の保存仕様を紹介します。",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About"
      lead="Football Club Architectは、AIスタッフや監督、スカウトに業務を委任しながら、弱小サッカークラブを名門へ育てるクラブ経営シミュレーションです。"
    >
      <PageSection title="ゲーム概要">
        <p>
          プレイヤーは監督ではなくクラブ社長です。試合中の細かな操作よりも、資金、人材、ファン、評判、選手編成、スタッフ委任、財務再建といった経営判断を中心にクラブを育てます。
        </p>
        <p>
          社長アクションで直接クラブを動かしつつ、成長に合わせてスタッフAIへ業務を任せていくことが中核です。スタッフには能力、性格、不満、AI精度、委任レベルがあり、信頼できる人材に任せるほど社長の負担を減らせます。
        </p>
      </PageSection>

      <PageSection title="現在のα版で扱う内容">
        <InfoList
          items={[
            "月次進行、社長アクション、スタッフ採用と委任、監督育成をプレイできます。",
            "選手の年齢、成長、衰退、契約、年俸、スカウト候補、獲得・放出の基礎を実装しています。",
            "公式戦は4か月単位でエントリーし、毎月自動で試合が行われます。練習試合は育成や調整のために実施できます。",
            "財務悪化時には融資、スポンサー前借り、短期リカバリー、債務超過警告、再建リスタートの導線があります。",
          ]}
        />
      </PageSection>

      <PageSection title="保存仕様">
        <p>
          現在のセーブデータはブラウザのlocalStorageに保存されます。ログインやサーバー保存はまだありません。同じブラウザであればリロード後も復元できますが、ブラウザデータを削除した場合や別端末では引き継がれません。
        </p>
      </PageSection>

      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
