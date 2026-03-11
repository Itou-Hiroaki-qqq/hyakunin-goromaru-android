# 百人一首 -ゴロでマル覚え- Android版 設計ドキュメント

## 1. 現状分析

### 既存Webアプリの構成概要

既存アプリはNext.js 15 (App Router) + Cloudflare Workers + D1というサーバーレス構成で動作している。

- バックエンドはCloudflare WorkersのAPIとして整備済みであり、Android版はこれを共用できる
- 認証はhttpOnlyクッキー + JWTというWeb標準方式であり、ネイティブアプリへの移植時に変更が必要
- 縦書き表示・文字逐次アニメーション・音声同期など、ネイティブ実装の難度が高いUI要素が含まれる
- 音声ファイルはCloudflare R2上に保存済みであり、URLアクセス可能
- データはすべてサーバーサイドに集約されており、localStorageを用いた復習機能のみクライアント依存

---

## 2. フレームワーク選定

### 案A: Capacitor（既存WebアプリをAndroidアプリ化）

- **概要**: 既存のNext.jsコードベースをそのままCapacitorでラップし、WebViewベースのAndroidアプリとして配布する
- **メリット**:
  - 既存コード（縦書きCSS、Howler.js、DaisyUI等）をほぼ無変更で転用できる
  - Web版とほぼ同一のUIを維持できる
  - 開発工数が最小
- **デメリット**:
  - WebViewベースのためパフォーマンスが劣る（特にアニメーション）
  - Next.js App RouterはSSR前提のため、Capacitorとの統合にビルド設定の調整が必要（静的エクスポートへの変換が必要）
  - ネイティブのAndroid UIガイドラインから逸脱する

### 案B: React Native + Expo（ネイティブアプリとして再構築）★推奨

- **概要**: Expo（React Native）を使い、既存のビジネスロジックとAPIクライアントコードを再利用しつつ、UIをネイティブコンポーネントで再実装する
- **メリット**:
  - ネイティブパフォーマンス（アニメーション、タッチ応答等）
  - Expo Routerにより画面遷移が直感的に実装できる
  - TypeScriptをそのまま使用でき、API通信ロジック・型定義は再利用可能
  - `expo-av`による安定した音声再生
  - Expo EASでビルド・配布が簡単
  - 将来的にiOS版展開も視野に入れやすい
- **デメリット**:
  - UIを全面的に再実装する必要がある（縦書き・DaisyUIは使えない）
  - 縦書きテキストのネイティブ実装が複雑

### 案C: Expo + React Native Web（Web/Android共通コードベース）

- **概要**: ExpoベースでReact Native Webを活用しWeb/Android共用のモノレポ構成
- **非推奨理由**: 既存Next.js App Routerとの構造差が大きく、実質的な再利用範囲が限定的

### 推奨: 案B（React Native + Expo）

**理由:**

1. **コンテンツの性質との適合性**: 音声再生・アニメーション・タイマー処理を多用するため、WebViewベースでは品質がネイティブに劣る
2. **認証方式の移行**: どちらの案でもhttpOnlyクッキー認証→トークンベースへの変更が必要であり、工数差はない
3. **縦書き実装の現実性**: CSSの`writing-mode`が使えないが、カスタムコンポーネントで対応可能であり、パフォーマンス上の優位性がそれを上回る
4. **長期メンテナンス性**: CapacitorはWebViewの挙動に影響を受けやすく、Next.jsのバージョンアップ追随コストが継続的にかかる
5. **APIコードの再利用**: ビジネスロジック（API通信、型定義、テストロジック等）はTypeScriptで書かれており、React Nativeへの移植工数が最も少ない

---

## 3. 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Expo SDK + React Native | SDK 52 / RN 0.76 |
| 言語 | TypeScript | 5.x |
| ルーティング | Expo Router | v4（ファイルベース） |
| 状態管理 | Zustand | 最新 |
| APIクライアント | TanStack Query v5 + axios | 最新 |
| 認証 | Expo SecureStore + JWT（Bearer認証） | - |
| 音声再生 | expo-av | 最新 |
| アニメーション | React Native Reanimated | v3 |
| スタイリング | StyleSheet（+ 必要に応じてNativeWind v4） | - |
| ビルド・配布 | Expo EAS Build | 最新 |
| ローカルDB | expo-sqlite（復習データのオフラインキャッシュ） | 最新 |
| Push通知 | Expo Notifications | 最新 |

