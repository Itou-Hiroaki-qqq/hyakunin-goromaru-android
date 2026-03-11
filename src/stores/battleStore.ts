import { create } from 'zustand';
import { BATTLE_DIFFICULTIES, type BattleDifficultyKey } from '@/constants/study';
import type { Poem } from '@/types/poem';

export interface BattleQuestion {
  poem: Poem;
  options: Poem[];
  correctIndex: number;
}

interface BattleState {
  difficulty: BattleDifficultyKey;
  questionCount: number;
  questions: BattleQuestion[];
  currentIndex: number;
  playerScore: number;
  aiScore: number;
  timeLeft: number;       // 現在の問題の残り時間（秒）
  isPlaying: boolean;
  isFinished: boolean;
  answered: boolean;
  selectedIndex: number | null;
  setConfig: (difficulty: BattleDifficultyKey, questionCount: number) => void;
  setQuestions: (questions: BattleQuestion[]) => void;
  start: () => void;
  answer: (selectedIndex: number) => boolean;  // 正解かどうかを返す
  aiAnswer: () => void;   // AI回答（時間切れ）
  tick: (delta: number) => void;  // タイマー更新（秒）
  nextQuestion: () => boolean;
  finish: () => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  difficulty: 'BEGINNER',
  questionCount: 20,
  questions: [],
  currentIndex: 0,
  playerScore: 0,
  aiScore: 0,
  timeLeft: BATTLE_DIFFICULTIES.BEGINNER.aiTimeSeconds,
  isPlaying: false,
  isFinished: false,
  answered: false,
  selectedIndex: null,

  setConfig: (difficulty: BattleDifficultyKey, questionCount: number) => {
    set({
      difficulty,
      questionCount,
      timeLeft: BATTLE_DIFFICULTIES[difficulty].aiTimeSeconds,
    });
  },

  setQuestions: (questions: BattleQuestion[]) => {
    set({ questions, currentIndex: 0 });
  },

  start: () => {
    const { difficulty } = get();
    set({
      isPlaying: true,
      isFinished: false,
      playerScore: 0,
      aiScore: 0,
      currentIndex: 0,
      answered: false,
      selectedIndex: null,
      timeLeft: BATTLE_DIFFICULTIES[difficulty].aiTimeSeconds,
    });
  },

  answer: (selectedIndex: number) => {
    const { questions, currentIndex, playerScore } = get();
    const question = questions[currentIndex];
    if (!question) return false;

    const isCorrect = selectedIndex === question.correctIndex;
    set({
      answered: true,
      selectedIndex,
      playerScore: isCorrect ? playerScore + 1 : playerScore,
    });
    return isCorrect;
  },

  aiAnswer: () => {
    const { aiScore } = get();
    set({ answered: true, aiScore: aiScore + 1 });
  },

  tick: (delta: number) => {
    const { timeLeft, answered } = get();
    if (answered) return;

    const newTime = Math.max(0, timeLeft - delta);
    if (newTime <= 0) {
      get().aiAnswer();
    } else {
      set({ timeLeft: newTime });
    }
  },

  nextQuestion: () => {
    const { currentIndex, questions, difficulty } = get();
    if (currentIndex < questions.length - 1) {
      set({
        currentIndex: currentIndex + 1,
        answered: false,
        selectedIndex: null,
        timeLeft: BATTLE_DIFFICULTIES[difficulty].aiTimeSeconds,
      });
      return true;
    }
    return false;
  },

  finish: () => {
    set({ isPlaying: false, isFinished: true });
  },

  reset: () => {
    const { difficulty } = get();
    set({
      questions: [],
      currentIndex: 0,
      playerScore: 0,
      aiScore: 0,
      timeLeft: BATTLE_DIFFICULTIES[difficulty].aiTimeSeconds,
      isPlaying: false,
      isFinished: false,
      answered: false,
      selectedIndex: null,
    });
  },
}));
