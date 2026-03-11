import { useCallback, useEffect, useRef, useState } from 'react';
import { audioService } from '@/services/audioService';

/**
 * 音声再生制御フック
 */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      audioService.stopAll();
    };
  }, []);

  /**
   * 1つのURLを再生する
   */
  const playOnce = useCallback(async (url: string) => {
    if (!url) return;
    setIsPlaying(true);
    try {
      await audioService.playOnce(url);
    } finally {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    }
  }, []);

  /**
   * 複数URLを順番に再生する
   */
  const playSequence = useCallback(async (urls: string[], intervalMs = 500) => {
    const validUrls = urls.filter(Boolean);
    if (validUrls.length === 0) return;
    setIsPlaying(true);
    try {
      await audioService.playSequence(validUrls, intervalMs);
    } finally {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    }
  }, []);

  /**
   * 再生を停止する
   */
  const stop = useCallback(async () => {
    await audioService.stopAll();
    if (isMountedRef.current) {
      setIsPlaying(false);
    }
  }, []);

  return { isPlaying, playOnce, playSequence, stop };
}