---

## 4. 認証方式の変更設計

### 背景

既存Web版はhttpOnlyクッキー + JWTだが、AndroidアプリではhttpOnlyクッキーは利用不可のため変更が必要。

### 変更方針: Bearer Token認証

**バックエンドAPI側の変更:**

- `/api/auth/login` および `/api/auth/register` のレスポンスにJWTトークンをJSONボディで追加して返す
  - クッキーとの併用でWebとの後方互換を保つ
- `/api/auth/me` および保護済みエンドポイントが`Authorization: Bearer <token>`ヘッダーも受け付けるよう変更
- 既存のクッキーベース認証はWeb版のためにそのまま残す

**レスポンス変更例:**

```json
{
  "user": { "uid": "...", "name": "...", "email": "..." },
  "token": "eyJhbGci..."
}
```

**Androidアプリ側の実装:**

- ログイン成功時にJWTトークンを`expo-secure-store`に暗号化保存
- 以後の全APIリクエストに`Authorization: Bearer <token>`ヘッダーを付与
- トークンの有効期限管理とリフレッシュ処理はaxiosインターセプターで実装

---

## 5. 既存DBスキーマ（Cloudflare D1 / 共用）

### poems テーブル（100行）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PK | 1-100 |
| kami | TEXT | 上の句（漢字） |
| shimo | TEXT | 下の句（漢字） |
| kami_hiragana | TEXT | 上の句（ひらがな） |
| shimo_hiragana | TEXT | 下の句（ひらがな） |
| kami_tts / shimo_tts | TEXT | TTS用テキスト |
| kami_goro / shimo_goro | TEXT | 語呂合わせ |
| kami_goro_tts / shimo_goro_tts | TEXT | 語呂TTS用テキスト |
| goro_kaisetsu | TEXT | 語呂の解説 |
| kami_audio_url / shimo_audio_url | TEXT | R2音声URL |
| kami_goro_audio_url / shimo_goro_audio_url | TEXT | R2語呂音声URL |

### users テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| uid | TEXT PK | UUID |
| name | TEXT | ユーザー名 |
| email | TEXT UNIQUE | メールアドレス |
| password_hash | TEXT | PBKDF2ハッシュ（salt:hash形式） |
| created_at | TEXT | ISO日時 |

### user_test_clears テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PK AUTO | - |
| user_id | TEXT FK | users.uid |
| test_type | TEXT | "4首", "8首", "20首", "100首", "tricky_kami", "tricky_shimo" |
| range_key | TEXT | "1-4", "all", "summary" |
| cleared_at | TEXT | ISO日時 |

UNIQUE(user_id, test_type, range_key)

### user_test_best_scores テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| user_id | TEXT | users.uid |
| test_key | TEXT | "range:1-4", "100:all" |
| best_score | INTEGER | 最高連続正解数 |
| updated_at | TEXT | ISO日時 |

PK(user_id, test_key)

---

## 6. APIエンドポイント（共用）

| ルート | メソッド | 認証 | 用途 |
|--------|---------|------|------|
| `/api/poems?from=&to=` | GET | 不要 | 詩データ取得 |
| `/api/auth/login` | POST | 不要 | ログイン |
| `/api/auth/register` | POST | 不要 | ユーザー登録 |
| `/api/auth/logout` | POST | 必要 | ログアウト |
| `/api/auth/me` | GET | 任意 | ユーザー情報取得 |
| `/api/test-clears` | GET | 任意 | テストクリア状況取得 |
| `/api/test-clears` | POST | 必要 | テストクリア保存 |
| `/api/test-best-scores` | GET | 任意 | ベストスコア取得 |
| `/api/test-best-scores` | POST | 必要 | ベストスコア保存 |

---

