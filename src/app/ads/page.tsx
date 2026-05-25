import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "広告について",
  description: "Football Club Architectにおける広告表示方針、ゲーム操作との分離、広告設定について説明します。",
};

export default function AdsPage() {
  return (
    <ContentPage
      title="広告について"
      lead="Football Club Architectでは、ゲーム操作と広告表示を分離し、誤クリックを避ける配置を前提にしています。"
    >
      <PageSection title="広告表示方針">
        <InfoList
          items={[
            "広告はゲーム開始、社長アクション、試合実行、翌月進行などの操作ボタン付近には配置しません。",
            "広告閲覧によるゲーム内報酬やクラブ成長ボーナスはありません。",
            "広告には必要に応じて「広告」またはAdvertisementなどのラベルを付けます。",
            "スマホでは画面上部や操作カードの間に大きな広告を挟まない方針です。",
          ]}
        />
      </PageSection>
      <PageSection title="技術的な表示条件">
        <p>
          広告は環境変数で有効化され、クライアントIDとスロットIDが設定されている本番環境でのみ表示されます。開発環境では広告コードを実行しません。
        </p>
      </PageSection>
    </ContentPage>
  );
}
