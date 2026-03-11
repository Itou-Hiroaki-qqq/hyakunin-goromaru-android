/**
 * 25ブロックの構造:
 * - ブロック1-25: 各4首 (1-4, 5-8, ... 97-100)
 * - 各ブロックにStudy/Testモードあり
 * - 進行: 4首 → 8首 → 20首 → 100首テスト
 */

export interface Block {
  id: number;       // 1-25
  from: number;     // 開始歌番号
  to: number;       // 終了歌番号
  label: string;    // 表示ラベル
  rangeKey: string; // "1-4" 形式
}

/**
 * 25ブロックの定義を生成する
 */
export function generateBlocks(): Block[] {
  return Array.from({ length: 25 }, (_, i) => {
    const id = i + 1;
    const from = (i * 4) + 1;
    const to = from + 3;
    return {
      id,
      from,
      to,
      label: `${from}〜${to}首`,
      rangeKey: `${from}-${to}`,
    };
  });
}

export const BLOCKS = generateBlocks();

/**
 * 範囲キーからブロックを取得する
 */
export function getBlockByRangeKey(rangeKey: string): Block | undefined {
  return BLOCKS.find((b) => b.rangeKey === rangeKey);
}

/**
 * 8首グループ（2ブロック）の定義
 * インデックス0: 1-8, 1: 9-16, ... 12: 93-100
 */
export interface EightGroup {
  id: number;
  from: number;
  to: number;
  label: string;
  rangeKey: string;
}

export function generateEightGroups(): EightGroup[] {
  return Array.from({ length: 13 }, (_, i) => {
    const id = i + 1;
    const from = (i * 8) + 1;
    const to = Math.min(from + 7, 100);
    return {
      id,
      from,
      to: to > 100 ? 100 : to,
      label: `${from}〜${to}首`,
      rangeKey: `${from}-${to}`,
    };
  });
}

/**
 * 20首グループ（5ブロック）の定義
 */
export interface TwentyGroup {
  id: number;
  from: number;
  to: number;
  label: string;
  rangeKey: string;
}

export function generateTwentyGroups(): TwentyGroup[] {
  return Array.from({ length: 5 }, (_, i) => {
    const id = i + 1;
    const from = (i * 20) + 1;
    const to = from + 19;
    return {
      id,
      from,
      to,
      label: `${from}〜${to}首`,
      rangeKey: `${from}-${to}`,
    };
  });
}
