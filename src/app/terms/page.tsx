import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "利用規約 | Football Club Architect",
  description: "Football Club Architectの利用条件、α版の仕様変更、保存データ、禁止事項、広告表示について説明します。",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="利用規約"
      lead="Football Club Architectを利用する際の基本的な条件をまとめています。"
    >
      <PageSection title="サービス概要">
        <p>
          Football Club Architectは、AIクラブ経営をテーマにしたブラウザ向けシミュレーションゲームです。現在は開発中のα版であり、仕様、UI、数値バランス、保存形式が変更される場合があります。
        </p>
      </PageSection>
      <PageSection title="セーブデータ">
        <p>
          セーブデータはブラウザのlocalStorageに保存されます。利用者のブラウザ環境に依存するため、データ消失や復元不能が起きる場合があります。
        </p>
      </PageSection>
      <PageSection title="禁止事項">
        <InfoList
          items={[
            "不正アクセス、過度な自動アクセス、サービス運営を妨げる行為",
            "サイト内容、広告、ナビゲーションを誤認させる利用",
            "第三者の権利を侵害する行為、法令や公序良俗に反する行為",
            "ゲームデータや表示内容を利用した不正な宣伝、詐欺的行為",
          ]}
        />
      </PageSection>
      <PageSection title="広告表示">
        <p>
          本サイトでは広告が表示される場合があります。広告はゲーム内報酬、ゲーム進行、クラブ成長とは関係ありません。
        </p>
      </PageSection>
      <PageSection title="変更・免責">
        <p>
          運営者は、必要に応じてサービス内容を変更、停止、終了する場合があります。利用によって生じた損害について、法令で認められる範囲で責任を限定します。
        </p>
      </PageSection>
    </ContentPage>
  );
}
