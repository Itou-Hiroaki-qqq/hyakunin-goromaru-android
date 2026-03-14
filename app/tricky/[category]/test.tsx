import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { useAllPoems } from '@/hooks/usePoems';
import { useGoroPlayback } from '@/hooks/useGoroPlayback';
import { reviewDatabase } from '@/services/reviewDatabase';
import ChoiceCard from '@/components/ui/ChoiceCard';
import PoemCard from '@/components/ui/PoemCard';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { KAMI_TRICKY_SETS, SHIMO_TRICKY_SETS } from '@/data/tricky-questions';
import { findGoroRange } from '@/utils/goroUtils';
import { shuffle } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';

interface TrickyQuizItem {
  /** 問題として表示する句 */
  questionPoem: Poem;
  /** 選択肢の句リスト（正解含む） */
  options: Poem[];
  /** 正解の選択肢インデックス */
  correctIndex: number;
}

/**
 * 間違えやすい問題 テスト画面
 *
 * category='kami': 下の句を見て上の句を当てる（KAMI_TRICKY_SETS）
 * category='shimo': 上の句を見て下の句を当てる（SHIMO_TRICKY_SETS）
 *
 * setId パラメータ指定時: そのセットのみ出題
 * setId='all' または省略時: カテゴリ全セットを出題（ランダム順）
 *
 * - 音声は回答時のみ再生（自動再生なし）
 * - 正解後に語呂ハイライトアニメーション
 * - 不正解は何度でも選び直せる
 */
