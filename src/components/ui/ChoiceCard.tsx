import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import VerticalText from './VerticalText';
import { splitToLines } from '@/utils/formatLines';
import { COLORS } from '@/constants/study';

interface HighlightRange {
  start: number;
  length: number;
}

interface ChoiceCardProps {
  /** 表示するテキスト（shimo_hiragana または kami_hiragana） */
  text: string;
  onPress: () => void;
  disabled: boolean;
  /** null: 未回答、'correct': 正解、'wrong': 不正解 */
  result: null | 'correct' | 'wrong';
  highlightRange?: HighlightRange;
  fontSize?: number;
  /** 分割行数（上の句=3、下の句=2） */
  maxLines?: number;
}

/**
 * 取り札風 縦書き選択肢カード
 *
 * 2x2グリッドで配置する前提のコンポーネント。
 * 琥珀色背景・ボーダーで百人一首の札を表現。
 * 正解時は〇（緑）、不正解時は×（赤）のオーバーレイを表示。
 */
const ChoiceCard = memo(
  ({
    text,
    onPress,
    disabled,
    result,
    highlightRange,
    fontSize = 18,
    maxLines = 2,
  }: ChoiceCardProps) => {
    const lines = splitToLines(text, maxLines);

    return (
      <TouchableOpacity
        style={[styles.card, disabled && styles.cardDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <VerticalText
          lines={lines}
          highlightRange={highlightRange}
          fontSize={fontSize}
        />

        {/* 正解オーバーレイ */}
        {result === 'correct' && (
          <View style={styles.overlay}>
            <Text style={styles.correctMark}>〇</Text>
          </View>
        )}

        {/* 不正解オーバーレイ */}
        {result === 'wrong' && (
          <View style={styles.overlay}>
            <Text style={styles.wrongMark}>×</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

ChoiceCard.displayName = 'ChoiceCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffbf0',
    borderWidth: 2,
    borderColor: '#f5d78e',
    borderRadius: 8,
    padding: 12,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
  correctMark: {
    fontSize: 52,
    color: COLORS.correct,
    fontWeight: 'bold',
    lineHeight: 60,
  },
  wrongMark: {
    fontSize: 52,
    color: COLORS.incorrect,
    fontWeight: 'bold',
    lineHeight: 60,
  },
});

export default ChoiceCard;
