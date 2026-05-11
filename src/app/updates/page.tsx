import type { Metadata } from "next";
import { ContentPage, PageSection } from "@/components/site/ContentPage";

export const metadata: Metadata = {
  title: "Updates | Football Club Architect",
  description: "Football Club Architectの開発状況、主な更新方針、今後の追加予定をまとめるページです。",
};

export default function UpdatesPage() {
  return (
    <ContentPage
      title="Updates"
      lead="Football Club Architectの開発状況や、今後追加予定の内容をまとめるためのページです。"
    >
      <PageSection title="現在の主な実装">
        <p>
          月次進行、社長アクション、スタッフAI、選手編成、スカウト、公式戦4か月自動開催、練習試合、財務リカバリー、債務超過警告、再建リスタートの基礎を実装しています。
        </p>
      </PageSection>
      <PageSection title="今後の方向性">
        <p>
          今後は、より深い選手育成、監督AIの判断、クラブ成長、UI改善、公開環境での安定性向上を進めます。
        </p>
      </PageSection>
    </ContentPage>
  );
}
