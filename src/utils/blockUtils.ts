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

/**
 * 8首テストを表示すべきブロックID
 * 偶数ブロック(2,4,...24) + ブロック25
 */
export const EIGHT_TEST_BLOCK_IDS = new Set([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25]);

/**
 * 20首テストを表示すべきブロックIDとその範囲
 */
export const TWENTY_TEST_BLOCKS: Record<number, { from: number; to: number; label: string }> = {
  5:  { from: 1,  to: 20,  label: '1〜20首テスト' },
  10: { from: 21, to: 40,  label: '21〜40首テスト' },
  15: { from: 41, to: 60,  label: '41〜60首テスト' },
  20: { from: 61, to: 80,  label: '61〜80首テスト' },
  25: { from: 81, to: 100, label: '81〜100首テスト' },
};

/**
 * テスト完了時の「次のアクション」を決定する
 *
 * @param rangeKey テスト範囲 ("1-4", "1-8", "1-20" など)
 * @returns 次のアクション情報の配列（表示順）
 */
export interface NextTestAction {
  label: string;
  /** 遷移先のルートパス */
  route: string;
}

export function getNextTestActions(rangeKey: string): NextTestAction[] {
  const actions: NextTestAction[] = [];
  const parts = rangeKey.split('-');
  if (parts.length !== 2) return actions;
  const from = parseInt(parts[0], 10);
  const to = parseInt(parts[1], 10);
  const poemCount = to - from + 1;

  // 4首テスト完了時
  if (poemCount === 4) {
    const block = BLOCKS.find((b) => b.from === from && b.to === to);
    if (!block) return actions;

    // 8首テストがあるか
    if (EIGHT_TEST_BLOCK_IDS.has(block.id)) {
      const eightFrom = block.from - 4;
      const eightRangeKey = `${eightFrom}-${block.to}`;
      actions.push({
        label: '前回も入れて8首テストへ',
        route: `/learn/${eightRangeKey}/test`,
      });
    }
    // 20首テストがあるか（8首テストがない場合のみ直接表示）
    else if (TWENTY_TEST_BLOCKS[block.id]) {
      const twenty = TWENTY_TEST_BLOCKS[block.id];
      actions.push({
        label: `${twenty.label}へ`,
        route: `/learn/${twenty.from}-${twenty.to}/test`,
      });
    }
    // 次のブロックへ（最終ブロックでなければ）
    else if (block.id < 25) {
      const nextBlock = BLOCKS[block.id]; // id is 1-based, array is 0-based
      actions.push({
        label: '次のブロックへ',
        route: `/learn/${nextBlock.rangeKey}/study`,
      });
    }
  }
  // 8首テスト完了時
  else if (poemCount === 8) {
    // toが属するブロックを見つける
    const block = BLOCKS.find((b) => b.to === to);
    if (!block) return actions;

    // 20首テストがあるか
    if (TWENTY_TEST_BLOCKS[block.id]) {
      const twenty = TWENTY_TEST_BLOCKS[block.id];
      actions.push({
        label: `${twenty.label}へ`,
        route: `/learn/${twenty.from}-${twenty.to}/test`,
      });
    }
    // 次のブロックへ
    else if (block.id < 25) {
      const nextBlock = BLOCKS[block.id];
      actions.push({
        label: '次のブロックへ',
        route: `/learn/${nextBlock.rangeKey}/study`,
      });
    }
  }
  // 20首テスト完了時
  else if (poemCount === 20) {
    // toの次のブロックへ
    const block = BLOCKS.find((b) => b.from === to + 1);
    if (block) {
      actions.push({
        label: '次のブロックへ',
        route: `/learn/${block.rangeKey}/study`,
      });
    }
  }

  return actions;
}
