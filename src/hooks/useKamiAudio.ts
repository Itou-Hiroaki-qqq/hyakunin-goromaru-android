import { useEffect, useRef } from 'react';
import { audioService } from '@/services/audioService';
import type { Poem } from '@/types/poem';

interface UseKamiAudioOptions {
  current: Poem | null;
  currentQ: number;
  poemsLength: number;
}

/**
 * テスト画面で問題が変わるたびに上の句音声を自動再生するフック
 *
 * - currentQ が変化するたびに kami_audio_url を再生する
 * - lastPlayedQRef で二重再生を防止する
 * - 前の問題の音声が再生中の場合は停止してから再生する
 */
export function useKamiAudio({
  current,
  currentQ,
  poemsLength,
}: UseKamiAudioOptions): void {
  const lastPlayedQRef = useRef<number | null>(null);

  useEffect(() => {
    if (!current?.kami_audio_url || poemsLength === 0) return;
    if (lastPlayedQRef.current === currentQ) return;
    if (lastPlayedQRef.current != null) audioService.stopAll();
    lastPlayedQRef.current = currentQ;
    audioService.playOnce(current.kami_audio_url);
    return () => {
      audioService.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, poemsLength, current?.id, current?.kami_audio_url]);

  // 画面アンマウント時に必ず音声を停止する
  useEffect(() => {
    return () => {
      audioService.stopAll();
    };
  }, []);
}
