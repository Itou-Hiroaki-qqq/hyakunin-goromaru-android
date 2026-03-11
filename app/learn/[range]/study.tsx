import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePoems } from '@/hooks/usePoems';
import { useStudyStore } from '@/stores/studyStore';
import { useStudyStep } from '@/hooks/useStudyStep';
import StudyCard from '@/components/learn/StudyCard';
import Header from '@/components/layout/Header';
import { COLORS, TOTAL_STEPS } from '@/constants/study';
import { getBlockByRangeKey } from '@/utils/blockUtils';

/**
 * Studyモード画面（6ステップ学習）
 */
export default function StudyScreen() {
  const router = useRouter();
  const { range } = useLocalSearchParams<{ range: string }>();
  const block = getBlockByRangeKey(range ?? '');

  const { data: poems, isLoading } = usePoems(
    block?.from ?? 1,
    block?.to ?? 4,
  );

  const { setPoems, currentPoemIndex, poems: storePoems } = useStudyStore();
  const currentPoem = storePoems[currentPoemIndex];

  const { currentStep, isPlaying, handleNextStep, handlePrevStep, handleNextPoem } =
    useStudyStep(currentPoem);

  const { playOnce } = { playOnce: (url: string) => Promise.resolve() };

  // 詩データが取得できたらストアにセット
  useEffect(() => {
    if (poems) {
      setPoems(poems);
    }
  }, [poems, setPoems]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Study" showBack />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPoem) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Study" showBack />
        <View style={styles.loading}>
          <Text style={styles.errorText}>データの読み込みに失敗しました</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLastPoem = currentPoemIndex === storePoems.length - 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const handleFinishOrNext = () => {
    if (!isLastStep) {
      handleNextStep();
    } else {
      const hasNext = handleNextPoem();
      if (!hasNext) {
        Alert.alert(
          'ブロック完了！',
          `${block?.label ?? ''}の学習が完了しました！\nテストに挑戦しますか？`,
          [
            { text: 'テストへ', onPress: () => router.replace(`/learn/${range}/test`) },
            { text: '学習一覧に戻る', onPress: () => router.back() },
          ],
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={`Study: ${block?.label ?? range}`}
        showBack
      />

      {/* 進捗バー */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentPoemIndex + 1} / {storePoems.length}首 ・ ステップ {currentStep} / {TOTAL_STEPS}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(currentStep / TOTAL_STEPS) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* 学習カード */}
      <View style={styles.cardContainer}>
        <StudyCard
          poem={currentPoem}
          step={currentStep}
          isPlaying={isPlaying}
          onPlayAudio={(url) => {
            // useAudioは useStudyStep 内で管理されているためここでは直接呼ばない
          }}
        />
      </View>

      {/* ナビゲーションボタン */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.prevButton, currentStep === 1 && styles.disabled]}
          onPress={handlePrevStep}
          disabled={currentStep === 1}
        >
          <Text style={styles.prevButtonText}>‹ 前へ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleFinishOrNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep
              ? isLastPoem
                ? 'ブロック完了 ✓'
                : '次の首へ →'
              : '次のステップ →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.incorrect,
    fontSize: 16,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  prevButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  prevButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
});
