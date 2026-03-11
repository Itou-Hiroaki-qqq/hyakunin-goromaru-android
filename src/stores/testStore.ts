import { create } from 'zustand';
import type { Poem } from '@/types/poem';

export interface QuizQuestion {
  poem: Poem;
  options: Poem[];  // 4択の選択肢（正解含む）
  correctIndex: number;
}

interface TestState {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;              // 総正解数
  consecutiveCorrect: number; // 現在の連続正解数
  bestConsecutive: number;    // セッション内最高連続正解数
  answered: boolean;          // 現在の問題に回答済みか
  selectedIndex: number | null; // 選択した選択肢インデックス
  answer: (selectedIndex: number) => boolean; // 正解かどうかを返す
  nextQuestion: () => boolean;  // 次の問題へ。完了時はfalseを返す
  setQuestions: (questions: QuizQuestion[]) => void;
  reset: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  score: 0,
  consecutiveCorrect: 0,
  bestConsecutive: 0,
  answered: false,
  selectedIndex: null,

  answer: (selectedIndex: number) => {
    const { questions, currentIndex, score, consecutiveCorrect, bestConsecutive } = get();
    const question = questions[currentIndex];
    if (!question) return false;

    const isCorrect = selectedIndex === question.correctIndex;
    const newConsecutive = isCorrect ? consecutiveCorrect + 1 : 0;
    const newBest = Math.max(bestConsecutive, newConsecutive);

    set({
      answered: true,
      selectedIndex,
      score: isCorrect ? score + 1 : score,
      consecutiveCorrect: newConsecutive,
      bestConsecutive: newBest,
    });

    return isCorrect;
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1, answered: false, selectedIndex: null });
      return true;
    }
    return false;
  },

  setQuestions: (questions: QuizQuestion[]) => {
    set({ questions, currentIndex: 0, answered: false, selectedIndex: null });
  },

  reset: () => {
    set({
      questions: [],
      currentIndex: 0,
      score: 0,
      consecutiveCorrect: 0,
      bestConsecutive: 0,
      answered: false,
      selectedIndex: null,
    });
  },
}));
