import type { Metadata } from "next";
import { AdSenseAd } from "@/components/ads/AdSenseAd";
import { ContentPage } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "FAQ | Football Club Architect",
  description:
    "Football Club Architectの保存仕様、スマホ対応、公式戦、練習試合、AIスタッフ、選手成長、広告とゲーム報酬の関係を説明します。",
};

const faqs = [
  ["Football Club Architectとは何ですか？", "AIスタッフや監督、スカウトに業務を委任しながら、弱小クラブを名門へ育てる社長視点のサッカークラブ経営シミュレーションです。"],
  ["無料で遊べますか？", "現在のα版はブラウザで無料プレイできるローカルMVPです。将来の公開形態や機能範囲は変更される場合があります。"],
  ["セーブデータはどこに保存されますか？", "ブラウザのlocalStorageに保存されます。サーバー保存やアカウント連携はまだありません。"],
  ["リロードしても続きから遊べますか？", "同じブラウザでlocalStorageが残っていれば復元できます。ブラウザデータ削除、別端末、シークレットモードでは引き継げない場合があります。"],
  ["スマホでも遊べますか？", "スマホでも操作できるようにカードUIと横スクロール可能なタスクバーを用意しています。細かい管理画面はPCの方が見やすい場合があります。"],
  ["公式戦はどう進みますか？", "公式戦に一度エントリーすると4か月間参加状態になり、翌月進行時に毎月1試合が自動で行われます。"],
  ["練習試合にはどんな意味がありますか？", "公式戦ほど報酬は大きくありませんが、若手育成、監督経験、連携向上、地域ファン獲得に役立ちます。"],
  ["AIスタッフは何をしてくれますか？", "広報、営業、スカウト、分析、グッズ、施設管理などの行動を提案または自動実行します。委任レベルにより実行範囲を制限できます。"],
  ["選手は成長しますか？", "若手は経験や出場機会で成長し、全盛期を迎え、ベテランになると衰退や引退リスクが発生します。"],
  ["財務破綻するとどうなりますか？", "即終了ではありません。警告、猶予期間、融資、スポンサー前借り、選手整理、縮小再建などの選択肢があります。"],
  ["広告はゲーム進行に影響しますか？", "影響しません。広告表示はゲーム内の試合結果、資金、AP、報酬、クラブ成長とは分離しています。"],
  ["広告を見ることでゲーム内報酬はありますか？", "ありません。AdSense広告をゲーム報酬と結びつけない設計です。広告閲覧やクリックで資金、AP、選手、試合報酬が増えることはありません。"],
  ["バグを見つけた場合はどうすればよいですか？", "Contactページの案内に沿って、発生画面、操作手順、ブラウザ、端末、期待した動作と実際の動作をまとめて報告してください。"],
  ["今後どんな機能が追加されますか？", "オンライン保存、ランキング、より深い大会管理、選手育成、監督AI判断、クラブ履歴、バランス調整などを検討しています。"],
];

export default function FaqPage() {
  return (
    <ContentPage
      title="FAQ"
      lead="プレイ前に確認しやすいよう、保存仕様、ゲーム進行、広告表示、今後の開発予定を質問形式でまとめています。"
    >
      <div className="grid gap-4">
        {faqs.map(([question, answer]) => (
          <section key={question} className="rounded-md border border-slate-800 bg-slate-950/55 p-4">
            <h2 className="text-base font-semibold text-white">{question}</h2>
            <p className="mt-2 text-slate-300">{answer}</p>
          </section>
        ))}
      </div>
      <AdSenseAd slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER} format="horizontal" />
    </ContentPage>
  );
}
