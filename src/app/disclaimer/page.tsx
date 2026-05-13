import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "免責事項 | Football Club Architect",
  description:
    "Football Club Architectのフィクション性、ゲームデータ変更、localStorage保存、外部リンクや広告、責任制限について説明します。",
};

export default function DisclaimerPage() {
  return (
    <ContentPage
      title="免責事項"
      lead="Football Club Architectの内容、保存仕様、外部リンクや広告に関する注意事項です。"
    >
      <PageSection title="フィクションとしてのゲーム内容">
        <p>
          Football Club Architectはフィクションのブラウザゲームです。ゲーム内に登場するクラブ、選手、スタッフ、対戦相手、リーグ、試合結果、財務イベントなどはゲーム用に生成されたものであり、実在のクラブ、選手、団体、リーグとは関係ありません。
        </p>
      </PageSection>
      <PageSection title="データ変更と保存リスク">
        <InfoList
          items={[
            "α版のため、ゲームバランス、選手生成、試合計算、財務ルールは変更される可能性があります。",
            "localStorageに保存されたデータは、ブラウザ設定や端末環境により消える可能性があります。",
            "アップデートにより、古いセーブデータの一部が期待通りに動作しない場合があります。",
          ]}
        />
      </PageSection>
      <PageSection title="外部リンク、広告、情報の正確性">
        <p>
          本サイトには広告や外部リンクが含まれる場合があります。リンク先や広告先で提供される情報、商品、サービスについて、本サイトは管理していません。また、本サイトの情報やゲーム機能が常に正確、完全、継続的に提供されることを保証するものではありません。
        </p>
      </PageSection>
      <PageSection title="責任制限">
        <p>
          本サイトの利用、利用不能、データ消失、外部リンクや広告の利用に関連して生じた損害について、法令で認められる範囲で責任を限定します。重要なデータは、利用者自身の判断で管理してください。
        </p>
      </PageSection>
    </ContentPage>
  );
}
