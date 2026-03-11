import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import VerticalText from './VerticalText';
import { COLORS } from '@/constants/study';
import type { Poem } from '@/types/poem';

interface PoemCardProps {
  poem: Poem;
  /** 上の句のみ表示 */
  showKamiOnly?: boolean;
  /** 語呂ハイライトを表示 */
  showGoro?: boolean;
  fontSize?: number;
}

/**
 * 百人一首の札風カードコンポーネント
 * 琥珀色ボーダーとVerticalTextを内包する
 */
const PoemCard = memo(({ poem, showKamiOnly = false, showGoro = false, fontSize = 20 }: PoemCardProps) => {
  const kamiText = showGoro ? poem.kami_goro : poem.kami;
  const shimoText = showGoro ? poem.shimo_goro : poem.shimo;

  return (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <VerticalText text={kamiText} fontSize={fontSize} lineLength={3} />
        {!showKamiOnly && (
          <View style={styles.divider} />
        )}
        {!showKamiOnly && (
          <VerticalText text={shimoText} fontSize={fontSize} lineLength={2} />
        )}
      </View>
    </View>
  );
});

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
