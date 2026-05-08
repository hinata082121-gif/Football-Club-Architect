# Football Club Architect Financial Recovery Design

## 概要

財務リカバリー導線は、クラブ資金が悪化したときにプレイヤーがただ詰むのではなく、融資、スポンサー前借り、選手売却、人件費削減、再建計画を通じて立て直せるようにするための設計です。

債務超過ゲームオーバー制度は、経営シミュレーションとして財務判断に重みを持たせるために導入します。ただし、資金がマイナスになった瞬間に即ゲームオーバーにすると理不尽になりやすいため、警告、猶予、救済策、最終判断を挟む段階制にします。

プレイヤーはクラブ社長です。危機時にも、どの資産を守るか、誰を売るか、どの借入を受けるか、再建の方向性をどうするかを判断できる余地を残します。

## 財務悪化時の基本フロー

1. 資金減少
2. 財務警告
3. 改善提案
4. 短期リカバリー行動
5. 融資、スポンサー前借り、選手売却などの再建策
6. 債務超過予備状態
7. 債務超過
8. 再建猶予期間
9. 改善できなければ経営破綻

この流れは `ActionLog` と `FinanceLog` に記録し、HomeScreen と FinanceScreen でプレイヤーがすぐ把握できるようにします。

## 財務状態ランク

```ts
type FinancialHealthStatus =
  | "healthy"
  | "caution"
  | "cash_shortage"
  | "financial_crisis"
  | "insolvency_warning"
  | "insolvent"
  | "bankrupt";
```

### healthy

- 資金がプラス
- 通常運営
- 財務警告は表示しない

### caution

- 資金が少ない
- 軽い警告を表示
- スポンサー営業、練習試合、支出確認を提案

### cash_shortage

- 資金がマイナス
- リカバリー導線を表示
- 選手年俸、スタッフ給与、固定費の内訳を強調

### financial_crisis

- マイナス幅が大きい
- 融資、スポンサー前借り、高年俸整理を提案
- スタッフAIにも財務リスク警告ログを出す

### insolvency_warning

- 債務超過寸前
- 再建計画を強く促す
- 公式戦エントリーや高額行動に追加警告を出す

### insolvent

- 債務超過
- 猶予カウント開始
- 猶予中は最終救済策を表示

### bankrupt

- 経営破綻
- ゲームオーバー画面、または縮小再建リスタートへ進む

## リカバリー導線

### 融資制度

```ts
type LoanType =
  | "short_term"
  | "long_term"
  | "emergency"
  | "regional_support"
  | "owner_injection";
```

#### short_term

- 少額
- すぐ借りられる
- 利息高め
- 返済期間短め
- 軽い資金ショートの穴埋め用

#### long_term

- 大きな金額
- 返済期間長め
- 審査あり
- クラブ評判、ファン数、スポンサー力、月次収益が影響

#### emergency

- 財務危機時のみ
- 条件が厳しい
- 利息高め
- 経営破綻回避用
- 使用後は評判低下や行動制限があってもよい

#### regional_support

- 地域密着方針や地元ファン数が高いと有利
- 利息低め
- 金額は控えめ
- `club.policy === "local_first"` と相性がよい

#### owner_injection

- 借金ではなく追加出資
- 使用回数制限あり
- 社長評価、評判、クラブ独立性にペナルティを付けてもよい
- MVPでは「最終救済寄りの資金注入」として扱う

### スポンサー収入の前借り

- 即資金化できる
- 今後数か月のスポンサー収入が減る
- 評判やスポンサー評価が下がる可能性がある
- 短期資金繰り用
- `sponsorPower` が高いほど前借り可能額が増える

### 選手売却・高年俸整理

- 主力売却で資金を確保
- 高年俸ベテラン整理で月次支出を削減
- 戦力低下とファン不満のリスク
- 既存の `transferEngine` と `contractEngine` に接続する
- 財務危機時は PlayerCard に「売却候補」提案を出す

### スタッフ人件費削減

- 高給スタッフを整理
- 一部業務の委任停止
- AI行動効率が下がる
- スタッフ不満が増える
- スタッフ削減は重大判断のため、AIが勝手に実行しない

### グッズ在庫処分

- 短期資金回収
- 利益率低下
- ブランド価値低下の可能性
- `goodsPower` や評判に小さな悪影響を与える

### チケット価格変更

- 値上げで短期収益増
- ファン満足度低下
- 値下げで観客増加、収益単価低下
- 将来的に観客動員、スタジアム収容人数、ファン満足度と接続する

### スタジアム維持費削減

- 支出削減
- 施設劣化リスク
- ファン満足度低下
- 長期的には `condition` や `reputation` に悪影響

### 再建計画モード

再建計画は、数か月単位で支出と成長方針を変える一時的なクラブ方針です。

- 人件費削減プラン
- 若手育成再建プラン
- 地域密着再建プラン
- スポンサー重視再建プラン
- 選手売却再建プラン

再建計画中は、特定行動の効果やコスト、スタッフAIの提案内容を補正します。

## 債務超過とゲームオーバー

