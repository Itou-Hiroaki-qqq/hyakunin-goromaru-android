import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants/study';
import type { Poem } from '@/types/poem';

interface QuizOptionProps {
  poem: Poem;
  index: number;
  isCorrectAnswer: boolean;
  isSelected: boolean;
  answered: boolean;
  onPress: (index: number) => void;
}

/**
 * 4択クイズの選択肢コンポーネント
 * 回答後に〇/×フィードバックを表示する
 */
const QuizOption = memo(
  ({ poem, index, isCorrectAnswer, isSelected, answered, onPress }: QuizOptionProps) => {
    const getBackgroundColor = (): string => {
      if (!answered) return COLORS.surface;
      if (isCorrectAnswer) return '#dcfce7'; // 正解: 薄緑
      if (isSelected && !isCorrectAnswer) return '#fee2e2'; // 不正解: 薄赤
      return COLORS.surface;
    };

    const getBorderColor = (): string => {
      if (!answered) return '#e5e7eb';
      if (isCorrectAnswer) return COLORS.correct;
      if (isSelected && !isCorrectAnswer) return COLORS.incorrect;
      return '#e5e7eb';
    };

    const getFeedbackIcon = (): string | null => {
      if (!answered) return null;
      if (isCorrectAnswer) return '〇';
      if (isSelected && !isCorrectAnswer) return '×';
      return null;
    };

    const feedbackIcon = getFeedbackIcon();

    return (
      <TouchableOpacity
        onPress={() => onPress(index)}
        disabled={answered}
        style={[
          styles.option,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Text style={styles.optionText} numberOfLines={2}>
            {poem.shimo}
          </Text>
          <Text style={styles.optionSubText} numberOfLines={1}>
            {poem.shimo_hiragana}
          </Text>
        </View>
        {feedbackIcon && (
          <Text
            style={[
              styles.feedback,
              { color: isCorrectAnswer ? COLORS.correct : COLORS.incorrect },
            ]}
          >
            {feedbackIcon}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);

QuizOption.displayName = 'QuizOption';

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    marginVertical: 4,
  },
  content: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  feedback: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default QuizOption;
