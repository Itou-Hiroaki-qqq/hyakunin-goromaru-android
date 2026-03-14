import { useEffect, useCallback, useRef } from 'react';
import { useStudyStore } from '@/stores/studyStore';
import { audioService } from '@/services/audioService';
import type { Poem } from '@/types/poem';

/** 逐字表示の間隔（ミリ秒/文字） */
const CHAR_DELAY_MS = 120;

/**
 * 学習制御フック（2ステップ表示 / 内部6ステップ自動遷移）
 *
 * Step 0: 「始める」ボタン表示（上の句漢字・下の句漢字を表示）
 * Step 1: 上の句音声(kami_audio_url)再生 + kami_hiragana を逐字表示 → Step 2 へ自動遷移
 * Step 2: 下の句音声(shimo_audio_url)再生 + shimo_hiragana を逐字表示 → Step 3 へ自動遷移
 * Step 3: 上の句語呂音声(kami_goro_audio_url)再生（上の句語呂ハイライト） → Step 4 へ自動遷移
 * Step 4: 下の句語呂音声(shimo_goro_audio_url)再生（下の句語呂ハイライト） → Step 5 へ自動遷移
 * Step 5: kami_goro_audio_url + shimo_goro_audio_url を連続再生（goro_kaisetsu 表示） → Step 6 へ自動遷移
 * Step 6: 「練習へ」ボタン表示
 *
 * phase='practice': 上の句ひらがな + 下の句4択（練習フェーズ）
 */
export function useStudyStep(
  currentPoem: Poem | undefined,
  onKamiVisibleLenChange?: (len: number) => void,
  onShimoVisibleLenChange?: (len: number) => void,
): {
  learnStep: number;
  phase: 'learn' | 'practice';
  currentPoemIndex: number;
  handleStart: () => void;
  handleGoToPractice: () => void;
  handleBackToLearn: () => void;
  handleNextPoem: () => boolean;
  reset: () => void;
} {
  const {
    learnStep,
    phase,
    currentPoemIndex,
    setLearnStep,
    setPhase,
    nextPoem,
    reset,
  } = useStudyStore();

  const playingRef = useRef(false);
  const poemIdRef = useRef<number | null>(null);

  // 画面アンマウント時に必ず音声を停止する
  useEffect(() => {
    return () => {
      playingRef.current = false;
      audioService.stopAll();
    };
  }, []);

  // 詩が変わったら playingRef の文脈を更新
  useEffect(() => {
    poemIdRef.current = currentPoem?.id ?? null;
    return () => {
      audioService.stopAll();
    };
  }, [currentPoem?.id]);

  /**
   * ステップが変わったら対応する音声を再生して次のステップへ自動遷移する
   */
  useEffect(() => {
    if (!currentPoem || learnStep === 0 || learnStep === 6) return;

    const poemId = currentPoem.id;

    const runStep = async () => {
      if (playingRef.current) return;
      playingRef.current = true;

      try {
        switch (learnStep) {
          case 1: {
            // 上の句音声再生 + 逐字表示
            const kamiLen = currentPoem.kami_hiragana.length;
            let kamiCount = 0;
            onKamiVisibleLenChange?.(0);
            const interval = setInterval(() => {
              kamiCount = Math.min(kamiCount + 1, kamiLen);
              onKamiVisibleLenChange?.(kamiCount);
            }, CHAR_DELAY_MS);
            if (currentPoem.kami_audio_url) {
              await audioService.playOnce(currentPoem.kami_audio_url);
            }
            clearInterval(interval);
            onKamiVisibleLenChange?.(kamiLen);
            if (poemIdRef.current !== poemId) return;
            setLearnStep(2);
            break;
          }
          case 2: {
            // 下の句音声再生 + 逐字表示
            const shimoLen = currentPoem.shimo_hiragana.length;
            let shimoCount = 0;
            onShimoVisibleLenChange?.(0);
            const interval = setInterval(() => {
              shimoCount = Math.min(shimoCount + 1, shimoLen);
              onShimoVisibleLenChange?.(shimoCount);
            }, CHAR_DELAY_MS);
            if (currentPoem.shimo_audio_url) {
              await audioService.playOnce(currentPoem.shimo_audio_url);
            }
            clearInterval(interval);
            onShimoVisibleLenChange?.(shimoLen);
            if (poemIdRef.current !== poemId) return;
            setLearnStep(3);
            break;
          }
          case 3: {
            // 上の句語呂ハイライト中に語呂音声（kami_goro_audio_url）を再生
            if (currentPoem.kami_goro_audio_url) {
              await audioService.playOnce(currentPoem.kami_goro_audio_url);
            }
            if (poemIdRef.current !== poemId) return;
            setLearnStep(4);
            break;
          }
          case 4: {
            // 下の句語呂ハイライト中に語呂音声（shimo_goro_audio_url）を再生
            if (currentPoem.shimo_goro_audio_url) {
              await audioService.playOnce(currentPoem.shimo_goro_audio_url);
            }
            if (poemIdRef.current !== poemId) return;
            setLearnStep(5);
            break;
          }
          case 5: {
            // 上の句 + 下の句 語呂をプリロード連続再生（ギャップ最小）
            const kamiUrl = currentPoem.kami_goro_audio_url;
            const shimoUrl = currentPoem.shimo_goro_audio_url;
            if (kamiUrl && shimoUrl) {
              await audioService.playPair(kamiUrl, shimoUrl);
            } else if (kamiUrl) {
              await audioService.playOnce(kamiUrl);
            } else if (shimoUrl) {
              await audioService.playOnce(shimoUrl);
            }
            if (poemIdRef.current !== poemId) return;
            setLearnStep(6);
            break;
          }
          default:
            break;
        }
      } finally {
        playingRef.current = false;
      }
    };

    runStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnStep, currentPoem?.id]);

  /** Step 0 → Step 1 へ（「始める」ボタン押下時） */
  const handleStart = useCallback(() => {
    setLearnStep(1);
  }, [setLearnStep]);

  /** Step 6 → practice フェーズへ（「練習へ」ボタン押下時） */
  const handleGoToPractice = useCallback(() => {
    setPhase('practice');
  }, [setPhase]);

  /** practice → learn フェーズへ戻る（「学習に戻る」ボタン押下時） */
  const handleBackToLearn = useCallback(() => {
    setPhase('learn');
    setLearnStep(0);
  }, [setPhase, setLearnStep]);

  /** 次の首へ進む */
  const handleNextPoem = useCallback((): boolean => {
    playingRef.current = false;
    audioService.stopAll();
    return nextPoem();
  }, [nextPoem]);

  return {
    learnStep,
    phase,
    currentPoemIndex,
    handleStart,
    handleGoToPractice,
    handleBackToLearn,
    handleNextPoem,
    reset,
  };
}