### 債務超過ライン例

- `money < -3,000,000`

### 経営破綻条件例

- 資金が債務超過ラインを下回る
- `insolvent` 状態が3か月継続
- 融資枠または再建策を使っても改善できない
- 最終警告イベント後も改善できない

### 設計上の注意

- 即ゲームオーバーにはしない
- 必ず警告と猶予期間を設ける
- `ActionLog` に状態変化を記録する
- HomeScreen や FinanceScreen で強く表示する
- 公式戦や練習試合は継続可能にし、立て直し余地を残す

## ゲームオーバー前の最終救済

```ts
type FinalRecoveryOption =
  | "fire_sale_players"
  | "reduce_staff"
  | "emergency_loan"
  | "downsize_club"
  | "declare_bankruptcy";
```

### fire_sale_players

- 複数選手を売却して即資金化
- 戦力とファンが低下
- 若手や主力を守るかどうかが判断軸になる

### reduce_staff

- スタッフを削減
- 月次支出を下げる
- AI委任効率が低下
- スタッフ不満や評判に悪影響

### emergency_loan

- 高利の緊急融資
- 破綻回避用
- 返済負担が重い
- 使用回数制限あり

### downsize_club

- 完全ゲームオーバーではなく、クラブ規模を縮小して継続
- `clubLevel` 低下
- `reputation` 低下
- 一部選手退団
- 一部スタッフ退職
- `money` を一定値にリセット
- 再建ペナルティあり

### declare_bankruptcy

- 経営破綻
- ゲームオーバー画面へ
- 最終クラブ成績、最高戦力、通算成績、社長評価を表示する

## UI設計

### HomeScreen

- 財務警告
- 現在の財務状態
- すぐできる改善提案
- 「財務画面へ」導線
- `insolvent` 以上では強い警告カードを表示

### FinanceScreen

- 財務状態ランク
- 資金
- 月次収支
- 借入残高
- 返済予定
- リカバリー行動一覧
- 債務超過までの距離
- 債務超過猶予期間
- 選手年俸、スタッフ給与、固定費の分離表示

### ActionScreen

- 財務リカバリー行動
- 融資申し込み
- スポンサー前借り
- コスト削減
- 財務危機時は通常行動より上にリカバリー導線を出す

### GameOverScreen

- 経営破綻結果
- 最終クラブ成績
- 再建リスタート選択肢
- 新規開始選択肢
- 破綻理由のサマリー

## 実装優先度

### 優先度高

1. `FinancialHealthStatus`
2. 財務状態判定
3. 財務警告UI
4. 融資制度
5. 債務超過猶予カウント
6. ゲームオーバー判定

### 優先度中

7. スポンサー前借り
8. スタッフ削減
9. 選手売却との連動
10. 再建計画モード

### 優先度低

11. グッズ在庫処分
12. チケット価格変更
13. スタジアム維持費削減
14. 再建リスタート演出

## 今後変更が必要なファイル

### 型

- `src/types/game.ts`
  - `FinancialHealthStatus`
  - `Loan`
  - `LoanType`
  - `RecoveryAction`
  - `FinalRecoveryOption`
  - `GameOverReason`
  - `GameState.financialHealthStatus`
  - `GameState.loans`
  - `GameState.insolventMonths`
  - `GameState.isGameOver`

### ゲームロジック

- `src/game/financialRecoveryEngine.ts`
  - 財務状態判定
  - 融資
  - スポンサー前借り
  - 再建計画
  - ゲームオーバー判定
- `src/game/turnEngine.ts`
  - 月次返済
  - 財務状態更新
  - 債務超過猶予カウント
- `src/game/balance.ts`
  - 債務超過ライン
  - 融資額、利息、返済月数
  - 救済策のコストとペナルティ
- `src/game/contractEngine.ts`
  - 高年俸整理提案
  - 選手売却との連動
- `src/game/staffManagementEngine.ts`
  - スタッフ削減

### UI

- `src/components/screens/HomeScreen.tsx`
- `src/components/screens/FinanceScreen.tsx`
- `src/components/screens/ActionsScreen.tsx`
- `src/components/GameOverScreen.tsx`
- `src/components/FinancialRecoveryPanel.tsx`
- `src/components/FinancialHealthBadge.tsx`

## MVP/α版での最小実装案

最初の実装では、次の範囲に絞ります。

1. 資金に応じて財務状態を判定する
2. `money < 0` でリカバリーパネルを出す
3. `money < -3,000,000` で `insolvent` にする
4. `insolvent` が3か月続いたら最終救済イベントを出す
5. 最終救済後も改善しなければ `bankrupt`
6. 融資は `short_term` と `emergency` の2種類から始める
7. 選手売却とスタッフ削減は既存機能へ導線を出す

## ストレス軽減方針

- 破綻は突然発生させない
- 警告、猶予、選択肢、ログを必ず出す
- 借入は救済だが、長期的な返済負担を残す
- 高年俸選手やスタッフを整理すれば改善できる状態にする
- 縮小再建を用意し、完全ゲームオーバー以外の継続ルートを残す
