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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePoems } from '@/hooks/usePoems';
import { useAllPoems } from '@/hooks/usePoems';
import { useTest } from '@/hooks/useTest';
import ChoiceCard from '@/components/ui/ChoiceCard';
import PoemCard from '@/components/ui/PoemCard';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { getBlockByRangeKey, getNextTestActions } from '@/utils/blockUtils';
import { findGoroRange } from '@/utils/goroUtils';

/**
 * 範囲キー文字列から { from, to } を解析する
 * "1-4" → { from: 1, to: 4 }
 * "1-8" → { from: 1, to: 8 }
 */
function parseRangeKey(rangeKey: string): { from: number; to: number } | null {
  const parts = rangeKey.split('-');
  if (parts.length !== 2) return null;
  const from = parseInt(parts[0], 10);
  const to = parseInt(parts[1], 10);
  if (isNaN(from) || isNaN(to) || from < 1 || to > 100 || from > to) return null;
  return { from, to };
}

/**
 * 首数からテストタイプラベルを決定する
 */
function resolveTestType(poemCount: number): string {
  if (poemCount === 4)  return '4首';
  if (poemCount === 8)  return '8首';
  if (poemCount === 20) return '20首';
  if (poemCount === 100) return '100首';
  return `${poemCount}首`;
}

/**
 * Testモード画面（4択クイズ）
 *
 * - 4首 / 8首 / 20首 いずれの範囲にも対応
 * - 問題切り替え時に上の句音声を自動再生
 * - 正解後に語呂ハイライトアニメーション（上→下）
 * - 不正解は何度でも選び直せる（clickedWrong[] 方式）
 * - 正解・不正解どちらでも goro_kaisetsu を表示
 */
export default function TestScreen() {
  const router = useRouter();
  const { range } = useLocalSearchParams<{ range: string }>();

  // まず既存の4首ブロックを検索し、見つからなければ範囲文字列を直接解析する
  const block = getBlockByRangeKey(range ?? '');
  const parsed = block ? null : parseRangeKey(range ?? '');

  const from = block?.from ?? parsed?.from ?? 1;
  const to   = block?.to   ?? parsed?.to   ?? 4;

  const poemCount = to - from + 1;
  const testType  = resolveTestType(poemCount);

  // ヘッダー表示用ラベル
  const headerLabel = block?.label ?? (range ? `${range.replace('-', '〜')}首` : 'テスト');

  const { data: rangePoems, isLoading: isLoadingRange } = usePoems(from, to);
  const { data: allPoems, isLoading: isLoadingAll } = useAllPoems();

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    perfectScore,
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
  } = useTest({ testType, rangeKey: range ?? '' });

  const isLoading = isLoadingRange || isLoadingAll;

  useEffect(() => {
    if (rangePoems && allPoems) {
      initTest(rangePoems, allPoems);
    }
    return () => reset();
  }, [rangePoems, allPoems]);

  const showGoro = answered || clickedWrong.length > 0;

  const handleNext = async () => {
    if (isLastQuestion) {
      await saveResults();
      const nextActions = getNextTestActions(range ?? '');
      const buttons = [
        { text: '学習一覧に戻る', onPress: () => router.back() },
        {
          text: 'もう一度',
          onPress: () => rangePoems && allPoems && initTest(rangePoems, allPoems),
        },
        ...nextActions.map((action) => ({
          text: action.label,
          onPress: () => router.replace(action.route as Parameters<typeof router.replace>[0]),
        })),
      ];
      Alert.alert(
        'テスト完了！',
        `${totalQuestions}問中 ${score}問正解\n一発正解: ${perfectScore}問`,
        buttons,
      );
    } else {
      nextQuestion();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="テスト" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="テスト" showBack />
        <View style={styles.center}>
          <Text>データの読み込みに失敗しました</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 語呂ハイライト範囲を計算
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
      <Header title={`テスト: ${headerLabel}`} showBack />

      {/* 進捗 */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {totalQuestions}
        </Text>
        <Text style={styles.scoreText}>
          スコア: {score} / 一発: {perfectScore}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 問題ラベル */}
        <Text style={styles.questionLabel}>上の句（ひらがな）の続きはどれ？</Text>

        {/* 上の句カード（PoemCard） */}
        <View style={styles.questionCardWrap}>
          <PoemCard
            poem={currentQuestion.poem}
            showKamiOnly
            kamiHighlightRange={kamiHighlight}
            fontSize={16}
          />
        </View>

        {/* 4択選択肢（2x2グリッド） */}
        <View style={styles.choiceGrid}>
          {currentQuestion.options.map((poem, index) => {
            const isCorrect = index === currentQuestion.correctIndex;
            const isWrong = clickedWrong.includes(index);
            let result: null | 'correct' | 'wrong' = null;
            if (answered && isCorrect) result = 'correct';
            else if (isWrong) result = 'wrong';

            const disabled = answered || (isWrong && !isCorrect);

            // 下の句の語呂ハイライト（正解カードのshimo）
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

        {/* 語呂解説（回答後に表示） */}
        {showGoro && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>語呂合わせ</Text>
            <Text style={styles.kaisetsu}>{currentQuestion.poem.goro_kaisetsu}</Text>
          </View>
        )}

        {/* 次へボタン（正解後に表示） */}
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
