import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/study';

interface GoroTextProps {
  /** 語呂合わせテキスト（語呂部分を[]で囲む、例: "[あきの]た[の]かりほの..." など） */
  text: string;
  fontSize?: number;
}

/**
 * 語呂ハイライトテキストコンポーネント
 * []で囲まれた部分を赤色でハイライト表示する
 *
 * Note: 語呂文字列に特定のマーカーがない場合、
 * 全テキストをそのまま表示する
 */
const GoroText = memo(({ text, fontSize = 18 }: GoroTextProps) => {
  // []で囲まれた部分をパースしてハイライト
  const parts = parseGoroText(text);

  return (
    <Text style={[styles.container, { fontSize }]}>
      {parts.map((part, index) =>
        part.isHighlight ? (
          <Text key={index} style={styles.highlight}>
            {part.text}
          </Text>
        ) : (
          <Text key={index}>{part.text}</Text>
        ),
      )}
    </Text>
  );
});

GoroText.displayName = 'GoroText';

interface GoroPart {
  text: string;
  isHighlight: boolean;
}

/**
 * テキストを通常部分とハイライト部分に分割する
 * []で囲まれた部分がハイライト対象
 */
function parseGoroText(text: string): GoroPart[] {
  const parts: GoroPart[] = [];
  const regex = /\[([^\]]+)\]|([^\[]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) {
      // []で囲まれた部分
      parts.push({ text: match[1], isHighlight: true });
    } else if (match[2] !== undefined) {
      parts.push({ text: match[2], isHighlight: false });
    }
  }

  // パースできない場合はそのまま返す
  if (parts.length === 0) {
    parts.push({ text, isHighlight: false });
  }

  return parts;
}

const styles = StyleSheet.create({
  container: {
    color: COLORS.textPrimary,
    lineHeight: 28,
    flexWrap: 'wrap',
  },
  highlight: {
    color: COLORS.highlight,
    fontWeight: 'bold',
  },
});

export default GoroText;
