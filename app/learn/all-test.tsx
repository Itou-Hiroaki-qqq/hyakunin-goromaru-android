import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAllPoems } from '@/hooks/usePoems';
import { useTest } from '@/hooks/useTest';
import ChoiceCard from '@/components/ui/ChoiceCard';
import PoemCard from '@/components/ui/PoemCard';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { findGoroRange } from '@/utils/goroUtils';

/**
 * 100首テスト画面
 *
 * - 問題切り替え時に上の句音声を自動再生
 * - 正解後に語呂ハイライトアニメーション（上→下）
 * - 不正解は何度でも選び直せる（clickedWrong[] 方式）
 */
export default function AllTestScreen() {
  const router = useRouter();
  const { data: allPoems, isLoading } = useAllPoems();

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    perfectScore,
    bestConsecutive,
    answered,
    selectedCorrect,
    clickedWrong,
    goroHighlightPhase,
    isLastQuestion,
    initTest,
    handleAnswer,
    nextQuestion,
    saveResults,
    reset,
  } = useTest({ testType: '100首', rangeKey: 'all' });

  useEffect(() => {
    if (allPoems) {
      initTest(allPoems, allPoems);
    }
    return () => reset();
  }, [allPoems]);

  const showGoro = answered || clickedWrong.length > 0;

  const handleNext = async () => {
    if (isLastQuestion) {
      await saveResults();
      Alert.alert(
        '100首テスト完了！',
        `${totalQuestions}問中 ${score}問正解\n一発正解: ${perfectScore}問\n最高連続: ${bestConsecutive}`,
        [
          { text: 'ホームに戻る', onPress: () => router.replace('/') },
          { text: 'もう一度', onPress: () => allPoems && initTest(allPoems, allPoems) },
        ],
      );
    } else {
      nextQuestion();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="100首テスト" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="100首テスト" showBack />
        <View style={styles.center}>
          <Text>データの読み込みに失敗しました</Text>
        </View>
      </SafeAreaView>
    );
  }

  const kamiHighlight =
    goroHighlightPhase !== 'none'
      ? findGoroRange(
          currentQuestion.poem.kami_hiragana,
          currentQuestion.poem.kami_goro,
        )
      : undefined;
  const shimoHighlight =
    goroHighlightPhase === 'shimo'
      ? findGoroRange(
          currentQuestion.poem.shimo_hiragana,
          currentQuestion.poem.shimo_goro,
        )
      : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="100首テスト" showBack />
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {totalQuestions}
        </Text>
        <Text style={styles.scoreText}>
          スコア: {score} / 連続: {bestConsecutive}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionLabel}>上の句（ひらがな）の続きはどれ？</Text>

        <View style={styles.questionCardWrap}>
          <PoemCard
            poem={currentQuestion.poem}
            showKamiOnly
            kamiHighlightRange={kamiHighlight}
            fontSize={16}
          />
        </View>

        <View style={styles.choiceGrid}>
          {currentQuestion.options.map((poem, index) => {
            const isCorrect = index === currentQuestion.correctIndex;
            const isWrong = clickedWrong.includes(index);
            let result: null | 'correct' | 'wrong' = null;
            if (answered && isCorrect) result = 'correct';
            else if (isWrong) result = 'wrong';

            const disabled = answered || (isWrong && !isCorrect);
            const shimoHighlightOnCard =
              isCorrect && goroHighlightPhase === 'shimo' ? shimoHighlight : undefined;

            return (
              <View key={poem.id} style={styles.choiceItem}>
                <ChoiceCard
                  text={poem.shimo_hiragana}
                  onPress={() => handleAnswer(index)}
                  disabled={disabled}
                  result={result}
                  highlightRange={shimoHighlightOnCard}
                  fontSize={14}
                />
              </View>
            );
          })}
        </View>

        {showGoro && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>語呂合わせ</Text>
            <Text style={styles.kaisetsu}>{currentQuestion.poem.goro_kaisetsu}</Text>
          </View>
        )}

        {answered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'テスト完了' : '次の問題 →'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  progressText: { fontSize: 14, color: COLORS.textSecondary },
  scoreText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  content: { padding: 16, gap: 16, paddingBottom: 80 },
  questionLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  questionCardWrap: {
    alignItems: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceItem: {
    width: '48%',
  },
  explanation: {
    backgroundColor: '#fffbf0',
    borderRadius: 10,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  explanationTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  goroText: { fontSize: 14, color: COLORS.textPrimary },
  kaisetsu: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
});
