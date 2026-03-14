import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import VerticalText from './VerticalText';
import { splitToLines } from '@/utils/formatLines';
import { COLORS } from '@/constants/study';
import type { Poem } from '@/types/poem';

interface HighlightRange {
  start: number;
  length: number;
}

interface PoemCardProps {
  poem: Poem;
  /** 上の句のみ表示 */
  showKamiOnly?: boolean;
  /** 下の句のみ表示（実践問題用） */
  showShimoOnly?: boolean;
  /** 語呂ハイライトを表示（showGoro=trueのとき語呂テキストを使用） */
  showGoro?: boolean;
  /** 上の句のハイライト範囲（ひらがなテキストに対して） */
  kamiHighlightRange?: HighlightRange;
  /** 下の句のハイライト範囲（ひらがなテキストに対して） */
  shimoHighlightRange?: HighlightRange;
  fontSize?: number;
}

/**
 * 百人一首の札風カードコンポーネント
 *
 * 琥珀色ボーダーと VerticalText を内包する。
 * kamiHighlightRange / shimoHighlightRange で語呂ハイライトに対応。
 * splitToLines により上の句は3列、下の句は2列で縦書き表示する。
 */
const PoemCard = memo(
  ({
    poem,
    showKamiOnly = false,
    showShimoOnly = false,
    showGoro = false,
    kamiHighlightRange,
    shimoHighlightRange,
    fontSize = 20,
  }: PoemCardProps) => {
    // showGoro のとき語呂テキスト、それ以外はひらがなテキスト
    const kamiText = showGoro ? poem.kami_goro : poem.kami_hiragana;
    const shimoText = showGoro ? poem.shimo_goro : poem.shimo_hiragana;

    const kamiLines = splitToLines(kamiText, 3);
    const shimoLines = splitToLines(shimoText, 2);

    return (
      <View style={styles.card}>
        <View style={styles.textContainer}>
          {!showShimoOnly && (
            <VerticalText
              lines={kamiLines}
              highlightRange={kamiHighlightRange}
              fontSize={fontSize}
            />
          )}
          {!showKamiOnly && !showShimoOnly && (
            <View style={styles.divider} />
          )}
          {!showKamiOnly && (
            <VerticalText
              lines={shimoLines}
              highlightRange={shimoHighlightRange}
              fontSize={fontSize}
            />
          )}
        </View>
      </View>
    );
  },
);

PoemCard.displayName = 'PoemCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    minWidth: 140,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
    opacity: 0.4,
  },
});

export default PoemCard;
