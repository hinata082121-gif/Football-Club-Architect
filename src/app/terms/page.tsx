import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "利用規約",
  description:
    "Football Club Architectの利用条件、α版の仕様変更、localStorage保存、禁止事項、広告表示、免責事項を説明します。",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="利用規約"
      lead="Football Club Architectを利用する際の基本条件をまとめています。"
    >
      <PageSection title="サービス概要と利用条件">
        <p>
          Football Club Architectは、AIクラブ経営をテーマにしたブラウザ向けシミュレーションゲームです。利用者は、本規約と関連するプライバシーポリシー、免責事項を確認したうえで利用するものとします。
        </p>
      </PageSection>
      <PageSection title="α版/MVP版としての仕様変更">
        <p>
          本ゲームは開発中のα版またはMVP版です。ゲームバランス、UI、データ構造、保存形式、機能範囲は予告なく変更される場合があります。アップデートにより、古いセーブデータの一部が補完または初期化される可能性があります。
        </p>
      </PageSection>
      <PageSection title="セーブデータと保証">
        <p>
          セーブデータはブラウザのlocalStorageに保存されます。サーバー保存ではないため、ブラウザデータ削除、端末変更、ブラウザ仕様変更などによりデータが失われる場合があります。ゲームデータの永続性、完全性、継続提供を保証するものではありません。
        </p>
      </PageSection>
      <PageSection title="禁止事項">
        <InfoList
          items={[
            "不正アクセス、過度な自動アクセス、脆弱性の悪用、サービス運営を妨げる行為",
            "広告表示、ナビゲーション、ゲーム操作を誤認させる行為",
            "第三者の権利を侵害する行為、法令や公序良俗に反する行為",
            "ゲームデータや表示内容を利用した不正な宣伝、詐欺的行為、虚偽の説明",
          ]}
        />
      </PageSection>
      <PageSection title="広告表示、変更、免責">
        <p>
          本サイトでは広告が表示される場合があります。広告はゲーム内報酬や進行とは関係ありません。運営者は、必要に応じてサービス内容を変更、停止、終了する場合があります。本サイトの利用により生じた損害について、法令で認められる範囲で責任を限定します。
        </p>
      </PageSection>
      <PageSection title="規約変更">
        <p>
          本規約は、サービス内容、運用状況、利用する外部サービスの変更に応じて更新される場合があります。重要な変更がある場合は、サイト上で分かりやすく確認できる形にすることを目指します。
        </p>
      </PageSection>
    </ContentPage>
  );
}
