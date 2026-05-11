import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "免責事項 | Football Club Architect",
  description: "Football Club Architectのフィクション性、データ変更、localStorage、外部リンクや広告に関する免責事項です。",
};

export default function DisclaimerPage() {
  return (
    <ContentPage
      title="免責事項"
      lead="Football Club Architectの内容、保存仕様、外部リンクや広告に関する注意事項を説明します。"
    >
      <PageSection title="ゲーム内容について">
        <p>
          本ゲームはフィクションです。登場するクラブ、選手、スタッフ、対戦相手、試合結果などはゲーム用に生成されたものであり、実在のクラブ、選手、団体とは関係ありません。
        </p>
      </PageSection>
      <PageSection title="仕様変更と保存データ">
        <InfoList
          items={[
            "α版のため、ゲームバランスやUI、データ構造は予告なく変更される場合があります。",
            "localStorageに保存されたデータは、ブラウザ設定や端末環境により消える可能性があります。",
            "アップデートにより、古いセーブデータの一部が補完または初期化される場合があります。",
          ]}
        />
      </PageSection>
      <PageSection title="外部リンク・広告">
        <p>
          本サイトに広告や外部リンクが表示される場合があります。リンク先や広告先で提供される情報、サービス、商品について、本サイトは管理していません。
        </p>
      </PageSection>
      <PageSection title="責任制限">
        <p>
          本サイトの利用により生じた損害について、法令で認められる範囲で責任を限定します。重要なデータは、利用者自身の判断で管理してください。
        </p>
      </PageSection>
    </ContentPage>
  );
}
