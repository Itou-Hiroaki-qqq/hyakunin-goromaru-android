import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAllPoems } from '@/hooks/usePoems';
import { useBattle } from '@/hooks/useBattle';
import { useBattleStore } from '@/stores/battleStore';
import QuizOption from '@/components/learn/QuizOption';
import TimerBar from '@/components/battle/TimerBar';
import ResultModal from '@/components/battle/ResultModal';
import Header from '@/components/layout/Header';
import { COLORS, BATTLE_DIFFICULTIES } from '@/constants/study';
import { getBattleResult } from '@/utils/scoreUtils';
import { shuffle } from '@/utils/poemUtils';

/**
 * Battle対戦画面
 */
export default function BattlePlayScreen() {
  const router = useRouter();
  const { data: allPoems, isLoading } = useAllPoems();
  const { difficulty, questionCount } = useBattleStore();

  const {
    questions,
    currentIndex,
    playerScore,
    aiScore,
    timeLeft,
    isFinished,
    answered,
    selectedIndex,
    setup,
    goNext,
    playerAnswer,
  } = useBattle();

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (allPoems) {
      const shuffled = shuffle([...allPoems]).slice(0, questionCount);
      setup(shuffled, allPoems, difficulty, questionCount);
    }
  }, [allPoems]);

  const handleAnswer = (index: number) => {
    playerAnswer(index);
  };

  const handleNext = () => {
    goNext();
  };

  const handleRetry = () => {
    if (allPoems) {
      const shuffled = shuffle([...allPoems]).slice(0, questionCount);
      setup(shuffled, allPoems, difficulty, questionCount);
    }
  };

  const battleResult = getBattleResult(playerScore, aiScore);
  const totalTime = BATTLE_DIFFICULTIES[difficulty].aiTimeSeconds;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Battle" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Battle" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>準備中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Battle" showBack />

      {/* スコアバー */}
      <View style={styles.scorebar}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>あなた</Text>
          <Text style={[styles.scoreValue, { color: COLORS.correct }]}>{playerScore}</Text>
        </View>
        <Text style={styles.vsText}>{currentIndex + 1} / {questionCount}</Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>AI</Text>
          <Text style={[styles.scoreValue, { color: COLORS.incorrect }]}>{aiScore}</Text>
        </View>
      </View>

      {/* AIタイマーバー */}
      {!answered && (
        <TimerBar timeLeft={timeLeft} totalTime={totalTime} />
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.questionBox}>
          <Text style={styles.questionLabel}>上の句</Text>
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
          <View
            style={[
              styles.feedbackBanner,
              selectedIndex === currentQuestion.correctIndex
                ? styles.correctBanner
                : styles.incorrectBanner,
            ]}
          >
            <Text style={styles.feedbackText}>
              {selectedIndex === currentQuestion.correctIndex ? '正解！' : '不正解...'}
            </Text>
          </View>
        )}

        {answered && (
          <View
            style={[styles.nextButtonContainer]}
          >
            <Text
              style={styles.nextButton}
              onPress={handleNext}
            >
              {currentIndex >= questionCount - 1 ? '結果を見る ✓' : '次の問題 →'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 勝敗モーダル */}
      <ResultModal
        visible={isFinished}
        result={battleResult}
        playerScore={playerScore}
        aiScore={aiScore}
        questionCount={questionCount}
        onRetry={handleRetry}
        onHome={() => router.replace('/battle')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scorebar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: COLORS.textSecondary },
  scoreValue: { fontSize: 28, fontWeight: 'bold' },
  vsText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
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
  feedbackBanner: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  correctBanner: { backgroundColor: '#dcfce7' },
  incorrectBanner: { backgroundColor: '#fee2e2' },
  feedbackText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  nextButtonContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButton: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
});
