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
import { useReview } from '@/hooks/useReview';
import { useAllPoems } from '@/hooks/usePoems';
import { useTest } from '@/hooks/useTest';
import QuizOption from '@/components/learn/QuizOption';
import GoroText from '@/components/ui/GoroText';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';

/**
 * 復習学習画面
 * 復習リストの首をテスト形式で学習する
 */
export default function ReviewStudyScreen() {
  const router = useRouter();
  const { dueItems, removeItem } = useReview();
  const { data: allPoems, isLoading: isLoadingAll } = useAllPoems();

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    answered,
    selectedIndex,
    isLastQuestion,
    initTest,
    handleAnswer,
    nextQuestion,
    reset,
  } = useTest({ testType: 'review', rangeKey: 'review' });

  useEffect(() => {
    if (allPoems && dueItems.length > 0) {
      const duePoems = dueItems
        .map((item) => allPoems.find((p) => p.id === item.poem_id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      initTest(duePoems, allPoems);
    }
    return () => reset();
  }, [allPoems, dueItems.length]);

  const handleNext = async () => {
    if (answered && currentQuestion) {
      const isCorrect = selectedIndex === currentQuestion.correctIndex;
      if (isCorrect) {
        // 正解した場合は復習リストから削除
        await removeItem(currentQuestion.poem.id).catch(() => {});
      }
    }

    if (isLastQuestion) {
      Alert.alert(
        '復習完了！',
        `${totalQuestions}問中 ${score}問正解`,
        [{ text: '復習一覧に戻る', onPress: () => router.back() }],
      );
    } else {
      nextQuestion();
    }
  };

  const isLoading = isLoadingAll;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習学習" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (dueItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習学習" showBack />
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyTitle}>今日の復習はありません</Text>
          <Text style={styles.emptyDesc}>次回の復習まで待ちましょう</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習学習" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="復習学習" showBack />
      <View style={styles.progress}>
        <Text style={styles.progressText}>{currentIndex + 1} / {totalQuestions}</Text>
        <Text style={styles.scoreText}>スコア: {score}</Text>
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
              {isLastQuestion ? '復習完了 ✓' : '次の問題 →'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary },
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
