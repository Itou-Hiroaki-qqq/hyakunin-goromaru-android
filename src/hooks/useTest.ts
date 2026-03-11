import { useCallback } from 'react';
import { useTestStore } from '@/stores/testStore';
import { reviewDatabase } from '@/services/reviewDatabase';
import { postTestBestScore } from '@/api/testBestScores';
import { postTestClear } from '@/api/testClears';
import { useAuthStore } from '@/stores/authStore';
import { generateQuizQuestions } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';

interface UseTestOptions {
  testType: string;
  rangeKey: string;
}

/**
 * テストロジックフック
 * 4択生成・採点・結果保存を管理する
 */
export function useTest(options: UseTestOptions) {
  const {
    questions,
    currentIndex,
    score,
    consecutiveCorrect,
    bestConsecutive,
    answered,
    selectedIndex,
    answer,
    nextQuestion,
    setQuestions,
    reset,
  } = useTestStore();
  const { user } = useAuthStore();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  /**
   * テストを初期化する
   */
  const initTest = useCallback(
    (targetPoems: Poem[], allPoems: Poem[]) => {
      reset();
      const quizQuestions = generateQuizQuestions(targetPoems, allPoems);
      setQuestions(quizQuestions);
    },
    [reset, setQuestions],
  );

  /**
   * 回答処理: 不正解の場合は復習リストに追加
   */
  const handleAnswer = useCallback(
    async (selectedIdx: number): Promise<boolean> => {
      const isCorrect = answer(selectedIdx);

      if (!isCorrect && currentQuestion) {
        // 不正解時: 復習リストに追加
        await reviewDatabase.add(currentQuestion.poem.id).catch(() => {});
      }

      return isCorrect;
    },
    [answer, currentQuestion],
  );

  /**
   * テスト完了時の結果を保存する
   */
  const saveResults = useCallback(async () => {
    const totalQuestions = questions.length;
    const isAllCorrect = score === totalQuestions;

    // ベストスコアを保存（ログイン中のみ）
    if (user) {
      const testKey = `${options.testType}:${options.rangeKey}`;
      await postTestBestScore({ test_key: testKey, best_score: bestConsecutive }).catch(() => {});

      // 全問正解の場合はクリア記録を保存
      if (isAllCorrect) {
        await postTestClear({
          test_type: options.testType,
          range_key: options.rangeKey,
        }).catch(() => {});
      }
    }
  }, [questions.length, score, bestConsecutive, user, options.testType, options.rangeKey]);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    score,
    consecutiveCorrect,
    bestConsecutive,
    answered,
    selectedIndex,
    isLastQuestion,
    initTest,
    handleAnswer,
    nextQuestion,
    saveResults,
    reset,
  };
}
