import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "Contact | Football Club Architect",
  description: "Football Club Architectへの問い合わせ、バグ報告、改善要望、広告・プライバシーに関する連絡方法を案内します。",
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      lead="Football Club Architectに関する問い合わせ、バグ報告、改善要望のための案内ページです。"
    >
      <PageSection title="問い合わせ方法">
        <p>
          現在、専用フォームは準備中です。バグ報告や改善要望を送る場合は、プロジェクト管理者が案内するGitHub Issues、または公開時に指定される連絡先をご利用ください。
        </p>
      </PageSection>
      <PageSection title="報告時に含めると助かる情報">
        <InfoList
          items={[
            "発生した画面名、タブ名、操作内容",
            "再現手順と、期待した動作・実際の動作",
            "PCまたはスマホ、OS、ブラウザ名",
            "localStorage保存やリロード復元に関する問題の場合は、直前に行った操作",
            "広告、プライバシー、利用規約に関する問い合わせの場合は、該当ページ名と内容",
          ]}
        />
      </PageSection>
      <PageSection title="広告・プライバシーに関する連絡">
        <p>
          広告表示やプライバシーポリシーに関する問い合わせも、このページで案内する連絡先へ送れるように整備予定です。個人情報を送る場合は、必要最小限の内容にしてください。
        </p>
      </PageSection>
    </ContentPage>
  );
}
