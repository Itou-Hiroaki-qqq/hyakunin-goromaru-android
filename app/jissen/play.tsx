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
import { useRouter } from 'expo-router';
import { useAllPoems } from '@/hooks/usePoems';
import { audioService } from '@/services/audioService';
import { useGoroPlayback } from '@/hooks/useGoroPlayback';
import ChoiceCard from '@/components/ui/ChoiceCard';
import PoemCard from '@/components/ui/PoemCard';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { findGoroRange } from '@/utils/goroUtils';
import { generateQuizQuestion, shuffle } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';

interface JissenQuizItem {
  poem: Poem;
  options: Poem[];
  correctIndex: number;
}

/**
 * 実践問題 プレイ画面
 *
 * 「上の句の音声を聞いて下の句を答えてください」
 * - 音声のみ（上の句テキスト非表示）
 * - 正解後に初めて上の句テキストが確認できる
 * - 語呂音声再生・goro_kaisetsu 表示なし（実践モード）
 * - 100問終了後に完了画面
 */
export default function JissenPlayScreen() {
  const router = useRouter();
  const { data: allPoems, isLoading } = useAllPoems();

  const [questions, setQuestions] = useState<JissenQuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [clickedWrong, setClickedWrong] = useState<number[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [goroPlayKey, setGoroPlayKey] = useState(0);

  const lastPlayedIndexRef = useRef<number | null>(null);
  const goroRunInProgressRef = useRef(false);
  const currentGoroPoemIdRef = useRef<number | null>(null);
  const lastGoroPlayKeyRef = useRef(0);

  const currentQuestion = questions[currentIndex] ?? null;

  // 語呂ハイライトアニメーション（正解時のみ: 上の句語呂→下の句語呂を順番に再生）
  const { goroHighlightPhase, resetGoroHighlight } = useGoroPlayback({
    current: currentQuestion?.poem ?? null,
    showGoro: selectedCorrect,
    goroPlayKey,
    selectedCorrect,
    goroRunInProgressRef,
    currentGoroPoemIdRef,
    lastGoroPlayKeyRef,
  });

  // currentGoroPoemId を問題に合わせて更新
  useEffect(() => {
    currentGoroPoemIdRef.current = currentQuestion?.poem.id ?? null;
  }, [currentQuestion?.poem.id]);

  // 問題切り替え時に上の句音声を自動再生
  useEffect(() => {
    if (!currentQuestion?.poem.kami_audio_url || questions.length === 0) return;
    if (lastPlayedIndexRef.current === currentIndex) return;
    lastPlayedIndexRef.current = currentIndex;

    audioService.stopAll();
    setIsAudioPlaying(true);
    audioService.playOnce(currentQuestion.poem.kami_audio_url).finally(() => {
      setIsAudioPlaying(false);
    });
  }, [currentIndex, questions.length, currentQuestion?.poem.kami_audio_url]);

  // コンポーネントアンマウント時に音声を停止
  useEffect(() => {
    return () => {
      audioService.stopAll();
    };
  }, []);

  // 問題生成（全100首をシャッフル）
  useEffect(() => {
    if (!allPoems) return;
    const shuffled = shuffle([...allPoems]);
    const items: JissenQuizItem[] = shuffled.map((poem) => {
      const q = generateQuizQuestion(poem, allPoems);
      return { poem, options: q.options, correctIndex: q.correctIndex };
    });
    setQuestions(items);
    setCurrentIndex(0);
    setScore(0);
    setClickedWrong([]);
    setSelectedCorrect(false);
    setIsFinished(false);
    setGoroPlayKey(0);
    lastPlayedIndexRef.current = null;
  }, [allPoems]);

  const handleReplayAudio = useCallback(() => {
    if (!currentQuestion?.poem.kami_audio_url || isAudioPlaying) return;
    setIsAudioPlaying(true);
    audioService.playOnce(currentQuestion.poem.kami_audio_url).finally(() => {
      setIsAudioPlaying(false);
    });
  }, [currentQuestion, isAudioPlaying]);

  const handleAnswer = useCallback(
    (selectedIdx: number) => {
      if (!currentQuestion) return;
      const isCorrect = selectedIdx === currentQuestion.correctIndex;
      if (isCorrect) {
        setSelectedCorrect(true);
        // 正解時のみ語呂再生トリガー（問題読み上げ中でも即座に切替）
        setGoroPlayKey((k) => k + 1);
      } else {
        setClickedWrong((prev) => [...prev, selectedIdx]);
      }
    },
    [currentQuestion],
  );

  const handleNext = useCallback(() => {
    const isFirstTry = clickedWrong.length === 0;
    if (isFirstTry) setScore((s) => s + 1);

    if (currentIndex >= questions.length - 1) {
      setIsFinished(true);
    } else {
      resetGoroHighlight();
      setCurrentIndex((i) => i + 1);
      setClickedWrong([]);
      setSelectedCorrect(false);
      // goroPlayKey は単調増加させる（学習テストと同じパターン）。
      // 0 に戻すと lastGoroPlayKeyRef との偶然の一致で effect が早期 return してしまう。
    }
  }, [currentIndex, questions.length, clickedWrong, resetGoroHighlight]);

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="実践問題" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // 完了画面
  if (isFinished) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="実践問題" showBack />
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedTitle}>完了！</Text>
          <Text style={styles.finishedScore}>
            {questions.length}問中 {score}問 一発正解
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (!allPoems) return;
              resetGoroHighlight();
              const shuffled = shuffle([...allPoems]);
              const items: JissenQuizItem[] = shuffled.map((poem) => {
                const q = generateQuizQuestion(poem, allPoems);
                return { poem, options: q.options, correctIndex: q.correctIndex };
              });
              setQuestions(items);
              setCurrentIndex(0);
              setScore(0);
              setClickedWrong([]);
              setSelectedCorrect(false);
              setIsFinished(false);
              setGoroPlayKey(0);
              lastPlayedIndexRef.current = null;
            }}
          >
            <Text style={styles.retryButtonText}>もう一度</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.homeButtonText}>ホームへ戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="実践問題" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="実践問題" showBack />
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {questions.length}
        </Text>
        <Text style={styles.scoreText}>正解: {score}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionLabel}>上の句の音声を聞いて下の句を答えてください</Text>

        {/* 音声再生ボタン（正解前のみ表示） */}
        {!selectedCorrect && (
          <View style={styles.audioSection}>
            <TouchableOpacity
              style={[styles.audioButton, isAudioPlaying && styles.audioButtonPlaying]}
              onPress={handleReplayAudio}
              disabled={isAudioPlaying}
            >
              <Text style={styles.audioButtonText}>
                {isAudioPlaying ? '再生中...' : '上の句を聴く'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 正解後に上の句を確認（語呂ハイライト付き） */}
        {selectedCorrect && (
          <View style={styles.questionCardWrap}>
            <PoemCard
              poem={currentQuestion.poem}
              showKamiOnly
              kamiHighlightRange={
                goroHighlightPhase !== 'none'
                  ? findGoroRange(
                      currentQuestion.poem.kami_hiragana,
                      currentQuestion.poem.kami_goro,
                    )
                  : undefined
              }
            />
          </View>
        )}

        {/* 4択（2x2グリッド） */}
        <View style={styles.choiceGrid}>
          {currentQuestion.options.map((poem, index) => {
            const isCorrect = index === currentQuestion.correctIndex;
            const isWrong = clickedWrong.includes(index);
            let result: null | 'correct' | 'wrong' = null;
            if (selectedCorrect && isCorrect) result = 'correct';
            else if (isWrong) result = 'wrong';
            const disabled = selectedCorrect || isWrong;

            // 正解カードのみ、phase==='shimo' のとき下の句語呂部分に赤文字
            const shimoHighlightOnCard =
              isCorrect && goroHighlightPhase === 'shimo'
                ? findGoroRange(poem.shimo_hiragana, poem.shimo_goro)
                : undefined;

            return (
              <View key={poem.id} style={styles.choiceItem}>
                <ChoiceCard
                  text={poem.shimo_hiragana}
                  onPress={() => handleAnswer(index)}
                  disabled={disabled}
                  result={result}
                  highlightRange={shimoHighlightOnCard}
                />
              </View>
            );
          })}
        </View>

        {/* 次へボタン（正解後） */}
        {selectedCorrect && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex >= questions.length - 1 ? '完了' : '次の問題 →'}
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
  questionLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  audioSection: { alignItems: 'center' },
  audioButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  audioButtonPlaying: { backgroundColor: COLORS.primaryDark },
  audioButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  questionCardWrap: { alignItems: 'center' },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceItem: { width: '48%' },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  // 完了画面
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  finishedTitle: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  finishedScore: { fontSize: 18, color: COLORS.textPrimary },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  retryButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  homeButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  homeButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
