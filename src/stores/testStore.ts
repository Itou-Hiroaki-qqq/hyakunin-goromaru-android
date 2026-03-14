import { create } from 'zustand';
import type { Poem } from '@/types/poem';

export interface QuizQuestion {
  poem: Poem;
  options: Poem[]; // 4択の選択肢（正解含む）
  correctIndex: number;
}

interface TestState {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number; // 総正解数（一発正解のみカウント）
  perfectScore: number; // 一発正解数
  consecutiveCorrect: number; // 現在の連続正解数
  bestConsecutive: number; // セッション内最高連続正解数
  /** 正解選択済みか */
  selectedCorrect: boolean;
  /** 間違えた選択肢インデックスの配列 */
  clickedWrong: number[];
  /** 語呂再生トリガー（値が変わるたびに useGoroPlayback が発火） */
  goroPlayKey: number;
  /** 回答済みか（selectedCorrect が true になったとき） */
  answered: boolean;
  selectedIndex: number | null;
  answer: (selectedIndex: number) => boolean; // 正解かどうかを返す
  nextQuestion: () => boolean; // 次の問題へ。完了時はfalseを返す
  setQuestions: (questions: QuizQuestion[]) => void;
  reset: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  score: 0,
  perfectScore: 0,
  consecutiveCorrect: 0,
  bestConsecutive: 0,
  selectedCorrect: false,
  clickedWrong: [],
  goroPlayKey: 0,
  answered: false,
  selectedIndex: null,

  answer: (selectedIndex: number) => {
    const {
      questions,
      currentIndex,
      score,
      perfectScore,
      consecutiveCorrect,
      bestConsecutive,
      clickedWrong,
      goroPlayKey,
      answered,
    } = get();

    const question = questions[currentIndex];
    if (!question || answered) return false;

    const isCorrect = selectedIndex === question.correctIndex;

    if (isCorrect) {
      const isFirstTry = clickedWrong.length === 0;
      const newConsecutive = isFirstTry ? consecutiveCorrect + 1 : 0;
      const newBest = Math.max(bestConsecutive, newConsecutive);
      set({
        answered: true,
        selectedCorrect: true,
        selectedIndex,
        score: isFirstTry ? score + 1 : score,
        perfectScore: isFirstTry ? perfectScore + 1 : perfectScore,
        consecutiveCorrect: newConsecutive,
        bestConsecutive: newBest,
        goroPlayKey: goroPlayKey + 1,
      });
    } else {
      // 不正解: clickedWrong に追加し、同じキーで再度選択可能にする
      // 初めて不正解になったときのみ goroPlayKey を更新（語呂再生）
      const isFirstWrong = clickedWrong.length === 0;
      set({
        clickedWrong: [...clickedWrong, selectedIndex],
        selectedIndex,
        // 連続正解はリセット
        consecutiveCorrect: 0,
        goroPlayKey: isFirstWrong ? goroPlayKey + 1 : goroPlayKey,
      });
    }

    return isCorrect;
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({
        currentIndex: currentIndex + 1,
        answered: false,
        selectedCorrect: false,
        clickedWrong: [],
        selectedIndex: null,
      });
      return true;
    }
    return false;
  },

  setQuestions: (questions: QuizQuestion[]) => {
    set({
      questions,
      currentIndex: 0,
      answered: false,
      selectedCorrect: false,
      clickedWrong: [],
      selectedIndex: null,
    });
  },

  reset: () => {
    set({
      questions: [],
      currentIndex: 0,
      score: 0,
      perfectScore: 0,
      consecutiveCorrect: 0,
      bestConsecutive: 0,
      selectedCorrect: false,
      clickedWrong: [],
      goroPlayKey: 0,
      answered: false,
      selectedIndex: null,
    });
  },
}));
