# Codex Development Guide

## 開発ルール

- このリポジトリは「Football Club Architect」専用です。
- 日本語サブタイトルが必要な場合は「AIで創る名門クラブ」または「AIクラブ経営シミュレーション」を使用します。
- 別プロジェクトの仕様、命名、設計判断を混ぜないでください。
- まずはローカル状態で遊べるシングルプレイMVPを優先します。
- DB、認証、オンライン対戦、課金、リアル日程連動はMVP範囲外です。
- 変更前に既存コードを確認し、既存の構成と命名に合わせてください。

## テストとLint

```bash
npm run lint
npm run build
```

Phaseごとの実装後は、可能な範囲で上記を実行してください。
テストフレームワークは未導入のため、必要になったPhaseで追加します。

## ディレクトリ構成

```text
/src
  /app
    page.tsx
  /components
    Dashboard.tsx
    ActionPanel.tsx
    StaffPanel.tsx
    MatchPanel.tsx
    LogPanel.tsx
    FinancePanel.tsx
    TrainingMatchPanel.tsx
  /game
    initialState.ts
    turnEngine.ts
    playerActionEngine.ts
    staffAIEngine.ts
    matchEngine.ts
    trainingMatchEngine.ts
    eventEngine.ts
    balance.ts
  /types
    game.ts
  /utils
    random.ts
/docs
```

## ロジックとUIの分離

- ゲーム計算、状態更新、AI判断、試合処理は `/src/game` に置きます。
- Reactコンポーネントは表示とユーザー操作の入口に集中します。
- UI内に複雑なゲームルールや数値計算を直接書かないでください。
- エンジン関数は小さく保ち、入力と出力が追いやすい形にしてください。

## 型安全性

- 主要なドメイン型は `/src/types/game.ts` に集約します。
- `any` は避け、ユニオン型や明示的なinterfaceを使ってください。
- 状態更新関数の戻り値は型で保証してください。

## 数値バランス

- 初期資金、行動ポイント、試合補正、スタッフ雇用費などの数値は `/src/game/balance.ts` に集約します。
- コンポーネントやエンジンにマジックナンバーを直接散らさないでください。
- バランス調整はゲームの挙動変更として扱い、変更内容を報告してください。