## 7. 全機能一覧

### 7.1 学習 (Learn)

**ブロック一覧:**
- 25ブロック × 4首の段階的学習（4首→8首→20首→100首）
- 各ブロックのクリア状態を★で表示
- 展開可能なセクション

**Study モード（6ステップ学習）:**
1. 上の句 漢字表示 + 自動音声再生
2. 上の句 ひらがな逐字表示（120ms間隔）
3. 下の句表示 + 音声再生
4. 語呂（上）音声 + 解説
5. 語呂（下）音声 + 解説
6. 語呂まとめ再生

**Test モード:**
- 4択クイズ（正解1 + ダミー3、全100首からランダム選択）
- スコア追跡（総正解数 + 一発正解連続数）
- 語呂解説を回答後に表示
- 不正解→復習リストに追加
- ベストスコアをバックエンド + ローカルに保存

### 7.2 間違えやすい問題 (Tricky)

- カテゴリ: 上の句 / 下の句
- セット別テスト + まとめテスト
- 2-3択形式
- 語呂ハイライト + 解説機能

### 7.3 コンピューター対戦 (Battle)

- 難易度: 初級(4秒) / 中級(2秒) / 上級(0.5秒)
- 問題数: 20 / 40 / 60 / 80 / 100
- AIタイマー + リアルタイムスコア表示
- 勝ち / 負け / 引き分け判定

### 7.4 実践問題 (Jissen)

- 100首テストクリア後に解放されるリスニング問題

### 7.5 復習 (Review)

- テストで間違えた問題を管理
- 間隔反復システム
- 復習からの削除機能

### 7.6 認証

- ユーザー登録（名前、メール、パスワード6文字以上）
- ログイン / ログアウト
- 未ログインでも学習・テストは可能（スコア保存不可）

---

## 8. 縦書き表示の実装方式

React Nativeには`writing-mode: vertical-rl`相当のCSSプロパティが存在しないため、カスタムコンポーネントで対応する。

### VerticalText コンポーネント設計

```
props:
  - text: string          // 表示テキスト
  - highlightRange?: { start: number, length: number }  // 語呂ハイライト範囲
  - highlightColor?: string  // ハイライト色（デフォルト: 赤）
  - fontSize?: number     // フォントサイズ
  - lineLength?: number   // 1行の文字数（上の句: 3, 下の句: 2）

実装:
  1. テキストをlineLength文字ずつに分割
  2. 各行をflexDirection: 'column'のViewで縦に配置
  3. 行をflexDirection: 'row-reverse'のViewで右→左に配置
  4. 語呂部分のTextにcolor: redを適用
  5. 句読点・長音符はtransform: rotate(90deg)で回転
```

### パフォーマンス対策

- `React.memo`で不要な再レンダリングを防止
- 100首一覧画面では`FlashList`（Shopifyのhigh-performance FlatList代替）を使用
- `estimatedItemSize`を正確に設定

---

## 9. 音声再生の設計

### AudioService

`expo-av`の`Audio.Sound`を使用し、Howler.jsのAPIに相当する機能を実装する。

```typescript
// AudioService インターフェース
class AudioService {
  loadSound(url: string): Promise<Audio.Sound>
  playOnce(url: string): Promise<void>
  playSequence(urls: string[], intervalMs?: number): Promise<void>
  stopAll(): void
  preloadSounds(urls: string[]): Promise<void>  // オフラインキャッシュ用
}
```

### 音声キャッシュ戦略

- 初回再生時に音声ファイルを`FileSystem.documentDirectory + 'audio/'`にダウンロード保存
- 以降はローカルファイルパスを参照
- 全400ファイル（100首 × 4種）のうち、アクセスした首の音声のみキャッシュ（遅延DL）
- キャッシュサイズ上限: 200MB目安、超過時はLRUで削除

---

## 10. オフライン対応・キャッシュ戦略

### データキャッシュ（TanStack Query）

- 詩データ（`/api/poems`）は初回取得後にPersistQueryClientを使い`expo-file-system`に永続化
- TTL: 24時間（詩データは変更されないため長期キャッシュ可能）

