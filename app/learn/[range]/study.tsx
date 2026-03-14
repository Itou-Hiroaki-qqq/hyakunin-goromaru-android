import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePoems, useAllPoems } from '@/hooks/usePoems';
import { useStudyStore } from '@/stores/studyStore';
import { useStudyStep } from '@/hooks/useStudyStep';
import ChoiceCard from '@/components/ui/ChoiceCard';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { getBlockByRangeKey } from '@/utils/blockUtils';
import { findGoroRange } from '@/utils/goroUtils';
import { generateQuizQuestion } from '@/utils/poemUtils';
import { audioService } from '@/services/audioService';
import PoemCard from '@/components/ui/PoemCard';

/**
 * Studyモード画面（2ステップ表示 / 内部6ステップ自動遷移 + 練習フェーズ）
 *
 * Step 0: 漢字で全体表示（横書き） → 「始める」ボタン
 * Step 1-6: 横書きカードでコンテンツを段階的に表示
 *   - Step 1: kami_audio再生 + 上の句ひらがな逐字表示
 *   - Step 2: shimo_audio再生 + 下の句ひらがな逐字表示
 *   - Step 3: kami_goro_audio再生 + 上の句語呂を赤+下線ハイライト
 *   - Step 4: shimo_goro_audio再生 + 下の句語呂を赤+下線ハイライト
 *   - Step 5: kami_goro_audio→shimo_goro_audio連続再生 + goro_kaisetsu表示
 *   - Step 6: 「練習へ →」ボタン表示
 * phase=practice: 上の句カード + 4択 練習
 */

// ──────────────────────────────────────────────
// ハイライト付き横書きテキスト
// ──────────────────────────────────────────────
interface HighlightRange {
  start: number;
  length: number;
}

function HighlightedText({
  text,
  highlightRange,
  style,
}: {
  text: string;
  highlightRange?: HighlightRange;
  style?: object;
}) {
  if (!highlightRange || highlightRange.length === 0) {
    return <Text style={style}>{text}</Text>;
  }
  const { start, length } = highlightRange;
  const before = text.slice(0, start);
  const highlighted = text.slice(start, start + length);
  const after = text.slice(start + length);
  return (
    <Text style={style}>
      {before}
      <Text style={styles.goroHighlight}>{highlighted}</Text>
      {after}
    </Text>
  );
}

