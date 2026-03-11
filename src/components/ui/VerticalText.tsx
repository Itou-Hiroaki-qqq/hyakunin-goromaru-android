import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/study';

interface HighlightRange {
  start: number;
  length: number;
}

interface VerticalTextProps {
  text: string;
  highlightRange?: HighlightRange;
  highlightColor?: string;
  fontSize?: number;
  lineLength?: number;  // 1行の文字数
}

/**
 * 縦書きテキストコンポーネント
 *
 * React Nativeには writing-mode がないため、
 * 1文字ずつTextに分割し、flexDirection: column で縦配置。
 * 行をrow-reverseで右→左に配置することで縦書きを実現。
 */
const VerticalText = memo(
  ({
    text,
    highlightRange,
    highlightColor = COLORS.highlight,
    fontSize = 22,
    lineLength = 3,
  }: VerticalTextProps) => {
    const chars = text.split('');

    // テキストをlineLength文字ずつの行に分割
    const lines: string[][] = [];
    for (let i = 0; i < chars.length; i += lineLength) {
      lines.push(chars.slice(i, i + lineLength));
    }

    /**
     * 文字のグローバルインデックスからハイライト対象かどうかを判定する
     */
    const isHighlighted = (globalIndex: number): boolean => {
      if (!highlightRange) return false;
      const { start, length } = highlightRange;
      return globalIndex >= start && globalIndex < start + length;
    };

    return (
      // row-reverseで右→左方向に行を並べる（縦書きの列配置）
      <View style={styles.container}>
        {lines.map((lineChars, lineIndex) => (
          <View key={lineIndex} style={styles.line}>
            {lineChars.map((char, charIndex) => {
              const globalIndex = lineIndex * lineLength + charIndex;
              const highlighted = isHighlighted(globalIndex);
              return (
                <Text
                  key={charIndex}
                  style={[
                    styles.char,
                    { fontSize },
                    highlighted && { color: highlightColor },
                  ]}
                >
                  {char}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

VerticalText.displayName = 'VerticalText';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse', // 右→左に列を並べる
    alignItems: 'flex-start',
  },
  line: {
    flexDirection: 'column', // 縦方向に文字を並べる
    alignItems: 'center',
    marginHorizontal: 2,
  },
  char: {
    color: COLORS.textPrimary,
    lineHeight: 30,
    fontFamily: 'serif',
  },
});

export default VerticalText;
