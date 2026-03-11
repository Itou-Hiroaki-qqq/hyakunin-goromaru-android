# 百人一首 -ゴロでマル覚え- Android版

百人一首を語呂合わせ（ゴロ）で楽しく覚えるための学習アプリです。
既存のWebアプリ（Cloudflare Workers + D1）のAndroid移植版として、Expo (React Native) で構築されています。

---

## 主要機能

| 機能 | 説明 |
|------|------|
| 学習（Learn） | 25ブロック × 4首の段階的学習。6ステップのStudyモードと4択のTestモードを提供 |
| 間違えやすい問題（Tricky） | 上の句・下の句カテゴリ別の2〜3択テスト |
| コンピューター対戦（Battle） | 初級・中級・上級の3難易度、20〜100問でAIと対戦 |
| 実践問題（Jissen） | 100首テストクリア後に解放されるリスニング形式の問題 |
| 復習（Review） | テストで間違えた問題を間隔反復システムで管理。ローカル通知リマインダー付き |
| 認証 | ユーザー登録・ログイン・ログアウト（未ログインでも学習・テストは利用可） |

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Expo SDK 52 / React Native 0.76 |
| 言語 | TypeScript 5.x |
| ルーティング | Expo Router v4（ファイルベース） |
| 状態管理 | Zustand |
| APIクライアント | TanStack Query v5 + axios |
| 認証 | expo-secure-store + JWT Bearer認証 |
| 音声再生 | expo-av |
| アニメーション | React Native Reanimated v3 |
| ローカルDB | expo-sqlite（復習データ管理） |
| プッシュ通知 | expo-notifications（ローカル通知） |
| ビルド・配布 | Expo EAS Build |
| バックエンド | Cloudflare Workers + D1（既存Webアプリと共用） |

---

## セットアップ手順

### 前提条件

以下がインストールされていることを確認してください。

