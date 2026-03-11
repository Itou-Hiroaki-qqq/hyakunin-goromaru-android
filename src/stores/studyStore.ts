import { create } from 'zustand';
import type { Poem } from '@/types/poem';
import { TOTAL_STEPS } from '@/constants/study';

interface StudyState {
  currentStep: number;        // 1-6
  currentPoemIndex: number;   // 現在の首インデックス
  poems: Poem[];              // 学習対象の首
  nextStep: () => void;
  prevStep: () => void;
  nextPoem: () => boolean;    // 次の首へ。完了時はfalseを返す
  setPoems: (poems: Poem[]) => void;
  reset: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  currentStep: 1,
  currentPoemIndex: 0,
  poems: [],

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_STEPS) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  nextPoem: () => {
    const { currentPoemIndex, poems } = get();
    if (currentPoemIndex < poems.length - 1) {
      set({ currentPoemIndex: currentPoemIndex + 1, currentStep: 1 });
      return true;
    }
    return false;
  },

  setPoems: (poems: Poem[]) => {
    set({ poems, currentPoemIndex: 0, currentStep: 1 });
  },

  reset: () => {
    set({ currentStep: 1, currentPoemIndex: 0, poems: [] });
  },
}));
