import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Text } from 'react-native';
import { COLORS } from '@/constants/study';

interface AudioButtonProps {
  onPress: () => void;
  isPlaying?: boolean;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * 音声再生ボタンコンポーネント
 */
const AudioButton = memo(({ onPress, isPlaying = false, size = 44, disabled = false, style }: AudioButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isPlaying}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        (disabled || isPlaying) && styles.disabled,
        style,
      ]}
      accessibilityLabel="音声を再生"
      accessibilityRole="button"
    >
      {isPlaying ? (
        <ActivityIndicator color={COLORS.surface} size="small" />
      ) : (
        <Text style={[styles.icon, { fontSize: size * 0.45 }]}>♪</Text>
      )}
    </TouchableOpacity>
  );
});

AudioButton.displayName = 'AudioButton';

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  icon: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
});

export default AudioButton;
