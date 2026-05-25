# Football Club Architect

AIで創る名門クラブ。
Football Club Architect は、AIクラブ経営シミュレーションのローカルMVPです。
プレイヤーは監督ではなくクラブ社長として、資金、人材、ファン、評判、チーム戦力、スタッフAIへの委任、試合、練習試合を管理します。

## 技術構成

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- ESLint
- ローカル状態管理

DB、認証、オンライン対戦、課金、リアル日程連動はMVPでは扱いません。

## 開発コマンド

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## MVPの目的

まずはローカルで遊べるシングルプレイのプロトタイプを作ります。
ターン制、社長の行動ポイント、クラブ指標、スタッフAI、自動試合、練習試合、ログ、レポートの流れを小さく実装し、ゲームとしての面白さと拡張性を検証します。

## 現時点で実装する範囲

- Next.js + TypeScript + Tailwind CSS の初期構成
- `/src/game` にゲームロジックの雛形を配置
- `/src/types/game.ts` に主要な型定義を集約
- `/src/game/balance.ts` に初期値と数値バランスを集約
- ダッシュボード、行動、スタッフ、試合、練習試合、ログ、財務のUI雛形
- ローカル状態で動く最小画面

## 今後の拡張予定

- スタッフ雇用と委任レベル
- スタッフAIの自動行動と理由ログ
- 能力、性格、不満、AI精度による行動選択
- 試合シミュレーション
- 練習試合の経験値、連携、収入、ファン増加
- ランダムイベント
- 承認が必要な重大行動のワークフロー
- バランス調整とテスト追加
- 選手システム、スカウト候補、チーム編成、年齢・成長・衰退、監督への起用委託
- 財務リカバリー導線、融資制度、債務超過ゲームオーバー

## 設計ドキュメント

- [Game Design](./docs/game-design.md)
- [Player System Design](./docs/player-system-design.md)
- [Financial Recovery Design](./docs/financial-recovery-design.md)
- [Alpha Roadmap](./docs/alpha-roadmap.md)

## デプロイ前チェック

公開前は、ローカル確認、GitHub反映、Vercel反映、公開URL確認を分けて確認します。

```bash
npm run lint
npm run build
git status
git add .
git commit -m "Update site quality and deployment readiness"
git push
```

デプロイ前後に確認すること:

- `/` が説明量のあるランディングページになっていること
- `/play` でゲーム本体が開き、localStorage保存と復元が動くこと
- `npm run build` が成功していること
- `npm run lint` が成功していること
- `git status` で意図しない未追跡ファイルや差分が残っていないこと
- `git add .` で必要な変更をステージしたこと
- `git commit` で意図が分かるメッセージを残したこと
- `git push` でGitHubへ反映したこと
- GitHub上で最新コミットが反映されていること
- Vercel Deploymentsで最新デプロイが成功していること
- 公開URLでHeader/Footer、固定ページ、ゲーム開始、localStorage復元が動くこと
- Search ConsoleのURL inspectionでトップページと主要固定ページの取得状態を確認すること
- `robots.txt` と `sitemap.xml` が公開URLから確認できること
- AdSense所有権確認用のscript/metaタグがheadに出力されていること
- AdSense再申請前に、広告枠が操作ボタン付近に出ていないことを確認すること

AdSenseのクライアントIDやスロットIDなどの秘密情報はREADMEに書かず、必要に応じてVercelの環境変数で管理します。