### 音声キャッシュ（expo-file-system）

- 前節参照

### 復習データ（expo-sqlite）

Web版のlocalStorageに相当する復習データをexpo-sqliteで管理する。

```sql
-- ローカルDB スキーマ
CREATE TABLE review_items (
  poem_id INTEGER PRIMARY KEY,
  error_count INTEGER DEFAULT 1,
  next_review_at TEXT,
  last_reviewed_at TEXT
);
```

---

## 11. プッシュ通知（復習リマインダー）

`expo-notifications`によるローカル通知（サーバー不要）。

- 間隔反復スケジュールに従った通知スケジュール
- `expo-sqlite`の`next_review_at`を元にアプリ起動時に再スケジュール
- 通知権限はオンボーディング画面で要求

---

## 12. ディレクトリ構成

```
hyakunin-goromaru-android/
├── app/                          # Expo Router: 画面定義
│   ├── _layout.tsx               # ルートレイアウト（認証プロバイダー、TanStack Query）
│   ├── index.tsx                 # ホーム画面（機能一覧）
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # ログイン画面
│   │   └── register.tsx          # ユーザー登録画面
│   ├── learn/
│   │   ├── index.tsx             # 学習トップ（25ブロック一覧）
│   │   ├── [blockId]/
│   │   │   ├── index.tsx         # ブロック詳細（4/8/20/100首選択）
│   │   │   ├── study.tsx         # Studyモード（6ステップ）
│   │   │   └── test.tsx          # Testモード（4択クイズ）
│   ├── tricky/
│   │   ├── index.tsx             # Tricky トップ
│   │   ├── [category]/
│   │   │   └── test.tsx          # セット別・まとめテスト
│   ├── battle/
│   │   ├── index.tsx             # Battle設定画面
│   │   └── play.tsx              # Battle対戦画面
│   ├── jissen/
│   │   └── index.tsx             # 実践問題（解放条件あり）
│   └── review/
│       ├── index.tsx             # 復習一覧
│       └── study.tsx             # 復習学習
│
├── src/
│   ├── api/                      # APIクライアント層
│   │   ├── client.ts             # axiosインスタンス + インターセプター
│   │   ├── poems.ts              # /api/poems
│   │   ├── auth.ts               # /api/auth/*
│   │   ├── testClears.ts         # /api/test-clears
│   │   └── testBestScores.ts     # /api/test-best-scores
│   │
│   ├── types/                    # 型定義（既存Webアプリから転用可能）
│   │   ├── poem.ts
│   │   ├── user.ts
│   │   └── test.ts
│   │
│   ├── stores/                   # Zustand ストア
│   │   ├── authStore.ts          # 認証状態（token, user）
│   │   ├── studyStore.ts         # 学習進捗（ステップ管理）
│   │   ├── testStore.ts          # テスト状態（スコア、問題リスト）
│   │   └── battleStore.ts        # Battle状態（タイマー、スコア）
│   │
│   ├── hooks/                    # カスタムフック
│   │   ├── usePoems.ts           # TanStack Query: 詩データ取得
│   │   ├── useAudio.ts           # 音声再生制御
│   │   ├── useStudyStep.ts       # 6ステップ学習制御
│   │   ├── useTest.ts            # テストロジック（4択生成、採点）
│   │   ├── useBattle.ts          # Battleタイマー制御
│   │   └── useReview.ts          # 復習スケジュール管理
│   │
│   ├── components/               # 共通コンポーネント
│   │   ├── ui/
│   │   │   ├── VerticalText.tsx  # 縦書きテキスト（★重要）
│   │   │   ├── PoemCard.tsx      # 札風カード
│   │   │   ├── GoroText.tsx      # 語呂ハイライトテキスト
│   │   │   ├── TypewriterText.tsx # 逐字表示アニメーション
│   │   │   ├── StarBadge.tsx     # クリア★バッジ
│   │   │   └── AudioButton.tsx   # 音声再生ボタン
│   │   ├── learn/
│   │   │   ├── StudyCard.tsx     # Studyカード
│   │   │   └── QuizOption.tsx    # 4択選択肢
│   │   ├── battle/
│   │   │   ├── TimerBar.tsx      # タイマーバー
│   │   │   └── ResultModal.tsx   # 勝敗モーダル
│   │   └── layout/
│   │       ├── TabBar.tsx        # ボトムナビゲーション
│   │       └── Header.tsx        # 画面ヘッダー
│   │
│   ├── services/
│   │   ├── audioService.ts       # 音声再生サービス（expo-av）
│   │   ├── audioCacheService.ts  # 音声ファイルキャッシュ管理
│   │   ├── reviewDatabase.ts     # expo-sqlite: 復習データ操作
│   │   └── notificationService.ts # expo-notifications
│   │
│   ├── utils/
│   │   ├── poemUtils.ts          # 問題生成（4択、ランダム等）
│   │   ├── blockUtils.ts         # 25ブロック計算
│   │   └── scoreUtils.ts         # スコア計算
│   │
│   └── constants/
│       ├── api.ts                # APIベースURL等
│       └── study.ts              # ステップ定義、難易度定数
│
├── assets/
│   ├── images/
│   │   ├── icon.png              # アプリアイコン
│   │   └── splash.png            # スプラッシュスクリーン
│   └── fonts/                    # 和風フォント（Noto Serif JP等）
│
├── app.json                      # Expo設定
├── eas.json                      # EAS Build設定
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 13. 画面遷移図

```
[スプラッシュ / 起動]
        |
        v