- **Node.js** v18以上（[nodejs.org](https://nodejs.org/) からインストール）
- **npm** v9以上（Node.jsに同梱）
- **Expo CLI**（グローバルインストール推奨）

```bash
npm install -g expo-cli eas-cli
```

---

### 1. リポジトリをクローンする

```bash
git clone https://github.com/your-username/hyakunin-goromaru-android.git
cd hyakunin-goromaru-android
```

---

### 2. 依存パッケージをインストールする

```bash
npm install
```

---

### 3. 環境変数ファイルを作成する

プロジェクトルートに `.env` ファイルを作成します。

```bash
cp .env.example .env
```

`.env` を開き、バックエンドAPIのURLを設定します。

```env
EXPO_PUBLIC_API_URL=https://your-api.workers.dev
```

> バックエンドはCloudflare Workers上に別途デプロイされている必要があります。
> 詳細は「[バックエンドとの連携](#バックエンドとの連携)」を参照してください。

---

### 4. 開発サーバーを起動する

```bash
npx expo start
```

起動後、ターミナルに表示されるQRコードを **Expo Go**（Android端末にインストール済み）で読み取るとアプリを確認できます。

---

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `EXPO_PUBLIC_API_URL` | 必須 | バックエンドAPI（Cloudflare Workers）のベースURL。例: `https://your-api.workers.dev` |

> `EXPO_PUBLIC_` プレフィックスを付けることで、Expo がビルド時にクライアントコードへ値を埋め込みます。
> `.env` ファイルは `.gitignore` に追加してリポジトリにコミットしないようにしてください。

---

## ビルド方法

Expo EAS Build を使用します。事前に [expo.dev](https://expo.dev/) でアカウントを作成し、EAS CLIでログインしてください。

```bash
eas login
```

### 開発ビルド（実機デバッグ用）

```bash
eas build --platform android --profile development
```

開発クライアントがインストールされたAPKが生成されます。

---

### プレビュービルド（内部テスト配布用）

```bash
eas build --platform android --profile preview
```

APK形式でビルドされます。QRコードや直接インストールでの動作確認に使用します。

---

### 本番ビルド（Google Play Store向け）

```bash
eas build --platform android --profile production
```

Google Play Store への提出用の AAB（Android App Bundle）が生成されます。

---

## テスト実行方法

```bash
npx jest
```

ウォッチモードで実行する場合:

```bash
npx jest --watch
```

テストファイルは `__tests__/` ディレクトリに配置されています。

---

## プロジェクト構成

```
hyakunin-goromaru-android/
├── app/                          # 画面定義（Expo Router）
│   ├── _layout.tsx               # ルートレイアウト（認証・QueryClient）
│   ├── index.tsx                 # ホーム画面
│   ├── (auth)/                   # 認証画面グループ
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── learn/                    # 学習機能
│   │   └── [blockId]/
│   │       ├── study.tsx         # Studyモード（6ステップ）
│   │       └── test.tsx          # Testモード（4択クイズ）
│   ├── tricky/                   # 間違えやすい問題
│   ├── battle/                   # コンピューター対戦
│   ├── jissen/                   # 実践問題
│   └── review/                   # 復習
│
├── src/
│   ├── api/                      # APIクライアント層
│   │   ├── client.ts             # axiosインスタンス + インターセプター
│   │   ├── poems.ts
│   │   ├── auth.ts
│   │   ├── testClears.ts
│   │   └── testBestScores.ts
│   ├── types/                    # TypeScript型定義
│   ├── stores/                   # Zustandストア（認証・学習・テスト・対戦）
│   ├── hooks/                    # カスタムフック
│   ├── components/               # UIコンポーネント
│   │   └── ui/
│   │       ├── VerticalText.tsx  # 縦書きテキスト
│   │       ├── PoemCard.tsx      # 札風カード
│   │       └── GoroText.tsx      # 語呂ハイライトテキスト
│   ├── services/                 # サービス層
│   │   ├── audioService.ts       # 音声再生（expo-av）
│   │   ├── audioCacheService.ts  # 音声ファイルキャッシュ
│   │   ├── reviewDatabase.ts     # 復習データ（expo-sqlite）
│   │   └── notificationService.ts # 復習リマインダー通知
│   ├── utils/                    # ユーティリティ
│   └── constants/                # 定数（APIパス、ステップ定義など）
│
├── assets/                       # アイコン、スプラッシュ、フォント
├── __tests__/                    # テストファイル
├── docs/                         # 設計ドキュメント
│   └── architecture-design.md   # アーキテクチャ設計書
├── app.json                      # Expo設定
├── eas.json                      # EAS Build設定
├── .env.example                  # 環境変数テンプレート
└── tsconfig.json
```

パスエイリアスが設定されています。

| エイリアス | 実パス |
|-----------|--------|
| `@/` | `./src/` |
| `~/` | `./`（プロジェクトルート） |

---

## バックエンドとの連携

このアプリはバックエンドとして **Cloudflare Workers + D1** を使用します。WebアプリとAndroidアプリでAPIを共用しています。

### 使用エンドポイント

| エンドポイント | メソッド | 認証 | 用途 |
|-------------|---------|------|------|
| `/api/poems` | GET | 不要 | 詩データ取得 |
| `/api/auth/register` | POST | 不要 | ユーザー登録 |
| `/api/auth/login` | POST | 不要 | ログイン（JWTをJSONで返す） |
| `/api/auth/logout` | POST | 必要 | ログアウト |
| `/api/auth/me` | GET | 任意 | ログインユーザー情報取得 |
| `/api/test-clears` | GET / POST | 任意 / 必要 | テストクリア状況の取得・保存 |
| `/api/test-best-scores` | GET / POST | 任意 / 必要 | ベストスコアの取得・保存 |

### 認証方式について

Webアプリは httpOnly クッキー + JWT で動作していますが、Androidアプリでは **Bearer Token 認証** を使用します。

- ログイン・登録成功時、バックエンドはJSONレスポンスにもトークンを含める必要があります
- アプリはトークンを `expo-secure-store` に暗号化して保存します
- 以降のAPIリクエストには `Authorization: Bearer <token>` ヘッダーが自動付与されます（axiosインターセプター）

バックエンド側の変更内容については [`docs/architecture-design.md`](./docs/architecture-design.md) の「認証方式の変更設計」セクションを参照してください。

---

## Android対応バージョン

| 項目 | バージョン |
|------|-----------|
| 最低SDKバージョン | Android 8.0（API 26） |
| ターゲットSDKバージョン | Android 14（API 34） |
| パッケージ名 | `jp.co.hyakunin_goromaru` |

---

## ライセンス

MIT License

Copyright (c) 2025 hyakunin-goromaru
