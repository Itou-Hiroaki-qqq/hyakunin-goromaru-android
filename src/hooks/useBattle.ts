import { useEffect, useRef, useCallback } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { generateQuizQuestions } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';
import type { BattleDifficultyKey } from '@/constants/study';

/**
 * Battleモードのタイマー制御フック
 */
export function useBattle() {
  const store = useBattleStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TICK_INTERVAL_MS = 100; // 100ms間隔でtick

  /**
   * タイマーを開始する
   */
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      useBattleStore.getState().tick(TICK_INTERVAL_MS / 1000);
    }, TICK_INTERVAL_MS);
  }, []);

  /**
   * タイマーを停止する
   */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 回答済みまたは終了時はタイマーを止める
  useEffect(() => {
    if (store.answered || store.isFinished) {
      stopTimer();
    }
  }, [store.answered, store.isFinished, stopTimer]);

  // アンマウント時にタイマーを停止
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  /**
   * バトルを設定して開始する
   */
  const setup = useCallback(
    (targetPoems: Poem[], allPoems: Poem[], difficulty: BattleDifficultyKey, questionCount: number) => {
      const questions = generateQuizQuestions(targetPoems, allPoems);
      store.setConfig(difficulty, questionCount);
      store.setQuestions(questions);
      store.start();
      startTimer();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startTimer],
  );

  /**
   * 次の問題へ進む
   */
  const goNext = useCallback(() => {
    const hasNext = store.nextQuestion();
    if (hasNext) {
      startTimer();
    } else {
      store.finish();
    }
    return hasNext;
  }, [store, startTimer]);

  /**
   * プレイヤーが回答する
   */
  const playerAnswer = useCallback(
    (selectedIndex: number) => {
      stopTimer();
      return store.answer(selectedIndex);
    },
    [store, stopTimer],
  );

  return {
    ...store,
    setup,
    goNext,
    playerAnswer,
  };
}
