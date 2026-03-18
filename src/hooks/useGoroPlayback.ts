import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { audioService } from '@/services/audioService';
import type { Poem } from '@/types/poem';

export type GoroHighlightPhase = 'none' | 'kami' | 'shimo';

interface UseGoroPlaybackOptions {
  current: Poem | null;
  showGoro: boolean;
  /** 正解または不正解後に語呂再生をトリガーする変化キー */
  goroPlayKey: number;
  /** true: 正解（ハイライト付き上→下再生）、false: 不正解（ハイライトなし一括再生） */
  selectedCorrect: boolean;
  /** 複数問を同一コンポーネントで扱う場合の排他ロック */
  goroRunInProgressRef?: MutableRefObject<boolean>;
  /** 現在語呂を再生中の poemId（問題切替時に割込みを防ぐ） */
  currentGoroPoemIdRef?: MutableRefObject<number | null>;
  /** 同じ goroPlayKey での重複再生防止 */
  lastGoroPlayKeyRef?: MutableRefObject<number>;
}

/**
 * 語呂ハイライトアニメーション付き音声再生フック
 *
 * 正解時: stopAll → phase='kami' → kami_goro 再生 → phase='shimo' → shimo_goro 再生
 * 不正解時: stopAll → kami_goro + shimo_goro を一括再生（ハイライトなし）
 */
export function useGoroPlayback({
  current,
  showGoro,
  goroPlayKey,
  selectedCorrect,
  goroRunInProgressRef,
  currentGoroPoemIdRef,
  lastGoroPlayKeyRef,
}: UseGoroPlaybackOptions): {
  goroHighlightPhase: GoroHighlightPhase;
  resetGoroHighlight: () => void;
} {
  const [goroHighlightPhase, setGoroHighlightPhase] =
    useState<GoroHighlightPhase>('none');

  // アンマウント後の状態更新・音声再生を防ぐフラグ
  const isMountedRef = useRef(true);

  // 画面アンマウント時に必ず音声を停止する
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      audioService.stopAll();
    };
  }, []);

  // 正解後の語呂シーケンス再生（上の句→下の句、ハイライトあり）
  useEffect(() => {
    if (!showGoro || !current || goroPlayKey <= 0) return;
    if (!selectedCorrect) return;
    if (goroRunInProgressRef?.current) return;
    if (lastGoroPlayKeyRef && lastGoroPlayKeyRef.current === goroPlayKey) return;
    if (lastGoroPlayKeyRef) lastGoroPlayKeyRef.current = goroPlayKey;
    if (goroRunInProgressRef) goroRunInProgressRef.current = true;

    const poemId = current.id;

    if (!isMountedRef.current) return;
    setGoroHighlightPhase('kami');

    const run = async () => {
      try {
        // 上の句音声が再生中・ロード中の場合に停止
        audioService.stopAll();
        if (!isMountedRef.current) return;
        if (currentGoroPoemIdRef && currentGoroPoemIdRef.current !== poemId) return;

        const kamiUrl = current.kami_goro_audio_url;
        const shimoUrl = current.shimo_goro_audio_url;

        if (kamiUrl && shimoUrl) {
          // 両方を並行でプリダウンロード
          const [kamiUri, shimoUri] = await Promise.all([
            audioService.preload(kamiUrl),
            audioService.preload(shimoUrl),
          ]);
          if (!isMountedRef.current) return;
          if (currentGoroPoemIdRef && currentGoroPoemIdRef.current !== poemId) return;

          // 上の句語呂を再生
          await audioService.playPreloaded(kamiUri);
          if (!isMountedRef.current) return;
          if (currentGoroPoemIdRef && currentGoroPoemIdRef.current !== poemId) return;

          // 下の句語呂を再生
          setGoroHighlightPhase('shimo');
          await audioService.playPreloaded(shimoUri);
        } else if (kamiUrl) {
          await audioService.playOnce(kamiUrl);
          if (!isMountedRef.current) return;
          setGoroHighlightPhase('shimo');
        } else if (shimoUrl) {
          setGoroHighlightPhase('shimo');
          await audioService.playOnce(shimoUrl);
        }
      } finally {
        if (goroRunInProgressRef) goroRunInProgressRef.current = false;
      }
    };
    run();

    return () => {
      audioService.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goroPlayKey, showGoro, current?.id, selectedCorrect]);

  // 不正解時の語呂一括再生（ハイライトなし、プリロード連続再生）
  useEffect(() => {
    if (!showGoro || !current || goroPlayKey <= 0) return;
    if (selectedCorrect) return;
    const kamiUrl = current.kami_goro_audio_url;
    const shimoUrl = current.shimo_goro_audio_url;
    if (kamiUrl || shimoUrl) {
      if (!isMountedRef.current) return;
      audioService.stopAll();
      if (kamiUrl && shimoUrl) {
        audioService.playPair(kamiUrl, shimoUrl);
      } else {
        audioService.playOnce(kamiUrl || shimoUrl!);
      }
    }

    return () => {
      audioService.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goroPlayKey, showGoro, current, selectedCorrect]);

  const resetGoroHighlight = () => setGoroHighlightPhase('none');

  return { goroHighlightPhase, resetGoroHighlight };
}
