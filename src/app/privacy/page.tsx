import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Football Club Architect",
  description: "Football Club ArchitectのlocalStorage保存、広告、Cookie、問い合わせ時の情報の扱いについて説明します。",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="プライバシーポリシー"
      lead="Football Club Architectを利用する際に扱われる可能性のある情報と、その管理方針を説明します。"
    >
      <PageSection title="取得する可能性のある情報">
        <InfoList
          items={[
            "ゲーム進行に必要なクラブ名、社長名、クラブ状態、選手、試合、財務ログなどはブラウザのlocalStorageに保存されます。",
            "問い合わせ時には、返信や確認に必要な連絡先、問い合わせ内容、利用環境などを受け取る場合があります。",
            "広告配信やアクセス状況の把握のため、Cookieや広告識別子などが利用される可能性があります。",
          ]}
        />
      </PageSection>
      <PageSection title="localStorageによる保存">
        <p>
          本ゲームのセーブデータは現在サーバーではなく、利用者のブラウザ内に保存されます。ブラウザデータの削除、端末変更、シークレットモード利用などにより、セーブデータが消える場合があります。
        </p>
      </PageSection>
      <PageSection title="広告配信について">
        <p>
          本サイトでは、Google AdSenseなどの第三者配信事業者による広告を導入予定、または導入している場合があります。Googleなどの第三者配信事業者は、Cookieを使用して、利用者の興味に応じた広告を配信する場合があります。
        </p>
        <p>
          広告に関する設定やCookieの管理は、利用者のブラウザ設定や各広告配信事業者が提供する設定画面で変更できる場合があります。
        </p>
      </PageSection>
      <PageSection title="アクセス解析">
        <p>
          アクセス解析を導入する場合は、ページ閲覧状況や利用環境などの統計情報を取得する可能性があります。個人を特定する目的では利用しません。
        </p>
      </PageSection>
      <PageSection title="個人情報の管理と変更">
        <p>
          問い合わせで受け取った情報は、問い合わせ対応やサービス改善の範囲で利用します。プライバシーポリシーは、サービス内容や利用する外部サービスの変更に応じて更新される場合があります。
        </p>
      </PageSection>
    </ContentPage>
  );
}
