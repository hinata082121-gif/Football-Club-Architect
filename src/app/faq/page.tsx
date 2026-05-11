import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "FAQ | Football Club Architect",
  description: "Football Club Architectのよくある質問、保存仕様、公式戦、練習試合、財務破綻、広告表示について説明します。",
};

const faqs = [
  ["Football Club Architectとは何ですか？", "AIスタッフや監督、スカウトに業務を委任しながらクラブを育てる、社長視点のサッカークラブ経営シミュレーションです。"],
  ["無料で遊べますか？", "現在のα版はブラウザ上で無料で遊べるローカルMVPとして開発しています。"],
  ["セーブデータはどこに保存されますか？", "現在はブラウザのlocalStorageに保存されます。サーバー保存やアカウント連携は未実装です。"],
  ["スマホでも遊べますか？", "スマホでも遊べるようにタスクバーとカードUIを調整しています。画面幅が狭い場合は縦並び中心になります。"],
  ["オンライン対戦ですか？", "現時点ではオンライン同期やリアルタイム対戦はありません。疑似他プレイヤークラブとのローカル対戦です。"],
  ["他プレイヤーとの対戦はありますか？", "他プレイヤー風のクラブが自動生成され、練習試合や公式戦の相手として登場します。"],
  ["公式戦はどう進みますか？", "一度エントリーすると4か月間参加状態になり、翌月進行時に毎月1試合が自動で行われます。"],
  ["練習試合にはどんな意味がありますか？", "選手経験、監督経験、連携、ファン微増、少額収入などを得られる育成と調整の手段です。"],
  ["財務破綻するとどうなりますか？", "即終了ではなく、警告、猶予期間、最終救済策、再建リスタートの選択肢があります。"],
  ["広告はゲーム進行に影響しますか？", "広告閲覧によるゲーム内報酬や進行優遇はありません。ゲーム操作と広告は分離する方針です。"],
  ["バグを見つけた場合はどうすればよいですか？", "Contactページの案内に沿って、再現手順、利用端末、ブラウザ、発生した画面を添えて報告してください。"],
];

export default function FaqPage() {
  return (
    <ContentPage
      title="FAQ"
      lead="Football Club Architectについて、プレイ前に確認しやすい質問をまとめました。"
    >
      <div className="grid gap-4">
        {faqs.map(([question, answer]) => (
          <section key={question} className="rounded-md border border-slate-800 bg-slate-950/55 p-4">
            <h2 className="text-base font-semibold text-white">{question}</h2>
            <p className="mt-2 text-slate-300">{answer}</p>
          </section>
        ))}
      </div>
      <PageSection title="補足">
        <p>
          α版では仕様や数値バランスが変わる場合があります。大きな変更が入る場合は、updatesページやREADMEで確認できる形に整えていきます。
        </p>
      </PageSection>
      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
