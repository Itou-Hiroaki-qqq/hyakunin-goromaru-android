# 百人一首 ゴロでマル覚え Android版 - プロジェクトメモリ

## プロジェクト概要
- 既存Webアプリ（Next.js + Cloudflare Workers）のAndroidネイティブ版
- Expo (React Native) + TypeScript で実装
- バックエンドAPIは既存Cloudflare Workersを共用（Bearer Token認証に変更）

## 技術スタック
- Expo SDK 55 + React Native 0.83
- TypeScript 5.9
- Expo Router v5（ファイルベースルーティング）
- Zustand v5（状態管理）
- TanStack Query v5 + axios（APIクライアント）
- expo-secure-store（JWT Bearer認証トークン保存）
- expo-av（音声再生）
- React Native Reanimated v3（アニメーション）
- expo-sqlite（復習データのローカルDB）
- expo-notifications（プッシュ通知）
- expo-file-system（音声キャッシュ）

## 実装済み機能

### 設定ファイル
- `package.json`: 全依存関係定義
- `app.json`: Expo設定（パッケージ名: jp.co.hyakunin_goromaru、Android向け）
- `tsconfig.json`: パスエイリアス（@/* → src/*）
- `babel.config.js`: expo + Reanimatedプラグイン
- `eas.json`: EAS Build設定（dev/preview/production）
- `.env.example`: 環境変数テンプレート
- `.gitignore`: Expo標準 + .env系除外

### 型定義（src/types/）
- `poem.ts`: Poemインターフェース（全カラム）
- `user.ts`: Userインターフェース
- `test.ts`: TestClear, TestBestScoreインターフェース

### 定数（src/constants/）
- `api.ts`: APIベースURL・エンドポイント・SecureStoreキー
- `study.ts`: 6ステップ定義・Battle難易度・カラーテーマ

### APIクライアント層（src/api/）
- `client.ts`: axiosインスタンス + Bearerトークンインターセプター
- `poems.ts`: GET /api/poems
- `auth.ts`: login/register/logout/getMe
- `testClears.ts`: GET/POST /api/test-clears
- `testBestScores.ts`: GET/POST /api/test-best-scores

### Zustandストア（src/stores/）
- `authStore.ts`: token/user/login/logout/restoreToken
- `studyStore.ts`: 6ステップ学習状態管理
- `testStore.ts`: 4択クイズ状態管理
- `battleStore.ts`: Battle対戦状態管理

### カスタムフック（src/hooks/）
- `usePoems.ts`: TanStack QueryでPoems取得
- `useAudio.ts`: expo-av音声再生制御
- `useStudyStep.ts`: 6ステップ学習制御（ステップ遷移＋音声再生）
- `useTest.ts`: テストロジック（4択生成・採点・結果保存）
- `useBattle.ts`: Battleタイマー制御
- `useReview.ts`: 復習データ管理

### コンポーネント（src/components/）
- `ui/VerticalText.tsx`: 縦書きテキスト（flexDirection: row-reverse + column）
- `ui/PoemCard.tsx`: 札風カード（琥珀色ボーダー）
- `ui/GoroText.tsx`: 語呂ハイライトテキスト（[]記法でハイライト）
- `ui/TypewriterText.tsx`: 逐字表示アニメーション（120ms間隔）
- `ui/StarBadge.tsx`: クリア★バッジ
- `ui/AudioButton.tsx`: 音声再生ボタン
- `learn/StudyCard.tsx`: 6ステップ学習カード
- `learn/QuizOption.tsx`: 4択選択肢（〇/×フィードバック）
- `battle/TimerBar.tsx`: Reanimatedを使ったAIタイマーバー
- `battle/ResultModal.tsx`: 勝敗結果モーダル
- `layout/Header.tsx`: 画面ヘッダー

### サービス（src/services/）
- `audioService.ts`: expo-avラッパー（playOnce/playSequence/stopAll）
- `audioCacheService.ts`: FileSystemを使った音声キャッシュ（LRU、200MB上限）
- `reviewDatabase.ts`: expo-sqlite操作（間隔反復スケジュール）
- `notificationService.ts`: expo-notificationsローカル通知

### ユーティリティ（src/utils/）
- `poemUtils.ts`: Fisher-Yatesシャッフル・4択問題生成
- `blockUtils.ts`: 25ブロック構造計算
- `scoreUtils.ts`: スコア計算・勝敗判定

### 画面（app/）
- `_layout.tsx`: QueryClientProvider + 認証復元 + DB初期化
- `index.tsx`: ホーム画面（5機能へのナビゲーション）
- `(auth)/login.tsx`: ログイン画面
- `(auth)/register.tsx`: ユーザー登録画面
- `learn/index.tsx`: 25ブロック一覧（展開可能、★クリア表示）
- `learn/[range]/study.tsx`: 6ステップStudyモード
- `learn/[range]/test.tsx`: 4択Testモード
- `learn/all-test.tsx`: 100首テスト
- `tricky/index.tsx`: 上の句/下の句カテゴリ選択
- `tricky/[category]/test.tsx`: Trickyテスト（30問）
- `battle/index.tsx`: Battle設定（難易度×問題数）
- `battle/play.tsx`: Battle対戦画面
- `jissen/index.tsx`: 実践問題（100首クリアで解放）
- `review/index.tsx`: 復習一覧（間隔反復スケジュール）
- `review/study.tsx`: 復習学習（正解で復習リストから削除）

## 作業内容の要約
- 2026-03-11: 設計ドキュメントに基づき全機能を実装
- `npx create-expo-app` でプロジェクト初期化（/tmp で作成後コピー）
- TypeScriptエラーゼロで型チェック通過
- `npm install` 成功（731パッケージ）

## 次のステップ
1. `.env` ファイルを作成して `EXPO_PUBLIC_API_URL` を設定
2. バックエンドAPIのBearer Token対応（/api/auth/login等のレスポンスにtokenを追加）
3. `npx expo start` でアプリを起動して動作確認
4. EAS Build でAPKビルド・実機テスト
5. Google Play Store申請

## 既知の制限・TODO
- assets/fonts/ ディレクトリは作成済みだがNoto Serif JPフォントは未配置（実装時に追加要）
- FlashList（@shopify/flash-list）は未導入（100首一覧で必要なら追加）
- 実践問題は100首クリア後のUIのみ実装（リスニング問題の本格実装は未）
- TrickyモードはWeb版と完全同一のデータ構造が必要（バックエンド要確認）

---

## テスト作業（2026-03-11）

### 追加した依存関係（devDependencies）
- `jest` `jest-expo@55` `babel-preset-expo` `@testing-library/react-native` `@testing-library/jest-native` `@types/jest` `react-test-renderer@19.2.0`
- `--legacy-peer-deps` フラグが必要（react@19.2.0とreact-test-rendererのpeer deps競合）

### 作成したテストインフラ
- `jest.config.js`: jest-expoプリセット + `@/`エイリアス + expo/src/winterモック設定
- `__tests__/setup/mocks.ts`: ネイティブモジュールの一括モック
- `__tests__/setup/expoWinterMock.js`: expo/src/winterのimport.meta問題の回避モック

### テスト結果（244テスト・全PASS）
| ファイル | テスト数 |
|---------|---------|
| utils/poemUtils.test.ts | 30 |
| utils/blockUtils.test.ts | 32 |
| utils/scoreUtils.test.ts | 34 |
| stores/studyStore.test.ts | 26 |
| stores/testStore.test.ts | 31 |
| stores/battleStore.test.ts | 40 |
| components/VerticalText.test.tsx | 17 |
| components/GoroText.test.tsx | 17 |
| components/QuizOption.test.tsx | 17 |
| **合計** | **244** |

### カバレッジ
- Statements: 100% / Branches: 97.56% / Functions: 100% / Lines: 100%
- 未カバー2箇所はデッドコード（blockUtils.ts:63の`to > 100`は到達不能・GoroText.tsx:57のパース失敗フォールバック）

### 発見した問題
- `blockUtils.ts` 63行目: `to: to > 100 ? 100 : to` の条件は`Math.min(from + 7, 100)`ですでに上限保証されているためデッドコード

### 将来追加すべきテスト
- `src/hooks/` のカスタムフックテスト（usePoems, useStudyStep, useTest, useBattle）
- `src/api/` のAPIクライアントテスト（axiosモック使用）
- `src/services/` のサービステスト（audioService, reviewDatabase）
- E2Eテスト（DetoxまたはMaestro）

---

## README.md 作成（2026-03-11）

- `README.md` を新規作成（GitHub向け、日本語）
- 記載内容: プロジェクト概要・主要機能・技術スタック・セットアップ手順・環境変数・ビルド方法・テスト方法・プロジェクト構成・バックエンド連携・Android対応バージョン・ライセンス
- 参照ファイル: `app.json` / `eas.json` / `tsconfig.json` / `.env.example` / `docs/architecture-design.md`
