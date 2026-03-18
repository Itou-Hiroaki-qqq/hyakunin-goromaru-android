import { useCallback, useRef } from 'react';
import { useTestStore } from '@/stores/testStore';
import { reviewDatabase } from '@/services/reviewDatabase';
import { postTestBestScore } from '@/api/testBestScores';
import { postTestClear } from '@/api/testClears';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { useKamiAudio } from './useKamiAudio';
import { useGoroPlayback } from './useGoroPlayback';
import { generateQuizQuestions } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';
import type { GoroHighlightPhase } from './useGoroPlayback';

interface UseTestOptions {
  testType: string;
  rangeKey: string;
}

/**
 * テストロジックフック
 * 4択生成・採点・音声自動再生・語呂ハイライト・結果保存を管理する
 */
export function useTest(options: UseTestOptions) {
  const {
    questions,
    currentIndex,
    score,
    perfectScore,
    consecutiveCorrect,
    bestConsecutive,
    answered,
    selectedCorrect,
    clickedWrong,
    goroPlayKey,
    selectedIndex,
    answer,
    nextQuestion,
    setQuestions,
    reset,
  } = useTestStore();
  const { user } = useAuthStore();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const current = currentQuestion?.poem ?? null;

  // 語呂再生中の排他ロック
  const goroRunInProgressRef = useRef(false);
  const currentGoroPoemIdRef = useRef<number | null>(null);
  const lastGoroPlayKeyRef = useRef(0);

  // 問題切り替え時に上の句音声を自動再生
  useKamiAudio({
    current,
    currentQ: currentIndex,
    poemsLength: questions.length,
  });

  // currentGoroPoemId を問題に合わせて更新
  if (currentGoroPoemIdRef.current !== (current?.id ?? null)) {
    currentGoroPoemIdRef.current = current?.id ?? null;
  }

  // 語呂ハイライトアニメーション
  const { goroHighlightPhase, resetGoroHighlight } = useGoroPlayback({
    current,
    showGoro: answered || clickedWrong.length > 0,
    goroPlayKey,
    selectedCorrect,
    goroRunInProgressRef,
    currentGoroPoemIdRef,
    lastGoroPlayKeyRef,
  });

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
   * 回答処理: 不正解の場合は復習リストに追加（初回不正解時のみ）
   */
  const handleAnswer = useCallback(
    async (selectedIdx: number): Promise<boolean> => {
      const isFirstWrong = clickedWrong.length === 0;
      const isCorrect = answer(selectedIdx);

      if (!isCorrect && isFirstWrong && currentQuestion) {
        // 初回不正解時: 復習リストに追加
        await reviewDatabase.add(currentQuestion.poem.id).catch(() => {});
      }

      return isCorrect;
    },
    [answer, currentQuestion, clickedWrong],
  );

  /**
   * 次の問題へ進む（語呂ハイライトをリセット）
   */
  const handleNextQuestion = useCallback(() => {
    resetGoroHighlight();
    return nextQuestion();
  }, [nextQuestion, resetGoroHighlight]);

  /**
   * テスト完了時の結果を保存する
   */
  const saveResults = useCallback(async () => {
    const totalQuestions = questions.length;
    const isAllCorrect = score === totalQuestions;

    if (user) {
      const testKey = `${options.testType}:${options.rangeKey}`;
      await postTestBestScore({ test_key: testKey, best_score: bestConsecutive }).catch(
        () => {},
      );

      if (isAllCorrect) {
        await postTestClear({
          test_type: options.testType,
          range_key: options.rangeKey,
        }).catch(() => {});
        // 星の即時反映のためキャッシュを無効化
        queryClient.invalidateQueries({ queryKey: ['testClears'] });
      }
    }
  }, [questions.length, score, bestConsecutive, user, options.testType, options.rangeKey]);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    score,
    perfectScore,
    consecutiveCorrect,
    bestConsecutive,
    answered,
    selectedCorrect,
    clickedWrong,
    goroHighlightPhase: goroHighlightPhase as GoroHighlightPhase,
    selectedIndex,
    isLastQuestion,
    initTest,
    handleAnswer,
    nextQuestion: handleNextQuestion,
    saveResults,
    reset,
  };
}
