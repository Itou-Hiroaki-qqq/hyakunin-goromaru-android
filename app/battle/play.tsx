import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAllPoems } from '@/hooks/usePoems';
import { useBattleStore } from '@/stores/battleStore';
import { audioService } from '@/services/audioService';
import ChoiceCard from '@/components/ui/ChoiceCard';
import PoemCard from '@/components/ui/PoemCard';
import Header from '@/components/layout/Header';
import ResultModal from '@/components/battle/ResultModal';
import { COLORS, BATTLE_DIFFICULTIES } from '@/constants/study';
import { getKamiGoroEndSec } from '@/data/goro-timings';
import { generateQuizQuestions, shuffle } from '@/utils/poemUtils';
import { getBattleResult } from '@/utils/scoreUtils';
import type { BattleQuestion } from '@/stores/battleStore';

/** 難易度ごとの語呂終了後の追加待機時間（ms） */
const STAGE_DELAY_MS: Record<string, number> = {
  BEGINNER: 4000,
  INTERMEDIATE: 2000,
  ADVANCED: 500,
};

/** 音声読み込み開始からの想定待機時間（ms）*/
const AUDIO_LOAD_DELAY_MS = 500;

/**
 * Battle対戦画面（語呂終了タイミングベースのAIタイマー実装）
 *
 * - 問題切り替え時に上の句音声を自動再生
 * - KAMI_GORO_END_SEC から語呂終了秒数を取得し、AIタイマーを設定
 * - ユーザーが正解 → タイマークリア → ユーザー取得
 * - AIタイマー発火 → コンピューター取得 + 手アニメーション
 * - 不正解（お手付き） → コンピューターが取得
 */
