import React, { memo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/study';
import type { BattleResult } from '@/utils/scoreUtils';

interface ResultModalProps {
  visible: boolean;
  result: BattleResult;
  playerScore: number;
  aiScore: number;
  questionCount: number;
  onRetry: () => void;
  onHome: () => void;
}

/**
 * Battle勝敗結果モーダルコンポーネント
 */
const ResultModal = memo(
  ({ visible, result, playerScore, aiScore, questionCount, onRetry, onHome }: ResultModalProps) => {
    const resultConfig = {
      win: { label: '勝ち！', emoji: '🎉', color: COLORS.correct },
      lose: { label: '負け...', emoji: '😢', color: COLORS.incorrect },
      draw: { label: '引き分け', emoji: '🤝', color: COLORS.primary },
    }[result];

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.emoji}>{resultConfig.emoji}</Text>
            <Text style={[styles.resultLabel, { color: resultConfig.color }]}>
              {resultConfig.label}
            </Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>あなた</Text>
                <Text style={[styles.scoreValue, { color: COLORS.correct }]}>{playerScore}</Text>
              </View>
              <Text style={styles.scoreDivider}>vs</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>AI</Text>
                <Text style={[styles.scoreValue, { color: COLORS.incorrect }]}>{aiScore}</Text>
              </View>
            </View>
            <Text style={styles.total}>{questionCount}問中</Text>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>もう一度</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                <Text style={styles.homeButtonText}>設定に戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

ResultModal.displayName = 'ResultModal';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 8,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  scoreDivider: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  total: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  buttons: {
    gap: 12,
    width: '100%',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  homeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultModal;
