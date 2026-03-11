import type { Poem } from '@/types/poem';
import type { QuizQuestion } from '@/stores/testStore';

/**
 * Fisher-Yatesアルゴリズムで配列をシャッフル
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 4択クイズの選択肢を生成する
 * @param correctPoem 正解の首
 * @param allPoems 全首（ダミー選択肢の候補）
 * @returns 正解インデックスを含むQuizQuestion
 */
export function generateQuizQuestion(
  correctPoem: Poem,
  allPoems: Poem[],
): QuizQuestion {
  // 正解以外からランダムに3首を選択
  const candidates = allPoems.filter((p) => p.id !== correctPoem.id);
  const dummies = shuffle(candidates).slice(0, 3);
  const options = shuffle([correctPoem, ...dummies]);
  const correctIndex = options.findIndex((p) => p.id === correctPoem.id);

  return { poem: correctPoem, options, correctIndex };
}

/**
 * 複数の首からクイズ問題リストを生成する
 */
export function generateQuizQuestions(
  poems: Poem[],
  allPoems: Poem[],
): QuizQuestion[] {
  return poems.map((poem) => generateQuizQuestion(poem, allPoems));
}

/**
 * 指定範囲の首を取得する（rangeKey: "1-4" など）
 */
export function getPoemsByRange(allPoems: Poem[], from: number, to: number): Poem[] {
  return allPoems.filter((p) => p.id >= from && p.id <= to);
}