[ホーム画面] ─── ボトムナビゲーション ──────────────────────────────
   |                                                               |
   |── [学習 (Learn)]                                             |
   |       |                                                      |
   |       ├── [ブロック一覧] (25ブロック)                         |
   |       |        |                                             |
   |       |        ├── [ブロック詳細] (4/8/20/100首選択)          |
   |       |        |        |                                    |
   |       |        |        ├── [Studyモード]                    |
   |       |        |        |    ステップ1: 上の句 漢字表示        |
   |       |        |        |    ステップ2: 上の句 逐字ひらがな    |
   |       |        |        |    ステップ3: 下の句表示            |
   |       |        |        |    ステップ4: 語呂 上               |
   |       |        |        |    ステップ5: 語呂 下               |
   |       |        |        |    ステップ6: 語呂まとめ + 解説      |
   |       |        |        |         └── [次の首 / ブロック完了]  |
   |       |        |        |                                    |
   |       |        |        └── [Testモード]                     |
   |       |        |             4択クイズ × n首                  |
   |       |        |             [スコア結果画面] ─★保存           |
   |       |        |                  └── [ブロック詳細に戻る]     |
   |       |                                                      |
   |── [間違えやすい問題 (Tricky)]                                 |
   |       |                                                      |
   |       ├── [上の句カテゴリ一覧]                                |
   |       |   └── [セット別テスト] / [まとめテスト]               |
   |       |        2-3択クイズ → [結果画面]                       |
   |       |                                                      |
   |       └── [下の句カテゴリ一覧]                                |
   |           └── [セット別テスト] / [まとめテスト]               |
   |                                                              |
   |── [コンピューター対戦 (Battle)]                               |
   |       |                                                      |
   |       ├── [Battle設定画面] (難易度 × 問題数)                  |
   |       |                                                      |
   |       └── [Battle対戦画面]                                   |
   |            AIタイマー動作中                                   |
   |            [勝ち / 負け / 引き分け モーダル]                   |
   |                 └── [設定画面に戻る]                          |
   |                                                              |
   |── [実践問題 (Jissen)] ←100首テストクリアで解放                |
   |       |                                                      |
   |       └── [100首テスト]                                      |
   |            [結果画面] → スコア保存                            |
   |                                                              |
   |── [復習 (Review)]                                            |
   |       |                                                      |
   |       ├── [復習一覧] (間隔反復スケジュール表示)                |
   |       └── [復習学習] (Study形式 / Test形式)                   |
   |                                                              |
   └── [アカウント]
           |
           ├── [ログイン画面] ──→ ホームへ
           ├── [ユーザー登録画面] ──→ ホームへ
           └── [ログアウト] ──→ ホームへ（非認証状態）
