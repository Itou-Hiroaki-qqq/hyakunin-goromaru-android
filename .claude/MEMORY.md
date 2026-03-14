# 百人一首 ゴロでマル覚え Android版 - プロジェクトメモリ

## プロジェクト概要
- 既存Webアプリ（Next.js + Cloudflare Workers）のAndroidネイティブ版
- Expo (React Native) + TypeScript で実装
- バックエンドAPIは既存Cloudflare Workersを共用（Bearer Token認証に変更）

## 技術スタック
- Expo SDK 55 + React Native 0.83.2
- TypeScript 5.9
- Expo Router v5（ファイルベースルーティング）
- Zustand v5（状態管理）
- TanStack Query v5 + axios（APIクライアント）
- expo-secure-store（JWT Bearer認証トークン保存）
- expo-av（音声再生）
- React Native Reanimated v4（アニメーション）
- expo-sqlite（復習データのローカルDB）
- expo-notifications（プッシュ通知）
- expo-file-system/legacy（音声キャッシュ ※SDK 55で旧APIはlegacyに移動）

## 環境情報
- `.env` に `EXPO_PUBLIC_API_URL=https://hyakunin-goromaru.chiteijin315.workers.dev` 設定済み
- Expoアカウント: itohiroaki
- EASプロジェクトID: 6b878114-260c-4bef-baf6-420562eaf1f2
- gitリポジトリ初期化済み（ローカルのみ、GitHubへのpushなし）

## EASビルド状況
- developmentプロファイルでビルド成功（2026-03-12）
- ビルドID: 2d2b0b63-bb52-45de-9199-e71abffe5fd9
- APK: https://expo.dev/artifacts/eas/6zuTSBUTV3iTQMrsxAfoVg.apk
- スマホにインストール済み、開発サーバー接続で動作確認済み

---

## 旧アプリUI/UX移植作業（2026-03-13）

### 実施内容
docs/migration-plan.md の設計に基づき、Phase 1〜7を全て実装。

### Phase 1: 基盤整備（新規作成・修正）
- `src/utils/formatLines.ts` — splitToLines（旧アプリから移植）
- `src/utils/goroUtils.ts` — findGoroRange/goroToSearch（旧アプリから移植）
- `src/data/tricky-questions.ts` — KAMI_TRICKY_SETS(25)/SHIMO_TRICKY_SETS(24)
- `src/data/goro-timings.ts` — KAMI_GORO_END_SEC(100首) + getKamiGoroEndSec
- `src/components/ui/VerticalText.tsx` — lines[] props方式に変更
- `src/components/ui/ChoiceCard.tsx` — 琥珀色縦書き選択肢カード（〇×オーバーレイ）
- `src/components/ui/PoemCard.tsx` — highlightRange対応

### Phase 2: テスト画面
- `src/hooks/useKamiAudio.ts` — 問題切り替え時に音声自動再生
- `src/hooks/useGoroPlayback.ts` — 語呂ハイライトアニメーション
- `src/stores/testStore.ts` — clickedWrong[]方式、perfectScore追加
- `src/hooks/useTest.ts` — useKamiAudio/useGoroPlayback統合
- `app/learn/[range]/test.tsx` — ChoiceCard 2x2グリッド、語呂ハイライト
- `app/learn/all-test.tsx` — 同様の修正

### Phase 3: 学習フロー
- `src/stores/studyStore.ts` — phase('learn'|'practice') + learnStep(0-6)
- `src/hooks/useStudyStep.ts` — 全面書き直し（自動遷移、逐字表示、練習フェーズ）
- `app/learn/[range]/study.tsx` — 旧アプリの学習フロー再現

### Phase 4: 間違えやすい問題
- `app/tricky/index.tsx` — カテゴリ選択画面
- `app/tricky/[category]/index.tsx` — セット一覧画面（新規）
- `app/tricky/[category]/test.tsx` — TRICKY_SETSベース、問題方向修正

### Phase 5: 復習・実践問題
- `app/review/index.tsx` — 1問ずつクイズ形式に変更
- `app/jissen/play.tsx` — 音声のみで下の句を当てるモード（新規）
- `app/jissen/index.tsx` — play.tsxへの遷移