export default function BattlePlayScreen() {
  const router = useRouter();
  const { data: allPoems, isLoading } = useAllPoems();
  const { difficulty, questionCount } = useBattleStore();

  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [clickedWrong, setClickedWrong] = useState<number[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [aiTook, setAiTook] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const computerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPlayedIndexRef = useRef<number | null>(null);
  const audioStartTimeRef = useRef<number>(0);

  // 手アニメーション（コンピューター取得時）
  const handAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex] ?? null;
  const isAnswered = selectedCorrect || aiTook || clickedWrong.some(
    (idx) => idx !== (currentQuestion?.correctIndex ?? -1),
  );

  /** コンピュータータイマーをクリアする */
  const clearComputerTimer = useCallback(() => {
    if (computerTimerRef.current) {
      clearTimeout(computerTimerRef.current);
      computerTimerRef.current = null;
    }
  }, []);

  /** コンピューター取得アニメーション */
  const playComputerAnimation = useCallback(() => {
    handAnim.setValue(0);
    Animated.sequence([
      Animated.timing(handAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(handAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [handAnim]);

  /** コンピューターが取る処理 */
  const computerTake = useCallback(() => {
    clearComputerTimer();
    setAiTook(true);
    setAiScore((s) => s + 1);
    playComputerAnimation();
  }, [clearComputerTimer, playComputerAnimation]);

  // 問題切り替え時の処理（音声再生 + AIタイマーセット）
  useEffect(() => {
    if (!currentQuestion || questions.length === 0) return;
    if (lastPlayedIndexRef.current === currentIndex) return;
    lastPlayedIndexRef.current = currentIndex;

    clearComputerTimer();
    setClickedWrong([]);
    setSelectedCorrect(false);
    setAiTook(false);

    // 上の句音声を再生
    audioService.stopAll();
    audioStartTimeRef.current = Date.now();
    setIsAudioPlaying(true);
    audioService
      .playOnce(currentQuestion.poem.kami_audio_url)
      .catch(() => {})
      .finally(() => setIsAudioPlaying(false));

    // AIタイマーをセット（語呂終了秒数 + 難易度オフセット）
    const goroEndSec = getKamiGoroEndSec(currentQuestion.poem.id);
    const stageDelay = STAGE_DELAY_MS[difficulty] ?? STAGE_DELAY_MS.BEGINNER;
    const totalDelay = AUDIO_LOAD_DELAY_MS + goroEndSec * 1000 + stageDelay;

    computerTimerRef.current = setTimeout(() => {
      computerTake();
    }, totalDelay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions.length]);

  // アンマウント時にタイマー・音声を停止
  useEffect(() => {
    return () => {
      clearComputerTimer();
      audioService.stopAll();
    };
  }, [clearComputerTimer]);

  // 問題生成
  useEffect(() => {
    if (!allPoems) return;
    const shuffled = shuffle([...allPoems]).slice(0, questionCount);
    const generated = generateQuizQuestions(shuffled, allPoems);
    setQuestions(generated);
    setCurrentIndex(0);
    setPlayerScore(0);
    setAiScore(0);
    setClickedWrong([]);
    setSelectedCorrect(false);
    setAiTook(false);
    setIsFinished(false);
    lastPlayedIndexRef.current = null;
  }, [allPoems, difficulty, questionCount]);

  /**
   * 上の句音声を再生し直す（音が出ないときのフォールバック用）
   * AIタイマーはリセットしない（対戦テンポを維持するため）
   */
  const handleReplayAudio = useCallback(() => {
    if (!currentQuestion?.poem.kami_audio_url || isAudioPlaying) return;
    setIsAudioPlaying(true);
    audioService
      .playOnce(currentQuestion.poem.kami_audio_url)
      .catch(() => {})
      .finally(() => setIsAudioPlaying(false));
  }, [currentQuestion, isAudioPlaying]);

  const handleAnswer = useCallback(
    (selectedIdx: number) => {
      if (!currentQuestion || isAnswered) return;
      const isCorrect = selectedIdx === currentQuestion.correctIndex;

      if (isCorrect) {
        clearComputerTimer();
        setSelectedCorrect(true);
        setPlayerScore((s) => s + 1);
      } else {
        // お手付き → コンピューターが取る
        clearComputerTimer();
        setClickedWrong((prev) => [...prev, selectedIdx]);
        setTimeout(() => computerTake(), 500);
      }
    },
    [currentQuestion, isAnswered, clearComputerTimer, computerTake],
  );

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, questions.length]);

  const handleRetry = useCallback(() => {
    if (!allPoems) return;
    const shuffled = shuffle([...allPoems]).slice(0, questionCount);
    const generated = generateQuizQuestions(shuffled, allPoems);
    setQuestions(generated);
    setCurrentIndex(0);
    setPlayerScore(0);
    setAiScore(0);
    setClickedWrong([]);
    setSelectedCorrect(false);
    setAiTook(false);
    setIsFinished(false);
    lastPlayedIndexRef.current = null;
  }, [allPoems, questionCount]);

  const battleResult = getBattleResult(playerScore, aiScore);
  const difficultyLabel = BATTLE_DIFFICULTIES[difficulty]?.label ?? difficulty;

  const handStyle = {
    transform: [
      {
        translateY: handAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [80, 0],
        }),
      },
    ],
    opacity: handAnim,
  };

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="対戦" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>準備中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="対戦" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={`対戦（${difficultyLabel}）`} showBack />

      {/* スコアバー */}
      <View style={styles.scorebar}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>あなた</Text>
          <Text style={[styles.scoreValue, { color: COLORS.correct }]}>
            {playerScore}
          </Text>
        </View>
        <Text style={styles.vsText}>
          {currentIndex + 1} / {questionCount}
        </Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>AI</Text>
          <Text style={[styles.scoreValue, { color: COLORS.incorrect }]}>
            {aiScore}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* コンピューター取得時の手アニメーション */}
        {aiTook && (
          <Animated.View style={[styles.handContainer, handStyle]}>
            <Text style={styles.handEmoji}>🖐</Text>
            <Text style={styles.aiTookText}>AIが取りました</Text>
          </Animated.View>
        )}

        {/* 上の句エリア: 回答前はプレースホルダ+リプレイボタン、回答後は札を表示 */}
        {isAnswered ? (
          <View style={styles.questionCardWrap}>
            <PoemCard poem={currentQuestion.poem} showKamiOnly />
          </View>
        ) : (
          <View style={styles.audioPlaceholder}>
            <Text style={styles.audioPlaceholderText}>
              {isAudioPlaying ? '🔊 読み上げ中...' : '🔊 上の句を聞いて札を選んでください'}
            </Text>
            <TouchableOpacity
              style={[styles.replayButton, isAudioPlaying && styles.replayButtonDisabled]}
              onPress={handleReplayAudio}
              disabled={isAudioPlaying}
            >
              <Text style={styles.replayButtonText}>
                {isAudioPlaying ? '再生中...' : 'もう一度聴く'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4択選択肢 */}
        <View style={styles.choiceGrid}>
          {currentQuestion.options.map((poem, index) => {
            const isCorrect = index === currentQuestion.correctIndex;
            const isWrong = clickedWrong.includes(index);
            let result: null | 'correct' | 'wrong' = null;
            if ((selectedCorrect || aiTook) && isCorrect) result = 'correct';
            else if (isWrong) result = 'wrong';
            const disabled = isAnswered;

            return (
              <View key={poem.id} style={styles.choiceItem}>
                <ChoiceCard
                  text={poem.shimo_hiragana}
                  onPress={() => handleAnswer(index)}
                  disabled={disabled}
                  result={result}
                />
              </View>
            );
          })}
        </View>

        {/* 次へボタン（回答後） */}
        {isAnswered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex >= questionCount - 1 ? '結果を見る' : '次の問題 →'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 結果モーダル */}
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
  handContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
  },
  handEmoji: { fontSize: 40 },
  aiTookText: { fontSize: 14, color: COLORS.incorrect, fontWeight: '700', marginTop: 4 },
  questionCardWrap: { alignItems: 'center' },
  // 上の句札が非表示のときのプレースホルダ（札と同じくらいの縦スペースを確保してレイアウト揺れを防ぐ）
  audioPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    backgroundColor: '#fffbf0',
    borderWidth: 2,
    borderColor: '#f5d78e',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  audioPlaceholderText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  replayButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  replayButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  replayButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
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
});
