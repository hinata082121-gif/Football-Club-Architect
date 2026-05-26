# AdSense Readiness Checklist

Football Club Architectを広告収益化に対応できる構造へ整えるための内部確認リストです。承認を保証するものではなく、再審査前の品質確認に使います。

## 固定ページ

- [ ] `/` がゲーム本体ではなく、説明量のあるランディングページになっている
- [ ] `/play` にゲーム本体が分離され、既存のlocalStorage保存キーと復元処理が維持されている
- [ ] `/about` が存在し、社長視点、AIスタッフ、監督AI、スカウト、財務、α版、localStorage保存を説明している
- [ ] `/how-to-play` が存在し、開始方法、月次進行、AP、社長アクション、公式戦、練習試合、財務再建を説明している
- [ ] `/features` が存在し、独自機能を箇条書きだけでなく本文付きで説明している
- [ ] `/faq` が存在し、広告がゲーム報酬に影響しないことを明記している
- [ ] `/contact` が存在し、バグ報告、改善要望、広告・プライバシー問い合わせの導線がある
- [ ] `/privacy`、`/terms`、`/disclaimer` が存在する
- [ ] `/glossary` が存在し、AP、委任レベル、スカウト方針、債務超過、localStorageなどを説明している
- [ ] `/updates` が存在し、継続開発されている独自プロジェクトであることが分かる

## 内容充実度

- [ ] 空ページがない
- [ ] 「準備中」だけのページがない
- [ ] 1〜2行だけの薄い固定ページがない
- [ ] トップページにゲーム概要、特徴、α版、localStorage保存、固定ページへのリンクがある
- [ ] how-to-playだけで初回ユーザーが基本操作を理解できる
- [ ] featuresがゲームの独自性を説明している
- [ ] FAQが実用的で、広告閲覧によるゲーム報酬がないことを説明している
- [ ] 固定ページに著者情報、最終更新、実装済み仕様に基づく説明がある
- [ ] `/updates` にlocalStorage保存、月次進行UX、公式戦4か月自動開催などの具体的な更新がある
- [ ] モバイルでも主要本文と内部リンクが省略されていない

## Header / Footer

- [ ] HeaderからPlay、How to Play、Features、FAQ、Updatesへ移動できる
- [ ] FooterからAbout、Contact、Privacy Policy、Terms、Disclaimer、Glossaryへ移動できる
- [ ] 404リンクがない
- [ ] スマホでもHeader/Footerリンクが画面外に破綻しない
- [ ] リンク文言が広告や報酬導線に見えない

## 広告配置安全性

- [ ] 審査前は `NEXT_PUBLIC_ENABLE_ADS=false` または未設定で広告枠が描画されない
- [ ] `/play` には広告枠を表示していない
- [ ] 広告は環境変数で有効化される
- [ ] ゲーム開始ボタン、社長アクション、翌月進行、試合実行、練習試合、公式戦エントリー付近に広告がない
- [ ] モーダル内に広告がない
- [ ] ローディング画面、エラー画面、空状態画面、GameOver直後の操作選択だけの画面に広告がない
- [ ] 広告クリックを促す表現がない
- [ ] 広告閲覧でゲーム内報酬を与える仕様がない
- [ ] 広告枠には必要に応じて「広告」またはAdvertisementのラベルを使う
- [ ] `NEXT_PUBLIC_ENABLE_ADS=false` でもサイト品質が成立する

## Privacy / Terms / Disclaimer / Contact

- [ ] PrivacyにlocalStorage、Cookie、Google AdSense、第三者配信事業者、問い合わせ情報、第三者提供、外部リンクを記載している
- [ ] Termsにα版、セーブデータ、禁止事項、不正利用、広告表示、サービス変更、免責を記載している
- [ ] Disclaimerにフィクション性、実在団体との無関係、データ変更、localStorage消失、外部リンクや広告の免責を記載している
- [ ] Contactに問い合わせ目的、バグ報告、改善要望、広告・プライバシー問い合わせ、返信保証なしを記載している

## SEO / クロール

- [ ] 各固定ページに固有のtitleとdescriptionがある
- [ ] `src/app/robots.ts` が存在し、サイト全体をDisallowしていない
- [ ] `src/app/sitemap.ts` が存在し、主要固定ページが含まれている
- [ ] sitemapに `/play` が含まれている
- [ ] `NEXT_PUBLIC_SITE_URL` が `https://football-club-architect.vercel.app` または本番ドメインに設定されている
- [ ] `robots.txt` のSitemap URLが公開ドメインと一致している

## AdSense確認タグ

- [ ] `google-adsense-account` metaがheadに出力されている
- [ ] AdSense確認用scriptが1回だけ読み込まれている
- [ ] 対象IDが `ca-pub-1305303366441643` である
- [ ] 広告枠を追加しすぎていない

## モバイル表示

- [ ] Header/Footerが崩れない
- [ ] 固定ページ本文が読みやすい
- [ ] ゲーム画面、試合画面、行動カードが横にはみ出さない
- [ ] 表やリストが画面外に出ない
- [ ] スマホで広告枠が操作ボタン付近に表示されない

## デプロイ確認

- [ ] `npm run lint` が通る
- [ ] `npm run build` が通る
- [ ] `git status` で差分を確認した
- [ ] `git add .` で必要ファイルをステージした
- [ ] `git commit` した
- [ ] `git push` した
- [ ] GitHub上で最新コミットを確認した
- [ ] Vercel Deploymentsで最新デプロイが成功している
- [ ] 公開URLで固定ページ、ゲーム開始、AdSense確認タグ、robots、sitemapを確認した
- [ ] Search Console URL inspectionでトップページと主要固定ページを確認した
- [ ] AdSense再審査前に、公開URLでhead内のmeta/scriptを確認した

## 審査中の軽微更新ルール

- [ ] 週1〜2回程度、既存ページに有用な追記を行う
- [ ] 更新内容は `/updates` に記録する
- [ ] 広告枠や広告位置は審査中に変更しない
- [ ] ゲーム本体の大幅仕様変更は避ける
- [ ] 日付だけの更新は行わない
- [ ] AI生成の薄いページを量産しない
- [ ] 既存ページの独自性、具体性、一次情報を増やす
- [ ] モバイルでも本文が省略されないことを確認する
- [ ] `/` と `/play` の分離構造、localStorage保存キー、AdSense所有権確認タグを維持する
