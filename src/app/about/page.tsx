import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "About | Football Club Architect",
  description:
    "Football Club Architectの概要、社長視点のAIクラブ経営、localStorage保存、α版としての開発方針を説明します。",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About"
      lead="Football Club Architectは、AIスタッフ、監督、スカウトと協力しながら、弱小サッカークラブを名門へ育てるオリジナルのブラウザゲームです。"
    >
      <PageSection title="社長としてクラブを設計するゲーム">
        <p>
          Football Club Architectでは、プレイヤーはピッチ上の監督ではなく、クラブ全体を動かす社長です。勝つために必要なのは、試合中の細かい指示だけではありません。資金をどう使うか、誰を雇うか、どの業務をAIスタッフへ任せるか、若手を育てるか即戦力を獲るか、財務危機をどう乗り切るかといった判断がクラブの未来を決めます。
        </p>
        <p>
          ゲーム内では、広報、営業、スカウト、分析、グッズ、施設管理などをスタッフAIに委任できます。スタッフには能力、性格、不満、AI精度、委任レベルがあり、信頼できる人材には通常業務を任せ、経験不足のスタッフには提案だけを任せるといった調整ができます。
        </p>
      </PageSection>

      <PageSection title="管理する主な領域">
        <InfoList
          items={[
            "監督AI: 起用方針や自動編成に影響し、試合では采配、戦術、モチベーションが結果に関わります。",
            "選手スカウト: 候補選手は推定能力として表示され、スカウト精度によって見誤りや掘り出し物が生まれます。",
            "選手編成: 年齢、成長、衰退、年俸、契約残り月数を見ながら世代交代を進めます。",
            "財務管理: スポンサー営業、融資、スポンサー前借り、選手売却、債務超過警告を扱います。",
            "スタジアムとクラブ規模: クラブレベルに応じて背景スタジアムが変化し、成長を視覚的に確認できます。",
            "公式戦と練習試合: 公式戦は4か月単位で自動開催され、練習試合は育成、調整、地域交流の手段になります。",
          ]}
        />
      </PageSection>

      <PageSection title="α版としての位置づけ">
        <p>
          現在のFootball Club Architectはα版またはMVP版です。オンライン保存、認証、ランキング、実ユーザー同士の同期対戦はまだありません。まずはローカルで遊べるシングルプレイとして、クラブ経営の基本ループ、AI委任、選手管理、財務再建の手触りを検証しています。
        </p>
        <p>
          セーブデータはブラウザのlocalStorageに保存されます。同じブラウザであればリロード後も続きから遊べますが、ブラウザデータを削除した場合や別端末では引き継がれません。今後は、オンライン保存、ランキング、クラブ履歴、より深い大会管理などを追加する余地があります。
        </p>
      </PageSection>

      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
