import { useEffect, useCallback } from 'react';
import { useStudyStore } from '@/stores/studyStore';
import { useAudio } from './useAudio';
import type { Poem } from '@/types/poem';

/**
 * 6ステップ学習制御フック
 * ステップに応じて音声再生を自動トリガーする
 */
export function useStudyStep(currentPoem: Poem | undefined) {
  const {
    currentStep,
    nextStep,
    prevStep,
    nextPoem,
    reset,
  } = useStudyStore();
  const { playOnce, playSequence, isPlaying } = useAudio();

  // ステップが変わったら対応する音声を再生
  useEffect(() => {
    if (!currentPoem) return;

    const playStepAudio = async () => {
      switch (currentStep) {
        case 1:
          // ステップ1: 上の句音声を再生
          if (currentPoem.kami_audio_url) {
            await playOnce(currentPoem.kami_audio_url);
          }
          break;
        case 3:
          // ステップ3: 下の句音声を再生
          if (currentPoem.shimo_audio_url) {
            await playOnce(currentPoem.shimo_audio_url);
          }
          break;
        case 4:
          // ステップ4: 上語呂音声を再生
          if (currentPoem.kami_goro_audio_url) {
            await playOnce(currentPoem.kami_goro_audio_url);
          }
          break;
        case 5:
          // ステップ5: 下語呂音声を再生
          if (currentPoem.shimo_goro_audio_url) {
            await playOnce(currentPoem.shimo_goro_audio_url);
          }
          break;
        case 6:
          // ステップ6: 語呂まとめ（上下続けて再生）
          await playSequence(
            [currentPoem.kami_goro_audio_url, currentPoem.shimo_goro_audio_url].filter(Boolean),
            300,
          );
          break;
        default:
          break;
      }
    };

    playStepAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentPoem?.id]);

  const handleNextStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrevStep = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleNextPoem = useCallback((): boolean => {
    return nextPoem();
  }, [nextPoem]);

  return {
    currentStep,
    isPlaying,
    handleNextStep,
    handlePrevStep,
    handleNextPoem,
    reset,
  };
}
