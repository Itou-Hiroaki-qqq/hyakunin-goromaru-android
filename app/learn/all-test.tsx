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
import QuizOption from '@/components/learn/QuizOption';
import GoroText from '@/components/ui/GoroText';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';

/**
 * 100首テスト画面
 */
export default function AllTestScreen() {
  const router = useRouter();
  const { data: allPoems, isLoading } = useAllPoems();

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    bestConsecutive,
    answered,
    selectedIndex,
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

  const handleNext = async () => {
    if (isLastQuestion) {
      await saveResults();
      Alert.alert(
        '100首テスト完了！',
        `${totalQuestions}問中 ${score}問正解\n最高連続正解: ${bestConsecutive}`,
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

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="100首テスト" showBack />
      <View style={styles.progress}>
        <Text style={styles.progressText}>{currentIndex + 1} / {totalQuestions}</Text>
        <Text style={styles.scoreText}>スコア: {score} / 連続: {bestConsecutive}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.questionBox}>
          <Text style={styles.questionLabel}>この上の句の下の句は？</Text>
          <Text style={styles.questionKami}>{currentQuestion.poem.kami}</Text>
          <Text style={styles.questionKamiHira}>{currentQuestion.poem.kami_hiragana}</Text>
        </View>
        <View style={styles.options}>
          {currentQuestion.options.map((poem, index) => (
            <QuizOption
              key={poem.id}
              poem={poem}
              index={index}
              isCorrectAnswer={index === currentQuestion.correctIndex}
              isSelected={selectedIndex === index}
              answered={answered}
              onPress={handleAnswer}
            />
          ))}
        </View>
        {answered && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>語呂合わせ</Text>
            <GoroText text={currentQuestion.poem.kami_goro} />
            <GoroText text={currentQuestion.poem.shimo_goro} />
            <Text style={styles.kaisetsu}>{currentQuestion.poem.goro_kaisetsu}</Text>
          </View>
        )}
        {answered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'テスト完了 ✓' : '次の問題 →'}
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
  content: { padding: 16, gap: 16 },
  questionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  questionLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  questionKami: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  questionKamiHira: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  options: { gap: 4 },
  explanation: {
    backgroundColor: '#fffbf0',
    borderRadius: 10,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  explanationTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
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
