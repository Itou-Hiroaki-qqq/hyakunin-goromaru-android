import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/study';

interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
}

/**
 * AIタイマーバーコンポーネント
 * 残り時間を横バーでアニメーション表示する
 */
const TimerBar = memo(({ timeLeft, totalTime }: TimerBarProps) => {
  const progress = useSharedValue(1);

  useEffect(() => {
    const ratio = totalTime > 0 ? timeLeft / totalTime : 0;
    progress.value = withTiming(ratio, {
      duration: 100,
      easing: Easing.linear,
    });
  }, [timeLeft, totalTime, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
    backgroundColor: progress.value > 0.5
      ? COLORS.correct
      : progress.value > 0.25
        ? COLORS.primary
        : COLORS.incorrect,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>AI: {timeLeft.toFixed(1)}秒</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, animatedStyle]} />
      </View>
    </View>
  );
});

TimerBar.displayName = 'TimerBar';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'right',
  },
  track: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
});

export default TimerBar;
