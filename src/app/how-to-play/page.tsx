import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "遊び方 | Football Club Architect",
  description:
    "Football Club Architectの始め方、月次進行、AP、社長アクション、スタッフ委任、公式戦、練習試合、財務管理を解説します。",
};

export default function HowToPlayPage() {
  return (
    <ContentPage
      title="遊び方"
      lead="初めてプレイする方向けに、クラブ作成から月次進行、スタッフ委任、選手編成、試合、財務再建までの基本を説明します。"
    >
      <PageSection title="1. ゲーム開始">
        <p>
          トップページの入力欄でクラブ名と社長名を設定し、ゲームを開始します。未入力でもデフォルト名で開始できます。開始後はホーム画面に移動し、クラブの資金、ファン、評判、チーム戦力、AP、コンディションを確認できます。
        </p>
      </PageSection>

      <PageSection title="2. 1か月ごとの進行とAP">
        <p>
          Football Club Architectでは、1ターンを1か月として扱います。社長には毎月APがあり、選手補強、広報、スポンサー営業、監督育成、休養などの社長アクションを実行できます。APを使い切らなくても翌月へ進めますが、月次進行前の確認画面で残りAPや未解決イベントを確認できます。
        </p>
      </PageSection>

      <PageSection title="3. クラブ運営の基本">
        <InfoList
          items={[
            "社長アクション: APを使ってクラブを直接動かします。同じ行動は同月1回までです。",
            "スタッフ雇用と委任: スタッフAIに業務を任せ、提案のみ、小規模自動、通常委任、完全委任を設定できます。",
            "監督育成: 監督の戦術、采配、育成、モチベーション能力は試合や起用に影響します。",
            "選手編成: 選手の総合能力、将来性、成長性、年齢、年俸、契約状態を確認します。",
            "スカウト: 方針を設定し、若手、即戦力、低コスト、高ポテンシャルなどの候補を発見します。",
          ]}
        />
      </PageSection>

      <PageSection title="4. 試合と育成">
        <p>
          公式戦は一度エントリーすると4か月間参加状態になり、翌月へ進むたびに1試合が自動開催されます。対戦相手はクラブレベルや戦力に近い疑似他プレイヤークラブです。練習試合は格下、同格、格上、地域交流、若手育成など目的別に選べます。練習試合は公式戦ほど報酬は大きくありませんが、選手経験、監督経験、連携、ファン増加に役立ちます。
        </p>
      </PageSection>

      <PageSection title="5. 財務管理と再建">
        <p>
          選手年俸、スタッフ給与、融資返済が重なると資金が悪化します。財務状態はhealthyからbankruptまで段階的に表示され、悪化時には融資、スポンサー前借り、緊急スポンサー営業、選手放出、クラブ縮小再建などの選択肢が出ます。債務超過になっても即終了ではなく、猶予期間と最終救済があります。
        </p>
      </PageSection>

      <PageSection title="6. 保存仕様とスマホ操作">
        <p>
          セーブデータはlocalStorageに保存されます。リロードしても同じブラウザなら復元できます。スマホではタスクバーを横にスクロールし、各画面のカードを縦に確認します。操作ボタンはカード下部に揃えているため、説明文が長いカードでも位置を把握しやすくしています。
        </p>
      </PageSection>

      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
