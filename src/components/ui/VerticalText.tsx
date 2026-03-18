import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/study';

interface HighlightRange {
  start: number;
  length: number;
}

interface VerticalTextProps {
  /**
   * 表示する行の配列（splitToLines で分割済みのもの）
   * 例: ['あかにし', 'やのかわ'] → 2列縦書き
   */
  lines: string[];
  highlightRange?: HighlightRange;
  highlightColor?: string;
  fontSize?: number;
}

/**
 * 縦書きテキストコンポーネント（lines[] props方式）
 *
 * React Nativeには writing-mode がないため、
 * 1文字ずつ Text に分割し flexDirection: column で縦配置。
 * 行を row-reverse で右→左に並べることで縦書きを実現。
 *
 * lines[] は splitToLines() で分割済みの文字列配列を渡す。
 */
const VerticalText = memo(
  ({
    lines,
    highlightRange,
    highlightColor = COLORS.highlight,
    fontSize = 22,
  }: VerticalTextProps) => {
    /**
     * 元のテキスト全体における文字のグローバルインデックスを計算する
     * lines を連結した文字列での位置として扱う
     */
    const isHighlighted = (globalIndex: number): boolean => {
      if (!highlightRange) return false;
      const { start, length } = highlightRange;
      return globalIndex >= start && globalIndex < start + length;
    };

    // 各行の先頭文字がどのグローバルインデックスから始まるかを算出
    const lineOffsets: number[] = [];
    let offset = 0;
    for (const line of lines) {
      lineOffsets.push(offset);
      offset += line.length;
    }

    return (
      // row-reverse で右→左方向に列を並べる（縦書きの列配置）
      <View style={styles.container}>
        {lines.map((line, lineIndex) => (
          <View key={lineIndex} style={styles.line}>
            {line.split('').map((char, charIndex) => {
              const globalIndex = lineOffsets[lineIndex] + charIndex;
              const highlighted = isHighlighted(globalIndex);
              return (
                <Text
                  key={charIndex}
                  style={[
                    styles.char,
                    { fontSize, lineHeight: Math.round(fontSize * 1.4) },
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
    marginHorizontal: 6,
  },
  char: {
    color: COLORS.textPrimary,
    lineHeight: 30,
    fontFamily: 'NotoSerifJP',
    fontWeight: 'bold',
  },
});

export default VerticalText;
