import React, { memo, useEffect, useState, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, TYPEWRITER_INTERVAL_MS } from '@/constants/study';

interface TypewriterTextProps {
  text: string;
  fontSize?: number;
  onComplete?: () => void;
  /** アニメーション間隔（ミリ秒）。デフォルト: 120ms */
  intervalMs?: number;
}

/**
 * 逐字表示アニメーションコンポーネント
 * テキストを1文字ずつ表示する（120ms間隔）
 */
const TypewriterText = memo(
  ({ text, fontSize = 20, onComplete, intervalMs = TYPEWRITER_INTERVAL_MS }: TypewriterTextProps) => {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
      // テキストが変わったらリセット
      setDisplayedText('');
      indexRef.current = 0;

      if (!text) {
        onComplete?.();
        return;
      }

      timerRef.current = setInterval(() => {
        const nextIndex = indexRef.current + 1;
        setDisplayedText(text.slice(0, nextIndex));
        indexRef.current = nextIndex;

        if (nextIndex >= text.length) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          onComplete?.();
        }
      }, intervalMs);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [text, intervalMs, onComplete]);

    return (
      <Text style={[styles.text, { fontSize }]}>
        {displayedText}
      </Text>
    );
  },
);

TypewriterText.displayName = 'TypewriterText';

const styles = StyleSheet.create({
  text: {
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
});

export default TypewriterText;