// ──────────────────────────────────────────────
// メイン画面
// ──────────────────────────────────────────────
export default function StudyScreen() {
  const router = useRouter();
  const { range } = useLocalSearchParams<{ range: string }>();
  const block = getBlockByRangeKey(range ?? '');

  const { data: poems, isLoading: isLoadingPoems } = usePoems(
    block?.from ?? 1,
    block?.to ?? 4,
  );
  const { data: allPoems, isLoading: isLoadingAll } = useAllPoems();

  const {
    setPoems,
    currentPoemIndex,
    poems: storePoems,
    answerPractice,
    practiceClickedWrong,
    practiceCorrect,
    resetPractice,
  } = useStudyStore();
  const currentPoem = storePoems[currentPoemIndex];

  // 逐字表示の文字数（useStudyStepから更新される）
  const [kamiVisibleLen, setKamiVisibleLen] = useState(0);
  const [shimoVisibleLen, setShimoVisibleLen] = useState(0);

  // useRef で最新の state setter を保持して関数を安定させる
  const kamiSetterRef = useRef(setKamiVisibleLen);
  const shimoSetterRef = useRef(setShimoVisibleLen);
  kamiSetterRef.current = setKamiVisibleLen;
  shimoSetterRef.current = setShimoVisibleLen;

  const onKamiChange = useCallback((v: number) => {
    kamiSetterRef.current(v);
  }, []);
  const onShimoChange = useCallback((v: number) => {
    shimoSetterRef.current(v);
  }, []);

  const {
    learnStep,
    phase,
    handleStart,
    handleGoToPractice,
    handleBackToLearn,
    handleNextPoem,
  } = useStudyStep(currentPoem, onKamiChange, onShimoChange);

  const isLoading = isLoadingPoems || isLoadingAll;

  useEffect(() => {
    if (poems) {
      setPoems(poems);
    }
  }, [poems, setPoems]);

  // ステップが変わったら逐字カウントをリセット
  useEffect(() => {
    if (learnStep === 0) {
      setKamiVisibleLen(currentPoem?.kami_hiragana.length ?? 0);
      setShimoVisibleLen(currentPoem?.shimo_hiragana.length ?? 0);
    }
  }, [learnStep, currentPoem?.kami_hiragana.length, currentPoem?.shimo_hiragana.length]);

  // 練習フェーズの4択生成（フェーズ変更時に再生成）
  const practiceQuestion = useMemo(() => {
    if (!currentPoem || !allPoems) return null;
    return generateQuizQuestion(currentPoem, allPoems);
  }, [currentPoem?.id, allPoems, phase]);

  // フェーズが practice に変わったらリセット
  useEffect(() => {
    if (phase === 'practice') {
      resetPractice();
    }
  }, [phase, currentPoem?.id]);

  // 練習フェーズ開始時・問題変化時に上の句音声を自動再生
  useEffect(() => {
    if (phase === 'practice' && currentPoem?.kami_audio_url) {
      audioService.playOnce(currentPoem.kami_audio_url).catch(() => {});
    }
  }, [phase, currentPoem?.id]);

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

  const handleFinish = () => {
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
  };

  // 語呂ハイライト範囲（Step 3: 上の句、Step 4以降: 両方）
  const kamiGoroRange =
    learnStep >= 3
      ? findGoroRange(currentPoem.kami_hiragana, currentPoem.kami_goro)
      : undefined;
  const shimoGoroRange =
    learnStep >= 4
      ? findGoroRange(currentPoem.shimo_hiragana, currentPoem.shimo_goro)
      : undefined;

  // 表示するひらがな（逐字）
  const kamiVisible = currentPoem.kami_hiragana.slice(0, kamiVisibleLen);
  const shimoVisible = currentPoem.shimo_hiragana.slice(0, shimoVisibleLen);

  // ======= 練習フェーズ =======
  if (phase === 'practice' && practiceQuestion) {
    const shimoGoroRangeFull = findGoroRange(
      currentPoem.shimo_hiragana,
      currentPoem.shimo_goro,
    );

    return (
      <SafeAreaView style={styles.safe}>
        <Header title={`Study: ${block?.label ?? range}`} showBack />
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentPoemIndex + 1} / {storePoems.length}首 ・ ステップ 2 / 2
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.practiceLabel}>上の句（ひらがな）の続きはどれ？</Text>
          <View style={styles.questionCardWrap}>
            <PoemCard
              poem={currentPoem}
              showKamiOnly
              fontSize={14}
              kamiHighlightRange={findGoroRange(currentPoem.kami_hiragana, currentPoem.kami_goro)}
            />
          </View>
          <View style={styles.choiceGrid}>
            {practiceQuestion.options.map((poem, index) => {
              const isCorrect = index === practiceQuestion.correctIndex;
              const isWrong = practiceClickedWrong.includes(index);
              let result: null | 'correct' | 'wrong' = null;
              if (practiceCorrect && isCorrect) result = 'correct';
              else if (isWrong) result = 'wrong';
              const disabled = practiceCorrect || isWrong;

              // 正解かつ正解済みのときだけ下の句語呂をハイライト
              const cardHighlightRange =
                practiceCorrect && isCorrect ? shimoGoroRangeFull : undefined;

              return (
                <View key={poem.id} style={styles.choiceItem}>
                  <ChoiceCard
                    text={poem.shimo_hiragana}
                    onPress={() => answerPractice(index, practiceQuestion.correctIndex)}
                    disabled={disabled}
                    result={result}
                    fontSize={14}
                    highlightRange={cardHighlightRange}
                  />
                </View>
              );
            })}
          </View>

          {practiceCorrect && (
            <View style={styles.practiceButtons}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToLearn}
              >
                <Text style={styles.backButtonText}>学習に戻る</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleFinish}
              >
                <Text style={styles.nextButtonText}>
                  {isLastPoem ? 'テストへ' : '次の首へ →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ======= 学習フェーズ（Step 0〜6）横書きカード =======
  return (
    <SafeAreaView style={styles.safe}>
      <Header title={`Study: ${block?.label ?? range}`} showBack />

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentPoemIndex + 1} / {storePoems.length}首 ・{' '}
          {learnStep === 0 ? 'スタート前' : 'ステップ 1 / 2'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.learnCard}>

          {/* ── 上の句ブロック ── */}
          <View style={styles.verseBlock}>
            <Text style={styles.verseLabel}>上の句</Text>
            <Text style={styles.kanjiText}>{currentPoem.kami}</Text>

            {/* Step 1以降: ひらがな逐字 → Step 3からハイライト付き */}
            {learnStep >= 1 && (
              <HighlightedText
                text={kamiVisible}
                highlightRange={kamiGoroRange}
                style={styles.hiraganaText}
              />
            )}
          </View>

          {/* ── 区切り線 ── */}
          <View style={styles.divider} />

          {/* ── 下の句ブロック（常に表示、Step 2以降でひらがな追加） ── */}
          <View style={styles.verseBlock}>
            <Text style={styles.verseLabel}>下の句</Text>
            <Text style={styles.kanjiText}>{currentPoem.shimo}</Text>
            {learnStep >= 2 && (
              <HighlightedText
                text={shimoVisible}
                highlightRange={shimoGoroRange}
                style={styles.hiraganaText}
              />
            )}
          </View>

          {/* ── Step 5以降: 語呂の意味ボックス ── */}
          {learnStep >= 5 && (
            <View style={styles.kaisetsuBox}>
              <Text style={styles.kaisetsuLabel}>語呂の意味</Text>
              <Text style={styles.kaisetsuText}>{currentPoem.goro_kaisetsu}</Text>
            </View>
          )}

          {/* ── Step 0: 「始める」ボタン（右寄せ） ── */}
          {learnStep === 0 && (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>始める</Text>
            </TouchableOpacity>
          )}

          {/* ── Step 6: 「練習へ」ボタン（右寄せ） ── */}
          {learnStep === 6 && (
            <TouchableOpacity style={styles.startButton} onPress={handleGoToPractice}>
              <Text style={styles.startButtonText}>練習へ →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// スタイル
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 16 },
  errorText: { color: COLORS.incorrect, fontSize: 16 },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
    alignItems: 'stretch',
    paddingBottom: 60,
  },

  // ── 学習フェーズ横書きカード ──
  learnCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 0,
  },
  verseBlock: {
    paddingVertical: 8,
    gap: 4,
  },
  verseLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  kanjiText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 28,
  },
  hiraganaText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginTop: 2,
  },
  goroHighlight: {
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  kaisetsuBox: {
    marginTop: 12,
    backgroundColor: '#f3f0ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  kaisetsuLabel: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  kaisetsuText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  startButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    backgroundColor: '#f5a623',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── 練習フェーズ ──
  questionCardWrap: { alignItems: 'center' },
  practiceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  choiceItem: { width: '48%' },
  practiceButtons: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  backButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  nextButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  nextButtonText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
});
