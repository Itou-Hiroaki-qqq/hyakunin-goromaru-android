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

  // リセット世代カウンタ: resetGoroHighlight() のたびに +1 され、
  // 進行中の run() が古い世代なら setGoroHighlightPhase を書き戻さないようにする
  const generationRef = useRef(0);

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
    // この run() が開始された時点の世代を捕捉する。
    // 以降 resetGoroHighlight() が呼ばれると generationRef.current が進むため、
    // await 越しに phase を書き戻そうとしても isStale() で弾ける。
    const myGeneration = generationRef.current;
    const isStale = () =>
      !isMountedRef.current ||
      generationRef.current !== myGeneration ||
      (currentGoroPoemIdRef ? currentGoroPoemIdRef.current !== poemId : false);

    if (!isMountedRef.current) return;
    setGoroHighlightPhase('kami');

    const run = async () => {
      try {
        // 上の句音声が再生中・ロード中の場合に停止
        audioService.stopAll();
        if (isStale()) return;

        const kamiUrl = current.kami_goro_audio_url;
        const shimoUrl = current.shimo_goro_audio_url;

        if (kamiUrl && shimoUrl) {
          // 両方を並行でプリダウンロード
          const [kamiUri, shimoUri] = await Promise.all([
            audioService.preload(kamiUrl),
            audioService.preload(shimoUrl),
          ]);
          if (isStale()) return;

          // 上の句語呂を再生
          await audioService.playPreloaded(kamiUri);
          if (isStale()) return;

          // 下の句語呂を再生
          setGoroHighlightPhase('shimo');
          await audioService.playPreloaded(shimoUri);
          if (isStale()) return;
        } else if (kamiUrl) {
          await audioService.playOnce(kamiUrl);
          if (isStale()) return;
          setGoroHighlightPhase('shimo');
        } else if (shimoUrl) {
          if (isStale()) return;
          setGoroHighlightPhase('shimo');
          await audioService.playOnce(shimoUrl);
        }
      } finally {
        // in-progress フラグは必ず降ろす。
        // 古い世代の run() が stale で早期 return する場合でも、このフラグを残すと
        // 次の問題で新しい run() が guard に阻まれて起動できなくなる。
        // JS はシングルスレッドなので、この時点で新しい run() が先に起動していることはない。
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

  const resetGoroHighlight = () => {
    // 進行中の run() を無効化するため世代を進める
    generationRef.current += 1;
    // 待機中の playPreloaded を強制的に resolve させ、古い run() を早期に終わらせる
    audioService.stopAll();
    // in-progress フラグも即座に降ろしておく（finally を待たずに次の run() が起動できるように）
    if (goroRunInProgressRef) goroRunInProgressRef.current = false;
    // 重複起動防止カウンタもリセット（呼び出し側が goroPlayKey を 0 に戻す場合に備え、
    // 古い値との偶然の一致を防ぐ）
    if (lastGoroPlayKeyRef) lastGoroPlayKeyRef.current = 0;
    setGoroHighlightPhase('none');
  };

  return { goroHighlightPhase, resetGoroHighlight };
}
