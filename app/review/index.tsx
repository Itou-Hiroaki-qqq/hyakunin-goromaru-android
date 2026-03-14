import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useReview } from '@/hooks/useReview';
import { useAllPoems } from '@/hooks/usePoems';
import { useKamiAudio } from '@/hooks/useKamiAudio';
import { useGoroPlayback } from '@/hooks/useGoroPlayback';
import { reviewDatabase } from '@/services/reviewDatabase';
import ChoiceCard from '@/components/ui/ChoiceCard';
import PoemCard from '@/components/ui/PoemCard';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { findGoroRange } from '@/utils/goroUtils';
import { generateQuizQuestion } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';

interface ReviewQuizItem {
  poem: Poem;
  options: Poem[];
  correctIndex: number;
}

/**
 * 復習画面（1問ずつクイズ形式）
 *
 * - 復習リストの句を1問ずつ出題（上の句を見て下の句を答える）
 * - 上の句音声を自動再生
 * - 正解後に語呂ハイライトアニメーション
 * - 「復習からはずす」で削除、「次へ」で次の問題へ
 */
export default function ReviewIndexScreen() {
  const { items, isLoading, removeItem, reload } = useReview();
  const { data: allPoems } = useAllPoems();

  const [quizItems, setQuizItems] = useState<ReviewQuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clickedWrong, setClickedWrong] = useState<number[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [goroPlayKey, setGoroPlayKey] = useState(0);

  const goroRunInProgressRef = useRef(false);
  const currentGoroPoemIdRef = useRef<number | null>(null);
  const lastGoroPlayKeyRef = useRef(0);

  const currentQuiz = quizItems[currentIndex] ?? null;
  const currentPoem = currentQuiz?.poem ?? null;
  const showGoro = selectedCorrect || clickedWrong.length > 0;

  // 問題切り替え時に上の句音声を自動再生
  useKamiAudio({
    current: currentPoem,
    currentQ: currentIndex,
    poemsLength: quizItems.length,
  });

  // 語呂ハイライトアニメーション
  const { goroHighlightPhase, resetGoroHighlight } = useGoroPlayback({
    current: currentPoem,
    showGoro,
    goroPlayKey,
    selectedCorrect,
    goroRunInProgressRef,
    currentGoroPoemIdRef,
    lastGoroPlayKeyRef,
  });

  useEffect(() => {
    currentGoroPoemIdRef.current = currentPoem?.id ?? null;
  }, [currentPoem?.id]);

  // 復習アイテムからクイズ問題を生成
  useEffect(() => {
    if (!allPoems || items.length === 0) return;
    const generated: ReviewQuizItem[] = items
      .map((item) => {
        const poem = allPoems.find((p) => p.id === item.poem_id);
        if (!poem) return null;
        const q = generateQuizQuestion(poem, allPoems);
        return { poem, options: q.options, correctIndex: q.correctIndex };
      })
      .filter((q): q is ReviewQuizItem => !!q);

    setQuizItems(generated);
    setCurrentIndex(0);
    setClickedWrong([]);
    setSelectedCorrect(false);
    setGoroPlayKey(0);
  }, [items, allPoems]);

  const handleAnswer = useCallback(
    async (selectedIdx: number) => {
      if (!currentQuiz) return;
      const isCorrect = selectedIdx === currentQuiz.correctIndex;
      if (isCorrect) {
        setSelectedCorrect(true);
        setGoroPlayKey((k) => k + 1);
      } else {
        const isFirstWrong = clickedWrong.length === 0;
        setClickedWrong((prev) => [...prev, selectedIdx]);
        if (isFirstWrong) {
          setGoroPlayKey((k) => k + 1);
        }
      }
    },
    [currentQuiz, clickedWrong],
  );

  const handleRemove = useCallback(async () => {
    if (!currentPoem) return;
    await removeItem(currentPoem.id);
    // リロード後に quizItems が再生成される
    // currentIndex はそのままにしておく（次の問題が来る）
  }, [currentPoem, removeItem]);

  const handleNext = useCallback(() => {
    resetGoroHighlight();
    if (currentIndex < quizItems.length - 1) {
      setCurrentIndex((i) => i + 1);
      setClickedWrong([]);
      setSelectedCorrect(false);
    } else {
      // 全問完了したらリロード
      reload();
      setCurrentIndex(0);
      setClickedWrong([]);
      setSelectedCorrect(false);
    }
  }, [currentIndex, quizItems.length, resetGoroHighlight, reload]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 復習リストが空
  if (quizItems.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習" showBack />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>復習リストは空です</Text>
          <Text style={styles.emptyDesc}>
            テストで間違えた問題が自動で追加されます
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuiz) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 語呂ハイライト範囲
  const kamiHighlight =
    goroHighlightPhase !== 'none'
      ? findGoroRange(currentQuiz.poem.kami_hiragana, currentQuiz.poem.kami_goro)
      : undefined;
  const shimoHighlight =
    goroHighlightPhase === 'shimo'
      ? findGoroRange(currentQuiz.poem.shimo_hiragana, currentQuiz.poem.shimo_goro)
      : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="復習" showBack />
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {quizItems.length}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionLabel}>上の句（ひらがな）の続きはどれ？</Text>

        <View style={styles.questionCardWrap}>
          <PoemCard
            poem={currentQuiz.poem}
            showKamiOnly
            kamiHighlightRange={kamiHighlight}
            fontSize={16}
          />
        </View>

        {/* 4択（2x2グリッド） */}
        <View style={styles.choiceGrid}>
          {currentQuiz.options.map((poem, index) => {
            const isCorrect = index === currentQuiz.correctIndex;
            const isWrong = clickedWrong.includes(index);
            let result: null | 'correct' | 'wrong' = null;
            if (selectedCorrect && isCorrect) result = 'correct';
            else if (isWrong) result = 'wrong';
            const disabled = selectedCorrect || isWrong;
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

        {/* 語呂解説 */}
        {showGoro && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>語呂合わせ</Text>
            <Text style={styles.kaisetsu}>{currentQuiz.poem.goro_kaisetsu}</Text>
          </View>
        )}

        {/* 正解後のボタン */}
        {selectedCorrect && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
              <Text style={styles.removeButtonText}>復習からはずす</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentIndex < quizItems.length - 1 ? '次へ →' : '完了'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  progress: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  progressText: { fontSize: 14, color: COLORS.textSecondary },
  content: { padding: 16, gap: 16, paddingBottom: 80 },
  questionLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  questionCardWrap: { alignItems: 'center' },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceItem: { width: '48%' },
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  removeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#9ca3af',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  removeButtonText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  nextButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  nextButtonText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
});
