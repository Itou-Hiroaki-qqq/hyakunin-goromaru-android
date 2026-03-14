import { create } from 'zustand';
import type { Poem } from '@/types/poem';
import { TOTAL_STEPS } from '@/constants/study';

export type StudyPhase = 'learn' | 'practice';

interface StudyState {
  /** 学習フェーズ: 'learn'=6ステップ学習, 'practice'=4択練習 */
  phase: StudyPhase;
  /** 学習ステップ 0-6（0: 開始前、1-5: 自動遷移、6: 練習へボタン表示） */
  learnStep: number;
  /** 後方互換用（現在の currentStep = learnStep） */
  currentStep: number;
  currentPoemIndex: number;
  poems: Poem[];
  practiceClickedWrong: number[]; // 練習フェーズの不正解選択肢
  practiceCorrect: boolean;       // 練習フェーズで正解済みか
  setLearnStep: (step: number) => void;
  setPhase: (phase: StudyPhase) => void;
  nextStep: () => void;
  prevStep: () => void;
  nextPoem: () => boolean;
  setPoems: (poems: Poem[]) => void;
  resetPractice: () => void;
  answerPractice: (selectedIndex: number, correctIndex: number) => boolean;
  reset: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  phase: 'learn',
  learnStep: 0,
  currentStep: 0,
  currentPoemIndex: 0,
  poems: [],
  practiceClickedWrong: [],
  practiceCorrect: false,

  setLearnStep: (step: number) => {
    set({ learnStep: step, currentStep: step });
  },

  setPhase: (phase: StudyPhase) => {
    set({ phase });
  },

  nextStep: () => {
    const { learnStep } = get();
    if (learnStep < TOTAL_STEPS) {
      set({ learnStep: learnStep + 1, currentStep: learnStep + 1 });
    }
  },

  prevStep: () => {
    const { learnStep } = get();
    if (learnStep > 1) {
      set({ learnStep: learnStep - 1, currentStep: learnStep - 1 });
    }
  },

  nextPoem: () => {
    const { currentPoemIndex, poems } = get();
    if (currentPoemIndex < poems.length - 1) {
      set({
        currentPoemIndex: currentPoemIndex + 1,
        learnStep: 0,
        currentStep: 0,
        phase: 'learn',
        practiceClickedWrong: [],
        practiceCorrect: false,
      });
      return true;
    }
    return false;
  },

  setPoems: (poems: Poem[]) => {
    set({
      poems,
      currentPoemIndex: 0,
      learnStep: 0,
      currentStep: 0,
      phase: 'learn',
      practiceClickedWrong: [],
      practiceCorrect: false,
    });
  },

  resetPractice: () => {
    set({ practiceClickedWrong: [], practiceCorrect: false });
  },

  answerPractice: (selectedIndex: number, correctIndex: number) => {
    const { practiceClickedWrong } = get();
    const isCorrect = selectedIndex === correctIndex;
    if (isCorrect) {
      set({ practiceCorrect: true });
    } else {
      set({ practiceClickedWrong: [...practiceClickedWrong, selectedIndex] });
    }
    return isCorrect;
  },

  reset: () => {
    set({
      phase: 'learn',
      learnStep: 0,
      currentStep: 0,
      currentPoemIndex: 0,
      poems: [],
      practiceClickedWrong: [],
      practiceCorrect: false,
    });
  },
}));
