import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Football Club Architect",
  description:
    "Football Club ArchitectのlocalStorage保存、Cookie、Google AdSense、問い合わせ情報、第三者提供、外部リンクについて説明します。",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="プライバシーポリシー"
      lead="Football Club Architectを利用する際に扱われる可能性のある情報と、その利用目的を説明します。"
    >
      <PageSection title="取得する可能性のある情報">
        <InfoList
          items={[
            "ゲーム進行に必要なクラブ名、社長名、クラブ状態、選手、試合、財務ログ、イベントログなど",
            "問い合わせ時に利用者が送信する連絡先、問い合わせ本文、利用環境、再現手順",
            "広告配信やアクセス状況の把握に関連して利用される可能性のあるCookie、広告識別子、閲覧環境情報",
          ]}
        />
      </PageSection>
      <PageSection title="localStorageによるゲーム保存">
        <p>
          現在のゲームデータはサーバーではなく、利用者のブラウザ内のlocalStorageに保存されます。localStorageには、ゲームを続きから再開するためのクラブ状態やログが含まれます。ブラウザデータを削除した場合、別端末を利用した場合、シークレットモードを利用した場合などは、セーブデータが復元できないことがあります。
        </p>
      </PageSection>
      <PageSection title="CookieとGoogle AdSenseについて">
        <p>
          本サイトでは、Google AdSenseなどの広告配信サービスを導入している、または導入予定です。Googleなどの第三者配信事業者は、Cookieを使用して広告を配信する場合があります。Cookieは、利用者のブラウザ設定により無効化できる場合があります。
        </p>
        <p>
          広告はゲーム内報酬や進行とは関係ありません。広告閲覧やクリックによって、ゲーム内資金、AP、選手、試合結果が変化することはありません。
        </p>
      </PageSection>
      <PageSection title="アクセス解析、問い合わせ、第三者提供">
        <p>
          アクセス解析を導入する場合、ページ閲覧状況や利用環境などの統計情報を取得する可能性があります。問い合わせ時に受け取った情報は、返信、調査、改善のために利用します。法令に基づく場合などを除き、問い合わせ情報を無断で第三者に提供しません。
        </p>
      </PageSection>
      <PageSection title="外部リンクとポリシー変更">
        <p>
          本サイトには外部リンクや広告が含まれる場合があります。リンク先のサイトにおける個人情報の取り扱いは、各リンク先のポリシーをご確認ください。本ポリシーは、サービス内容や利用する外部サービスの変更に応じて更新される場合があります。
        </p>
      </PageSection>
      <PageSection title="問い合わせ先">
        <p>
          プライバシーに関する問い合わせは、Contactページで案内する連絡先またはGitHub Issuesなど、運営者が指定する方法から送信してください。
        </p>
      </PageSection>
    </ContentPage>
  );
}