```

---

## 14. 実装時の注意点

### 14.1 バックエンドAPIの変更（最重要）

既存の`/api/auth/login`と`/api/auth/register`のレスポンスを拡張する必要がある。クッキー認証は既存Web版のために残し、JSONボディにもトークンを含める。

また`/api/auth/me`と保護済みエンドポイントが`Authorization`ヘッダーを受け付けるよう変更が必要。

### 14.2 CORS設定の確認

Cloudflare Workers側でAndroidアプリからのHTTPSリクエストを許可するCORS設定が必要。モバイルアプリからのリクエストはOriginヘッダーが`null`またはアプリ固有の値になるため、Workers側でOriginの検証ロジックを確認・調整すること。

### 14.3 縦書きコンポーネントのパフォーマンス

VerticalTextコンポーネントは1文字ずつText要素を生成するため、長文では要素数が多くなる。100首一覧画面では`FlashList`の使用を推奨。

### 14.4 Studyモードの6ステップアニメーション

逐字表示（120ms間隔）はReact Native Reanimatedの`withSequence` + `withTiming`で実装する。UIスレッドで動作させることで、音声再生との同期ズレを防止。

### 14.5 Battleモードのタイマー

`setInterval`はReact Nativeでバックグラウンド時に停止する場合がある。Battleモード中は`expo-keep-awake`でスリープを防止すること。

### 14.6 フォントの選定

和風の雰囲気を維持するためにNoto Serif JP（Google Fonts）を`expo-font`で読み込む。縦書き表示での字形が正しく表示されるか事前に検証すること。

### 14.7 音声キャッシュの容量管理

R2上の音声ファイル数は100首 × 4種 = 400ファイル。初回起動時に全ファイルをDLするのではなく、アクセスした首の音声のみキャッシュする遅延DL戦略を採用。

---

## 15. Google Play Store対応

- Expo EAS Buildでaab（Android App Bundle）を生成
- `app.json`で`package`を設定（例: `jp.co.hyakunin_goromaru`）
- 最低APIレベル: Android 8.0 (API 26)
- ターゲットAPIレベル: Android 14 (API 34) 以上
- アイコン・スプラッシュスクリーンはExpo Assetsで管理

---

## 16. パフォーマンス考慮

### ボトルネックになりうる箇所と対策

| 箇所 | 問題 | 対策 |
|------|------|------|
| 詩一覧の初期レンダリング | 100首分のPoemCardで顕著なJank | `FlashList` + `estimatedItemSize`設定 |
| 音声再生の遅延 | expo-avの初回ロード時ネットワーク遅延 | Studyモード入室時に次の首の音声をプリロード |
| Battleタイマー精度 | JSイベントループの影響（最短0.5秒） | ReanimatedワークレットでUIスレッドに移行 |
| 縦書きテキスト再レンダリング | 1文字ずつのText要素が多い | `React.memo`で不要な再レンダリング防止 |

### スケーラビリティ

- Cloudflare D1はリクエスト数に応じた従量課金、アーキテクチャ変更不要
- Cloudflare Workers無料枠: 100,000リクエスト/日（個人開発規模なら追加課金なし）
- Expo採用によりiOSビルドはEAS Build設定の追加とApp Store申請のみで対応可能

---

## 17. 実装ロードマップ（推奨順序）

1. **Expoプロジェクト初期化** - `npx create-expo-app`
2. **バックエンドAPI側のBearer Token対応** - 既存Cloudflareプロジェクトへの最小変更
3. **APIクライアント層の実装** - `src/api/` + TanStack Query設定
4. **VerticalTextコンポーネントの実装** - 縦書き表示の検証
5. **AudioServiceの実装** - expo-avで音声再生の動作確認
6. **各画面の実装** - Learn → Battle → Tricky → Review → Jissen の順
7. **オフライン対応** - キャッシュ戦略の実装
8. **プッシュ通知** - 復習リマインダーの実装
9. **Google Play Store申請** - EAS Buildでaab生成、ストア申請
