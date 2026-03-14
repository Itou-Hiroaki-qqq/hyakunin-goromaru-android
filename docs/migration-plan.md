# 旧アプリ → 新アプリ UI/UX修正設計計画

## 目次
1. [問題の整理と優先度](#1-問題の整理と優先度)
2. [ホーム画面](#2-ホーム画面)
3. [学習画面（6ステップ）](#3-学習画面6ステップ)
4. [テスト画面](#4-テスト画面)
5. [間違えやすい問題](#5-間違えやすい問題)
6. [コンピューター対戦](#6-コンピューター対戦)
7. [実践問題](#7-実践問題)
8. [復習](#8-復習)
9. [共通コンポーネント](#9-共通コンポーネント)
10. [実装順序と依存関係](#10-実装順序と依存関係)

---

## 1. 問題の整理と優先度

### 重大（ゲーム性・学習効果に直結）

| # | 問題 | 影響画面 |
|---|------|---------|
| A | テストで上の句音声が自動再生されない | test.tsx, all-test.tsx, tricky test.tsx |
| B | 正解後に語呂の赤線ハイライトアニメーション（上の句→下の句の順）がない | 上記テスト画面全て |
| C | 学習の6ステップが旧アプリと異なる流れになっている | study.tsx |
| D | 学習の練習フェーズ（上の句を見て下の句4択）が存在しない | study.tsx |
| E | 間違えやすい問題のセット定義が旧アプリと完全に異なる | tricky/test.tsx |
| F | コンピューター対戦に語呂終了タイミングベースのAIタイマーがない | battle/play |

### 中程度（UX劣化）

| # | 問題 | 影響画面 |
|---|------|---------|
| G | テスト選択肢が横書きリストで、旧アプリの「札」（縦書き2x2グリッド）でない | 全テスト画面 |
| H | 復習が間隔反復DB（SQLite）方式で、旧アプリのlocalStorage即時追加方式と設計が異なる | review/ |
| I | ホーム画面で「復習」「実践問題」「コンピューター対戦」のロック/アンロック状態が動的に反映されていない | index.tsx |
| J | 実践問題が実装されておらず、all-testへのリンクになっている | jissen/ |
| K | 学習一覧に8首テスト・20首テストのリンクがない | learn/index.tsx |

---

## 2. ホーム画面

### 旧アプリの仕様

- シンプルな縦ボタンリスト
- 「復習」: `getReviewList().length > 0` のとき有効化（localStorageベース）
- 「実践問題」「コンピューター対戦」: `test_type==='100首' && range==='all'` のクリア状態で有効化（APIから取得）
- ボタンは disabled 状態のまま表示（灰色で押せない）

### 新アプリとの差分

- **問題I**: `isAllCleared`チェックが存在しない。全メニューが常にタップ可能
- 復習のロック状態はSQLiteのdueItemsで判定しようとしているが、ホーム画面では確認していない
- カードUIにemoji等を追加したデザインになっており、旧アプリよりリッチだが機能的に退化

### 修正方針

```
app/index.tsx の修正点:
1. testClears をクエリして isAllCleared を算出する
2. reviewDatabase から hasReview を算出する（起動時1回取得）
3. isAllCleared が false のときは jissen / battle の onPress を disabled にする
4. hasReview が false のときは review の onPress を disabled にする（視覚的にグレーアウト）
```

修正例（概念）:
```typescript
const { data: testClears = [] } = useQuery({ queryKey: ['testClears'], queryFn: getTestClears });
const isAllCleared = testClears.some(c => c.test_type === '100首' && c.range_key === 'all');

const [hasReview, setHasReview] = useState(false);
useEffect(() => {
  reviewDatabase.getAll().then(items => setHasReview(items.length > 0));
}, []);
```

---

## 3. 学習画面（6ステップ）

### 旧アプリの6ステップ仕様（study/page.tsx より）

```
phase=learn:
  Step 0: 上の句（漢字）+ 下の句（漢字）を表示。「始める」ボタン表示。
  Step 1: 「始める」押下 → 上の句音声再生と同時に kami_hiragana を1文字ずつ逐字表示（120ms/文字）
  Step 2: 音声終了後 → 下の句音声再生と同時に shimo_hiragana を逐字表示
  Step 3: 音声終了後 → kami_hiragana の語呂部分を赤色・下線表示しつつ kami_goro音声再生
  Step 4: 音声終了後 → shimo_hiragana の語呂部分を赤色・下線表示しつつ shimo_goro音声再生
  Step 5: 音声終了後 → 上下語呂を連続再生。goro_kaisetsu（語呂の意味）を表示。Step 6自動遷移。
  Step 6: 「練習へ」ボタン表示。

phase=practice（旧アプリのみ・新アプリ未実装）:
  - 上の句（ひらがな）を表示し、下の句4択を提示
  - 「上の句（ひらがな）の続きはどれ？」
  - 正解→「次の首へ」または「テストへ」
  - 不正解→その選択肢に×マーク、再度選択可能
  - 正解は音声再生なし（学習済みのため）
  - 「学習に戻る」ボタンで phase=learn に戻れる
```

### 新アプリとの差分（重大）

**問題C**: 新アプリのステップ定義:
```
  Step 1: 上の句（漢字）+ 音声ボタン
  Step 2: 上の句（ひらがな）逐字表示 ← 旧アプリでは音声再生と同時に自動逐字表示
  Step 3: 下の句（漢字）+ 音声ボタン
  Step 4: 語呂（上の句）+ 音声ボタン + 解説
  Step 5: 語呂（下の句）+ 音声ボタン
  Step 6: 語呂まとめ
  → 「練習フェーズ」がない
```

**問題D**: 旧アプリの最大の特徴「音声再生と逐字表示の同期」が新アプリでは未実装。

**問題A（学習部分）**: 旧アプリはstep変化時に自動で音声再生→次ステップへ自動遷移。新アプリはステップごとに手動ボタン押下が必要。

### 修正方針

```
src/hooks/useStudyStep.ts を全面書き直し:

1. phase を 'learn' | 'practice' に分ける
2. learnStep を 0～6 で管理
3. 各ステップの自動遷移ロジック:
   - Step 1: playOnce(kami_audio_url) → タイマーで逐字表示 → 完了でstep 2へ自動遷移
   - Step 2: playOnce(shimo_audio_url) → 逐字表示 → step 3へ自動遷移
   - Step 3: playOnce(kami_goro_audio_url) → step 4へ自動遷移
   - Step 4: playOnce(shimo_goro_audio_url) → step 5へ自動遷移
   - Step 5: playSequence([kami_goro, shimo_goro]) → step 6へ自動遷移
4. practice フェーズ:
   - 上の句（ひらがな）+ 下の句4択
   - 正解後「次の首へ」「テストへ」ボタン

app/learn/[range]/study.tsx の修正:
- 「前へ/次のステップ」ボタン構成を削除
- Step 0時のみ「始める」ボタンを表示
- Step 6時のみ「練習へ」ボタンを表示
- practice フェーズのUIを追加
```

**重要**: 旧アプリの `playingRef.current` による多重起動防止を実装すること。

逐字表示の実装例:
```typescript
const CHAR_DELAY_MS = 120;

const runStep1 = async () => {
  setKamiVisibleLen(0);
  const kamiLen = currentPoem.kami_hiragana.length;
  const audioPromise = audioService.playOnce(currentPoem.kami_audio_url);
  const interval = setInterval(() => {
    setKamiVisibleLen(n => Math.min(n + 1, kamiLen));
  }, CHAR_DELAY_MS);
  await audioPromise;
  clearInterval(interval);
  setKamiVisibleLen(kamiLen);
  setLearnStep(2); // 自動遷移
};
```

---

## 4. テスト画面

### 旧アプリのテスト仕様（test/page.tsx より）

```
問題表示:
  - 「上の句（ひらがな）の続きはどれ？」というラベル
  - PoemCard（縦書き琥珀色カード）で kami_hiragana を表示
  - 2x2グリッドで ChoiceCard（縦書き琥珀色カード）4択を表示
  - ページ遷移時に kami_audio_url を自動再生

回答フィードバック:
  - 不正解: 選んだ選択肢に「×」オーバーレイ。再度選択可能。
  - 正解: 正解の選択肢に「〇」オーバーレイ。他の選択肢はdisabled。
  - 正解後・不正解後どちらも showGoro=true で goro_kaisetsu を表示

語呂アニメーション（正解時のみ）:
  - 正解直後: kami_hiragana の語呂部分が赤色に変わる（goroHighlightPhase='kami'）
  - kami_goro音声再生中: 上の句語呂ハイライト継続
  - kami_goro音声終了後: shimo_hiragana の語呂部分も赤色に変わる（goroHighlightPhase='shimo'）
  - shimo_goro音声終了後: アニメーション完了

不正解時の語呂:
  - kami_goro + shimo_goro を続けて再生（ハイライトなし）
  - goro_kaisetsu を表示するだけ

「次へ」ボタン:
  - showGoro=true（正解または不正解後）になったら表示
  - 押すと復習リストへの追加処理（不正解時）→ 次の問題へ

スコア管理:
  - perfectScore（一発正解数）を管理
  - 終了後に「最高一発正解数」「今回の一発正解数」を表示
```

### 新アプリとの差分

**問題A（最重要）**: `useTest.ts` の `handleAnswer` で音声再生が一切行われていない。旧アプリは問題切り替え時に `playOnce(kami_audio_url)` を自動実行する。

**問題B**: 語呂ハイライトアニメーション（goroHighlightPhase）が存在しない。

**問題G**: `QuizOption` コンポーネントが横書きリスト形式。旧アプリは縦書き琥珀色カードのグリッド（2列x2行）。

**不正解フィードバック**: 旧アプリは何度でも選択し直せる（`clickedWrong` 配列で記録）。新アプリは `answered=true` で全選択肢disabled（1回で終了）。

### 修正方針

```
app/learn/[range]/test.tsx の修正:

1. 問題切り替え時に kami_audio_url を自動再生する
   useEffect で current?.kami_audio_url が変わったら playOnce

2. QuizOption を廃止して ChoiceCard（縦書き琥珀色カード）に変更
   - VerticalText（縦書き）で shimo_hiragana を表示
   - 琥珀色背景・ボーダー
   - 2x2グリッドレイアウト
   - 正解: 〇オーバーレイ（緑色）
   - 不正解: ×オーバーレイ（赤色）

3. 多重選択フィードバック（clickedWrong 配列方式）
   - answered（boolean）ではなく selectedCorrect + clickedWrong[] で管理
   - 不正解: その選択肢に×を表示しつつ他の選択肢は選択可能
   - 正解: 正解選択肢に〇表示・全disabled

4. 語呂ハイライトアニメーション
   新規フック useGoroPlayback.ts を実装

5. PoemCard（問題表示）
   縦書きで kami_hiragana を表示（語呂ハイライト付き）

6. スコア管理
   perfectScore（一発正解数）を追加
```

---

## 5. 間違えやすい問題

### 旧アプリの仕様

```
構成:
  - /learn/tricky: 「上の句がまぎらわしい」「下の句がまぎらわしい」の2択
  - /learn/tricky/kami: KAMI_TRICKY_SETS 25セット
  - /learn/tricky/shimo: SHIMO_TRICKY_SETS 24セット

テストの問題設計（上の句テスト）:
  - 「下の句（ひらがな）を見て、上の句（ひらがな）を当てる」
  - 選択肢: そのセット内の句（2～3択）が紛らわしい組み合わせ
  - ChoiceCard に kami_hiragana を表示（縦書き）
  - PoemCard に shimo_hiragana を表示（縦書き）
  - 正解後: 語呂ハイライトアニメーション + goro_kaisetsu 表示

問題定義データ:
  KAMI_TRICKY_SETS: 25セット、各セット2つの首ID
  SHIMO_TRICKY_SETS: 24セット、各セット2～3つの首ID
```

### 新アプリとの差分（重大）

**問題E**: 新アプリは全100首をシャッフルして30問抽出する実装。旧アプリの「紛らわしいペアを対決させる」設計が完全に失われている。

**セットデータ未移植**: `KAMI_TRICKY_SETS` / `SHIMO_TRICKY_SETS` が新アプリに存在しない。

**問題方向の違い**:
- 旧アプリ（上の句テスト）: 「下の句を見て → 上の句を当てる」（2択）
- 新アプリ: 「上の句を見て → 下の句を当てる」（4択、通常テストと同じ）

### 修正方針

```
新規作成: src/data/tricky-questions.ts
  旧アプリの KAMI_TRICKY_SETS / SHIMO_TRICKY_SETS をそのままコピー

app/tricky/index.tsx 修正:
  「上の句がまぎらわしい問題」「下の句がまぎらわしい問題」各カテゴリに
  個別セットリスト画面へのリンクを追加

新規画面: app/tricky/[category]/index.tsx（セット一覧）

app/tricky/[category]/test.tsx 全面書き直し:
  - KAMI/SHIMO_TRICKY_SETS を使用した問題生成
  - 上の句テスト: PoemCard で shimo_hiragana 表示 + 2択 ChoiceCard（kami_hiragana）
  - 下の句テスト: PoemCard で kami_hiragana 表示 + 2～3択 ChoiceCard（shimo_hiragana）
  - 語呂ハイライトアニメーション
```

---

## 6. コンピューター対戦

### 旧アプリの仕様（battle/play/page.tsx より）

```
設定: stage（shokyuu/chukyu/jokyu）x count（20/40/60/80/100）

対戦ロジック:
  - 問題ごとに kami_audio_url を自動再生
  - KAMI_GORO_END_SEC[poem.id] から「語呂部分終了時刻（秒）」を取得
  - AIのタイマー = audioDelay + goroEndMs + STAGE_DELAY_MS[stage]
    - shokyuu: 語呂終了後4秒
    - chukyu: 語呂終了後2秒
    - jokyu: 語呂終了後0.5秒
  - ユーザーが正解を選ぶ → computerTimerRef クリア → ユーザー取得
  - タイマー先に切れ → コンピューター手アニメーション → コンピューター取得
  - お手付き: 不正解選択 → コンピューターが取る

スコア表示: computerScore vs userScore

結果画面:
  - フェーズ演出（0→6のフェーズで順次フェードイン）
  - コンピュータースコア → ユーザースコア → 勝敗発表
  - 画面タップで次フェーズへスキップ可能
```

### 新アプリとの差分

**問題F**: `app/battle/` に play 画面が存在しない。設定画面のみで対戦本体が未実装。

**KAMI_GORO_END_SEC データ未移植**: `src/data/goro-timings.ts` が新アプリに存在しない。

**コンピューター手アニメーション**: `hand.png` 画像が未配置。

### 修正方針

```
新規作成: src/data/goro-timings.ts
  旧アプリの KAMI_GORO_END_SEC をそのままコピー

新規画面: app/battle/play.tsx
  - useEffect で currentQ 変化時に kami_audio_url を再生
  - useEffect で currentQ 変化時にコンピュータータイマーをセット
    audioDelay + KAMI_GORO_END_SEC[current.id]*1000 + STAGE_DELAY_MS[difficulty]
  - handleAnswer: 正解 → timer クリア → userScore+1
                  不正解 → お手付き → コンピューター取得
  - コンピュータータイマー発火 → computerScore+1 + 手アニメーション

  アニメーション:
  - Reanimated で手アニメーション実装
  - assets/hand.png を配置

  結果画面:
  - phase 0→6 のフェードイン演出（Animated.View）
  - タップでフェーズスキップ
```

---

## 7. 実践問題

### 旧アプリの仕様（jissen/page.tsx より）

```
条件: 100首テスト（test_type='100首', range='all'）クリアで解放

問題:
  - 「上の句の音声を聞いて下の句を答えてください」
  - 音声自動再生 + 再生ボタン（リトライ用）
  - 下の句4択（縦書き ChoiceCard グリッド）
  - テスト中は上の句テキスト非表示（音声のみ）
  - 正解後に初めて上の句を確認できる
  - 語呂音声再生はなし（実践モード）
  - goro_kaisetsu 表示もなし
```

### 新アプリとの差分

**問題J**: jissen/index.tsx が実践問題のゲーム本体を実装しておらず、all-testへのリンクになっている。

### 修正方針

```
新規画面: app/jissen/play.tsx
  - 100首シャッフルで問題生成
  - kami_audio_url を自動再生
  - 再生ボタン（AudioButton）表示
  - 上の句テキストは非表示（問題表示中）
  - 4択 ChoiceCard グリッド（縦書き shimo_hiragana）
  - 正解後: 上の句 PoemCard を表示（語呂ハイライト付き）
  - 語呂音声再生はなし（実践モード）
  - 100問終了後: 完了画面

app/jissen/index.tsx: アンロック確認 → play.tsx への遷移に修正
```

---

## 8. 復習

### 旧アプリの仕様（review/page.tsx より）

```
データ: localStorage（reviewStorage.ts）
  ReviewItem: { id, type, poemId, range?, choicePoemIds? }
  追加: テストで不正解時に addToReviewList を呼ぶ（即時追加）
  削除: 「復習からはずす」ボタン

UI:
  - 1問ずつ表示（currentIndex で管理）
  - type='range'|'all': 通常クイズ（kami_hiragana → 下の句4択）
  - type='kami_tricky'|'shimo_tricky': 紛らわしい問題の再出題
  - 「復習からはずす」「次へ」ボタン
  - 語呂ハイライトアニメーション + goro_kaisetsu 表示
```

### 新アプリとの差分

**問題H**: 新アプリは SQLite + 間隔反復（SRS）方式で、旧アプリの即時追加方式と異なる。旧アプリは「間違えた問題をすぐ解ける」UX。

### 修正方針（旧アプリ方式に寄せる）

```
src/services/reviewDatabase.ts の修正:
  SQLiteスキーマは維持しつつ、以下のAPIを追加:
  - add(poemId, type, range, choicePoemIds): 即時追加
  - getAll(): 全アイテムを返す
  - remove(poemId): 削除

app/review/index.tsx の修正:
  - リスト管理UIではなく、1問ずつ表示するクイズUIに変更
  - 「復習からはずす」「次へ」ボタン
  - 語呂ハイライトアニメーション

app/review/study.tsx は削除し、index.tsx に統合
```

---

## 9. 共通コンポーネント

### 9.1 VerticalText / ChoiceCard（取り札UI）

旧アプリの `ChoiceCard` (QuizCard.tsx):
- `splitToLines(text, 2)` で下の句を2行（スペース区切り）に分割
- 各行を縦書きで右から左へ並べる（`flex-row-reverse`）
- 琥珀色背景（`bg-amber-50`）・琥珀色ボーダー（`border-amber-200`）
- 正解: 「〇」を緑色で絶対配置
- 不正解: 「×」を赤色で絶対配置

新アプリの `VerticalText`:
- 1文字ずつ縦に並べる実装はあるが、`lineLength` が固定値でスペース区切りの考慮がない

**修正方針**:

```typescript
// src/utils/formatLines.ts - 旧アプリの splitToLines を移植
export function splitToLines(text: string, maxLines: number): string[] {
  const parts = text.split(/[\s\u3000]+/).filter(Boolean);
  // ... 旧アプリのロジックをそのままコピー
}
```

`VerticalText` 修正:
- `lineLength` → `lines: string[]` props方式に変更
- 行を `flexDirection: 'row-reverse'` で右から左へ
- 2行目以降に `marginTop` でインデント

`ChoiceCard` 新規実装:
```typescript
// src/components/ui/ChoiceCard.tsx
interface ChoiceCardProps {
  text: string;           // shimo_hiragana
  onClick: () => void;
  disabled: boolean;
  result: null | 'correct' | 'wrong';
  highlightRange?: { start: number; length: number };
}
```
- 2x2グリッド / 琥珀色 / 縦書き

### 9.2 PoemCard（問題表示用）

修正:
- variant='kami': splitToLines(text, 3) → 3行縦書き
- variant='shimo': splitToLines(text, 2) → 2行縦書き
- highlightRange 対応

### 9.3 goroUtils（語呂範囲計算）

新規作成: `src/utils/goroUtils.ts`
- goroToSearch(goro): ～を除去
- normalizeForMatch(s): が→か、べ→へ などの正規化
- findGoroRange(hiragana, goro): { start, length }

**注意**: 旧アプリのコードを一字一句コピーすること。正規化処理が入っており独自実装すると特定の首で動かない。

### 9.4 useGoroPlayback フック

新規作成: `src/hooks/useGoroPlayback.ts`

テスト・復習・トリッキー問題で共通使用:
```
返り値: goroHighlightPhase: 'none' | 'kami' | 'shimo'

動作:
  正解時: stopAll() → phase='kami' → playOnce(kami_goro) → phase='shimo' → playOnce(shimo_goro)
  不正解時: playSequence([kami_goro, shimo_goro])（ハイライトなし）
  多重起動防止: goroRunInProgressRef で排他制御
```

### 9.5 useKamiAudio フック

新規作成: `src/hooks/useKamiAudio.ts`

テスト問題の自動再生用。問題が変わったら自動再生:
- currentQ 変化 → stopAll() → playOnce(kami_audio_url)
- lastPlayedQRef で二重再生防止

---

## 10. 実装順序と依存関係

### Phase 1: 基盤整備（他の全てに影響）
**優先度: 最高**

1. `src/utils/formatLines.ts` 作成（splitToLines の移植）
2. `src/utils/goroUtils.ts` 作成（findGoroRange の移植）
3. `src/data/tricky-questions.ts` 作成（セットデータの移植）
4. `src/data/goro-timings.ts` 作成（語呂終了秒数データの移植）
5. `src/components/ui/VerticalText.tsx` 修正（lines[] props方式に変更）
6. `src/components/ui/ChoiceCard.tsx` 新規作成（琥珀色選択肢カード）
7. `src/components/ui/PoemCard.tsx` 修正（highlightRange対応）

### Phase 2: テスト画面の修正（最もユーザー影響大）
**優先度: 高**

1. `src/hooks/useKamiAudio.ts` 新規作成
2. `src/hooks/useGoroPlayback.ts` 新規作成
3. `src/stores/testStore.ts` 修正（clickedWrong[] 方式に変更）
4. `src/hooks/useTest.ts` 修正（useKamiAudio/useGoroPlayback統合）
5. `app/learn/[range]/test.tsx` 修正（ChoiceCard + 語呂ハイライト）
6. `app/learn/all-test.tsx` 修正（同様）

### Phase 3: 学習フロー修正
**優先度: 高**

1. `src/stores/studyStore.ts` 修正（learnStep + phase追加）
2. `src/hooks/useStudyStep.ts` 全面書き直し
3. `app/learn/[range]/study.tsx` 修正（自動遷移 + practiceフェーズ）

### Phase 4: 間違えやすい問題
**優先度: 中**

1. `app/tricky/index.tsx` 修正
2. `app/tricky/[category]/index.tsx` 新規作成（セット一覧）
3. `app/tricky/[category]/test.tsx` 全面書き直し

### Phase 5: 復習・実践問題
**優先度: 中**

1. `app/review/index.tsx` 修正（クイズ形式に変更）
2. `app/jissen/play.tsx` 新規作成
3. `app/jissen/index.tsx` 修正

### Phase 6: コンピューター対戦
**優先度: 低（解放条件があるため後回し可能）**

1. `src/stores/battleStore.ts` 修正
2. `app/battle/play.tsx` 新規作成
3. `assets/hand.png` を旧アプリから移植
4. 結果画面のフェードイン演出

### Phase 7: ホーム画面・設定
**優先度: 低**

1. `app/index.tsx` 修正（ロック/アンロック状態の動的反映）

---

## 移植時の技術的注意点

### 音声の多重起動防止
`playingRef.current` による排他制御。React のレンダリングサイクルでuseEffectが複数回発火するケースに注意。`lastPlayedQRef.current === currentQ` による重複再生防止は必須。

### 縦書きの実装品質
React Native では CSS `writing-mode: vertical-rl` が使えない。1文字ずつ縦に並べる実装で、`splitToLines` が正しくないと句の改行位置が崩れる。全角スペースと半角スペース両対応が必要。

### highlightRange の計算
`findGoroRange` のロジックは正規化（が→か など）を含む。旧アプリからそのまま移植すること。

### タイマー管理
コンピューター対戦のタイマーは `useRef` で管理。アンマウント時に `clearTimeout` すること。

### goro-timings.ts
欠損時はデフォルト値（2.0秒）にフォールバックする実装を入れること。

---

## 旧アプリ参照ファイル一覧

移植時にそのままコピーすべきファイル:
- `hyakunin-goromaru-cloudflare/src/components/QuizCard.tsx`
- `hyakunin-goromaru-cloudflare/src/lib/goro.ts`
- `hyakunin-goromaru-cloudflare/src/lib/formatLines.ts`
- `hyakunin-goromaru-cloudflare/src/lib/useGoroPlayback.ts`
- `hyakunin-goromaru-cloudflare/src/lib/useKamiAudio.ts`
- `hyakunin-goromaru-cloudflare/src/data/tricky-questions.ts`
- `hyakunin-goromaru-cloudflare/src/data/goro-timings.ts`

新アプリ修正対象ファイル:
- `src/components/ui/VerticalText.tsx`
- `src/components/ui/PoemCard.tsx`
- `src/hooks/useStudyStep.ts`
- `src/hooks/useTest.ts`
- `app/learn/[range]/study.tsx`
- `app/learn/[range]/test.tsx`
- `app/tricky/[category]/test.tsx`
- `app/battle/play.tsx`（新規）
- `app/jissen/play.tsx`（新規）
- `app/review/index.tsx`
