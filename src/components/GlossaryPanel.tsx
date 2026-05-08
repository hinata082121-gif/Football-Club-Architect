"use client";

import { useState } from "react";

const glossaryCategories = [
  {
    category: "基本",
    terms: [
      ["AP", "社長がその月に実行できる行動ポイントです。翌月に最大値まで回復します。"],
      ["クラブレベル", "クラブ規模を表す値です。成長すると背景や運営規模の表現が変わります。"],
      ["シーズン", "今後の大会管理単位です。MVPでは月次進行を中心に扱います。"],
    ],
  },
  {
    category: "クラブ経営",
    terms: [
      ["チーム戦力", "所属選手、編成、コンディション、連携、監督能力から算出される試合力です。"],
      ["チーム連携", "チームとしての噛み合いです。試合内容や戦力補正に影響します。"],
      ["コンディション", "チームや選手の疲労状態です。低いと試合で不利になります。"],
      ["評判", "クラブへの信頼度です。スポンサーやイベント、ファン獲得に影響します。"],
      ["ファン数", "クラブを応援する人数です。収入や人気に影響します。"],
      ["スポンサー力", "スポンサー収入や営業の強さです。財務改善に関わります。"],
      ["グッズ力", "グッズ収益の土台です。在庫処分では短期資金化できます。"],
      ["スタジアム", "観客収入やクラブ規模表現に関わる施設です。"],
    ],
  },
  {
    category: "試合",
    terms: [
      ["公式戦", "リーグ戦やカップ戦など、報酬と影響が大きい試合です。"],
      ["練習試合", "育成、連携、調整のための試合です。公式戦より報酬は控えめです。"],
      ["リーグ戦", "継続参加する公式戦です。Football Club Architectでは4か月単位で自動開催されます。"],
      ["カップ戦", "将来的に追加する短期大会形式の公式戦です。"],
    ],
  },
  {
    category: "スタッフAI",
    terms: [
      ["監督レベル", "監督の総合的な成長度です。試合や編成に影響します。"],
      ["監督経験値", "試合や研修で増え、一定値で監督レベルが上がります。"],
      ["委任レベル", "スタッフAIにどこまで自動実行を任せるかの設定です。"],
      ["AI精度", "スタッフAIが状況に合った判断をしやすいかを示します。"],
      ["スカウト方針", "候補選手を探す方向性です。若手、即戦力、低コストなどがあります。"],
    ],
  },
  {
    category: "選手",
    terms: [
      ["年俸", "選手に毎月支払う人件費です。財務を圧迫することがあります。"],
      ["契約残り月数", "契約満了までの月数です。短い選手は更新判断が必要です。"],
      ["将来性", "将来的に到達しうる能力の目安です。"],
      ["成長性", "若手が伸びやすいかを示す値です。"],
      ["世代交代", "ベテランの衰退や引退に備え、若手へ入れ替える運営判断です。"],
      ["ルーキー支援", "若手育成を助ける将来拡張予定の支援要素です。"],
    ],
  },
  {
    category: "財務",
    terms: [
      ["財務状態", "資金、借入、月次収支から見たクラブ財務の健全度です。"],
      ["債務超過", "資金が危険ラインを下回った状態です。猶予期間内に改善が必要です。"],
      ["融資", "資金を借りる救済策です。短期的に助かりますが返済負担があります。"],
      ["スポンサー前借り", "将来のスポンサー収入を先に受け取る資金策です。数か月の収入減少があります。"],
    ],
  },
];

export function GlossaryPanel() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/88 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Football Club Architect</p>
          <h2 className="mt-2 text-2xl font-semibold">用語解説</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            経営、試合、スタッフAI、選手、財務の主要用語を確認できます。
          </p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="用語を検索"
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {glossaryCategories.map((category) => {
          const terms = category.terms.filter(([term, description]) => {
            if (!normalizedQuery) {
              return true;
            }

            return `${term} ${description}`.toLowerCase().includes(normalizedQuery);
          });

          if (terms.length === 0) {
            return null;
          }

          return (
            <article key={category.category} className="rounded-md border border-zinc-800 bg-zinc-950/45 p-4">
              <h3 className="text-base font-semibold text-zinc-50">{category.category}</h3>
              <dl className="mt-3 grid gap-3">
                {terms.map(([term, description]) => (
                  <div key={term} className="border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <dt className="text-sm font-semibold text-emerald-200">{term}</dt>
                    <dd className="mt-1 text-sm leading-6 text-zinc-300">{description}</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
