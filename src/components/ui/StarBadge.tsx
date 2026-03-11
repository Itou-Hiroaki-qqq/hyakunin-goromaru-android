import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/study';

interface StarBadgeProps {
  cleared: boolean;
  size?: number;
}

/**
 * テストクリア時の★バッジコンポーネント
 */
const StarBadge = memo(({ cleared, size = 24 }: StarBadgeProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.star, { fontSize: size * 0.8 }]}>
        {cleared ? '★' : '☆'}
      </Text>
    </View>
  );
});

StarBadge.displayName = 'StarBadge';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    color: COLORS.primary,
    lineHeight: undefined,
  },
});

export default StarBadge;
