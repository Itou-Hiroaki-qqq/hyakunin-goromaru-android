/**
 * スコア計算ユーティリティ
 */

/**
 * 正解率を計算する（0-100の整数）
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * テストクリア判定（全問正解でクリア）
 */
export function isTestCleared(correct: number, total: number): boolean {
  return total > 0 && correct === total;
}

/**
 * Battleの勝敗判定
 */
export type BattleResult = 'win' | 'lose' | 'draw';

export function getBattleResult(playerScore: number, aiScore: number): BattleResult {
  if (playerScore > aiScore) return 'win';
  if (playerScore < aiScore) return 'lose';
  return 'draw';
}

/**
 * スコアのテキスト表示
 */
export function formatScore(correct: number, total: number): string {
  return `${correct} / ${total}`;
}
