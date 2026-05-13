import type { Metadata } from "next";
import { ContentPage, InfoList, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "Contact | Football Club Architect",
  description:
    "Football Club Architectへの問い合わせ、バグ報告、改善要望、広告・プライバシーに関する連絡方法を案内します。",
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact"
      lead="問い合わせ、バグ報告、改善要望、プライバシーや広告に関する連絡のための案内ページです。"
    >
      <PageSection title="問い合わせの目的">
        <p>
          Football Club Architectは開発中のα版です。プレイ中に発見した不具合、分かりにくいUI、ゲームバランスに関する意見、固定ページや広告表示に関する懸念を受け付ける導線を整備しています。
        </p>
      </PageSection>
      <PageSection title="バグ報告に含める情報">
        <InfoList
          items={[
            "発生した画面名、タブ名、直前に押したボタン",
            "再現手順、期待した動作、実際に起きた動作",
            "PCまたはスマホ、OS、ブラウザ名",
            "localStorage保存やリロード復元に関する問題の場合は、リロード前後の状態",
            "表示崩れの場合は画面幅や端末向き",
          ]}
        />
      </PageSection>
      <PageSection title="改善要望と広告・プライバシー">
        <p>
          改善要望では、どの判断が分かりにくかったか、どの画面で操作しにくかったかを具体的に書いてください。広告、Cookie、プライバシーポリシー、利用規約に関する問い合わせも、このページで案内する連絡先またはGitHub Issuesを通じて受け付ける想定です。
        </p>
        <p>
          専用フォームは未実装です。公開時には、管理者が指定するGitHub Issuesまたは連絡先へ送信してください。すべての問い合わせへの返信を保証するものではありませんが、再現性のある報告は修正判断に利用します。
        </p>
      </PageSection>
    </ContentPage>
  );
}