export default function TrickyTestScreen() {
  const router = useRouter();
  const { category, setId } = useLocalSearchParams<{
    category: string;
    setId?: string;
  }>();
  const isKami = category === 'kami';

  const { data: allPoems, isLoading } = useAllPoems();

  const [questions, setQuestions] = useState<TrickyQuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [clickedWrong, setClickedWrong] = useState<number[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [goroPlayKey, setGoroPlayKey] = useState(0);

  const goroRunInProgressRef = useRef(false);
  const currentGoroPoemIdRef = useRef<number | null>(null);
  const lastGoroPlayKeyRef = useRef(0);

  const currentQuestion = questions[currentIndex] ?? null;
  const currentPoem = currentQuestion?.questionPoem ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const showGoro = selectedCorrect || clickedWrong.length > 0;

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

  // currentGoroPoemId を問題に合わせて更新
  useEffect(() => {
    currentGoroPoemIdRef.current = currentPoem?.id ?? null;
  }, [currentPoem?.id]);

  // 問題リストを生成する
  useEffect(() => {
    if (!allPoems) return;

    const sets = isKami ? KAMI_TRICKY_SETS : SHIMO_TRICKY_SETS;
    // setId='all' または省略時は全セットを対象にする
    const targetSets =
      setId && setId !== 'all' ? sets.filter((s) => s.id === setId) : sets;

    const items: TrickyQuizItem[] = [];

    for (const set of targetSets) {
      const setPoems = set.poemIds
        .map((id) => allPoems.find((p) => p.id === id))
        .filter((p): p is Poem => !!p);

      if (setPoems.length < 2) continue;

      // 各句を正解として1問生成
      for (const correctPoem of setPoems) {
        // 選択肢 = セット内の他の句（シャッフル）
        const shuffledOptions = shuffle([...setPoems]);
        const correctIndex = shuffledOptions.findIndex((p) => p.id === correctPoem.id);

        items.push({
          questionPoem: correctPoem,
          options: shuffledOptions,
          correctIndex,
        });
      }
    }

    const shuffledItems = shuffle(items);
    setQuestions(shuffledItems);
    setCurrentIndex(0);
    setScore(0);
    setClickedWrong([]);
    setSelectedCorrect(false);
    setGoroPlayKey(0);
  }, [allPoems, category, setId]);

  const handleAnswer = useCallback(
    async (selectedIdx: number) => {
      if (!currentQuestion) return;
      const isCorrect = selectedIdx === currentQuestion.correctIndex;

      if (isCorrect) {
        setSelectedCorrect(true);
        setGoroPlayKey((k) => k + 1);
      } else {
        const isFirstWrong = clickedWrong.length === 0;
        setClickedWrong((prev) => [...prev, selectedIdx]);
        if (isFirstWrong) {
          setGoroPlayKey((k) => k + 1);
          // 初回不正解時: 復習リストに追加
          await reviewDatabase.add(currentQuestion.questionPoem.id).catch(() => {});
        }
      }
    },
    [currentQuestion, clickedWrong],
  );

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      const buttons = [
        { text: '戻る', onPress: () => router.back() },
        {
          text: 'もう一度',
          onPress: () => {
            if (!allPoems) return;
            const sets = isKami ? KAMI_TRICKY_SETS : SHIMO_TRICKY_SETS;
            const targetSets =
              setId && setId !== 'all' ? sets.filter((s) => s.id === setId) : sets;
            const items: TrickyQuizItem[] = [];
            for (const set of targetSets) {
              const setPoems = set.poemIds
                .map((id) => allPoems.find((p) => p.id === id))
                .filter((p): p is Poem => !!p);
              if (setPoems.length < 2) continue;
              for (const correctPoem of setPoems) {
                const shuffledOptions = shuffle([...setPoems]);
                const correctIndex = shuffledOptions.findIndex((p) => p.id === correctPoem.id);
                items.push({ questionPoem: correctPoem, options: shuffledOptions, correctIndex });
              }
            }
            setQuestions(shuffle(items));
            setCurrentIndex(0);
            setScore(0);
            setClickedWrong([]);
            setSelectedCorrect(false);
            setGoroPlayKey(0);
          },
        },
      ];

      // 次のセットへボタン（個別セット時のみ）
      if (setId && setId !== 'all') {
        const sets = isKami ? KAMI_TRICKY_SETS : SHIMO_TRICKY_SETS;
        const currentSetIndex = sets.findIndex((s) => s.id === setId);
        if (currentSetIndex >= 0 && currentSetIndex < sets.length - 1) {
          const nextSet = sets[currentSetIndex + 1];
          buttons.push({
            text: '次のセットへ',
            onPress: () => {
              router.replace(
                `/tricky/${category}/test?setId=${nextSet.id}` as Parameters<typeof router.replace>[0],
              );
            },
          });
        }
      }

      Alert.alert(
        '完了！',
        `${questions.length}問中 ${score + (selectedCorrect ? 1 : 0)}問正解`,
        buttons,
      );
      return;
    }

    // スコア更新（一発正解時のみ）
    if (selectedCorrect && clickedWrong.length === 0) {
      setScore((s) => s + 1);
    }
    resetGoroHighlight();
    setCurrentIndex((i) => i + 1);
    setClickedWrong([]);
    setSelectedCorrect(false);
  }, [
    isLastQuestion,
    questions.length,
    score,
    selectedCorrect,
    clickedWrong,
    resetGoroHighlight,
    router,
    allPoems,
    isKami,
    setId,
  ]);

  const categoryTitle = isKami ? '上の句テスト' : '下の句テスト';
  const questionLabel = isKami
    ? '下の句（ひらがな）の上の句はどれ？'
    : '上の句（ひらがな）の続きはどれ？';

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title={categoryTitle} showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title={categoryTitle} showBack />
        <View style={styles.center}>
          <Text>データの読み込みに失敗しました</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 語呂ハイライト範囲
  const kamiHighlight =
    goroHighlightPhase !== 'none'
      ? findGoroRange(
          currentQuestion.questionPoem.kami_hiragana,
          currentQuestion.questionPoem.kami_goro,
        )
      : undefined;
  const shimoHighlight =
    goroHighlightPhase === 'shimo'
      ? findGoroRange(
          currentQuestion.questionPoem.shimo_hiragana,
          currentQuestion.questionPoem.shimo_goro,
        )
      : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={categoryTitle} showBack />
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <Text style={styles.scoreText}>スコア: {score}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionLabel}>{questionLabel}</Text>

        {/* 選択肢グリッド（2x2）。kami カテゴリは上に配置してヒントカードを下に置く */}
        {isKami && (
          <View style={styles.choiceGrid}>
            {currentQuestion.options.map((poem, index) => {
              const isCorrect = index === currentQuestion.correctIndex;
              const isWrong = clickedWrong.includes(index);
              let result: null | 'correct' | 'wrong' = null;
              if (selectedCorrect && isCorrect) result = 'correct';
              else if (isWrong) result = 'wrong';
              const disabled = selectedCorrect || isWrong;

              const choiceText = poem.kami_hiragana;
              const choiceHighlight = isCorrect ? kamiHighlight : undefined;

              return (
                <View key={poem.id} style={styles.choiceItem}>
                  <ChoiceCard
                    text={choiceText}
                    onPress={() => handleAnswer(index)}
                    disabled={disabled}
                    result={result}
                    highlightRange={choiceHighlight}
                    maxLines={3}
                    fontSize={14}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* 問題カード（kami: shimo表示をヒントとして下に、shimo: kami表示を上に） */}
        <View style={styles.questionCardWrap}>
          {isKami ? (
            <PoemCard
              poem={currentQuestion.questionPoem}
              showShimoOnly
              shimoHighlightRange={
                goroHighlightPhase === 'shimo' ? shimoHighlight : undefined
              }
              fontSize={16}
            />
          ) : (
            <PoemCard
              poem={currentQuestion.questionPoem}
              showKamiOnly
              kamiHighlightRange={kamiHighlight}
              fontSize={16}
            />
          )}
        </View>

        {/* 選択肢グリッド（shimo カテゴリは問題カードの下に配置） */}
        {!isKami && (
          <View style={styles.choiceGrid}>
            {currentQuestion.options.map((poem, index) => {
              const isCorrect = index === currentQuestion.correctIndex;
              const isWrong = clickedWrong.includes(index);
              let result: null | 'correct' | 'wrong' = null;
              if (selectedCorrect && isCorrect) result = 'correct';
              else if (isWrong) result = 'wrong';
              const disabled = selectedCorrect || isWrong;

              const choiceText = poem.shimo_hiragana;
              const choiceHighlight =
                isCorrect && goroHighlightPhase === 'shimo' ? shimoHighlight : undefined;

              return (
                <View key={poem.id} style={styles.choiceItem}>
                  <ChoiceCard
                    text={choiceText}
                    onPress={() => handleAnswer(index)}
                    disabled={disabled}
                    result={result}
                    highlightRange={choiceHighlight}
                    maxLines={2}
                    fontSize={14}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* 語呂解説 */}
        {showGoro && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>語呂合わせ</Text>
            <Text style={styles.kaisetsu}>
              {currentQuestion.questionPoem.goro_kaisetsu}
            </Text>
          </View>
        )}

        {/* 次へボタン（正解後） */}
        {selectedCorrect && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? '完了' : '次の問題 →'}
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
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
});