### Phase 6: コンピューター対戦
- `app/battle/play.tsx` — AIタイマー + 手アニメーション + 結果画面

### Phase 7: ホーム画面
- `app/index.tsx` — ロック/アンロック動的反映

### テスト結果
- 12スイート、318テスト全パス
- 新規テスト: formatLines.test.ts, goroUtils.test.ts, goroTimings.test.ts
- react-test-renderer@19.2.4 にアップデート（バージョン不一致修正）

### セキュリティレビュー結果
- CRITICAL/HIGH: なし
- MEDIUM: coverage/を.gitignoreに追加（対応済み）、EXPO_PUBLIC_変数の公開（バックエンド側でレート制限推奨）
- LOW: 本番ビルドでのconsole出力除去推奨（babel-plugin-transform-remove-console）

### ドキュメント
- `docs/migration-plan.md` — 旧アプリ→新アプリ修正設計計画
- `README.md` — GitHub向け、SDK 55対応に更新

### 動作確認状況
- ホーム画面: 表示OK
- ExpoKeepAwake.activateエラー: 開発ビルド時のみ、動作に影響なし（Dismiss可）
- 学習画面: 遷移OK、音声再生OK（expo-file-system/legacy修正後）
- **実機での全画面テストは次回実施予定**

---

---

## 8首・20首テスト追加（2026-03-14）

### 実施内容
学習一覧から8首テストと20首テストを直接起動できるボタンを追加。

### 変更ファイル
- `app/learn/index.tsx`
  - `EIGHT_TEST_BLOCK_IDS` — 8首テストを表示するブロックIDセット（2,4,6,...,24,25）
  - `TWENTY_TEST_BLOCKS` — 20首テストの範囲定義（ブロック5/10/15/20/25）
  - `getEightTestRangeKey()` — 「現ブロックfrom-4」〜「現ブロックto」の範囲キー計算
  - 展開時に緑系（8首）・紫系（20首）の追加ボタンを表示
- `app/learn/[range]/test.tsx`
  - `parseRangeKey()` を追加 — "1-8" / "1-20" のような任意の範囲文字列を解析
  - `resolveTestType()` を追加 — 首数から "8首" / "20首" 等のラベルを返す
  - `getBlockByRangeKey()` で見つからない場合に `parseRangeKey()` にフォールバック
  - ヘッダーラベルを `block?.label ?? range.replace('-','〜')+'首'` で生成

### 動作確認
- TypeScript `npx tsc --noEmit` でエラーなし

---

## 次回やること（優先順）

### 1. 実機での全画面動作確認
ユーザーが各画面を操作して不具合を報告予定。以下を確認：
- 学習6ステップの自動遷移と逐字表示
- テストの音声自動再生・語呂ハイライト・不正解再選択
- 間違えやすい問題のセット表示と問題方向
- コンピューター対戦のAIタイマー動作
- 実践問題（音声のみモード）
- 復習のクイズ形式
- ホーム画面のロック/アンロック

### 2. ユーザー報告の不具合修正
実機テスト結果に基づいて修正

### 3. 既存Cloudflare Workers にBearer Token認証を追加
- 対象: C:\Users\itonl\Desktop\01_Frontend\hyakunin-goromaru-cloudflare
- `/api/auth/login`, `/api/auth/register` にtokenフィールド追加
- Authorization: Bearer ヘッダー対応ミドルウェア
- CORS: モバイルからのリクエスト許可

### 4. 残りのタスク
- assets/fonts/ にNoto Serif JPフォント配置
- babel-plugin-transform-remove-console 導入（本番ビルド用）
- バックエンド側レート制限設定
- 本番ビルド（EAS production）→ Google Play Store申請

## 注意事項
- expo-file-system は `expo-file-system/legacy` からインポートすること（SDK 55対応）
- react@19.2.4 を使用（expo install --fix が19.2.0に戻そうとするが無視してOK）
- react-dom@19.2.0 がインストール済み（@expo/log-boxが依存）
- react-test-renderer@19.2.4 を使用
- npm install は `--legacy-peer-deps` が必要
- coverage/ は .gitignore に追加済み
