import { act } from 'react';
import { useTestStore, type QuizQuestion } from '@/stores/testStore';
import type { Poem } from '@/types/poem';

function createPoem(id: number): Poem {
  return {
    id,
    kami: `上の句${id}`,
    shimo: `下の句${id}`,
    kami_hiragana: `かみのく${id}`,
    shimo_hiragana: `しものく${id}`,
    kami_tts: `kami_tts_${id}`,
    shimo_tts: `shimo_tts_${id}`,
    kami_goro: `[語呂上${id}]`,
    shimo_goro: `[語呂下${id}]`,
    kami_goro_tts: `kami_goro_tts_${id}`,
    shimo_goro_tts: `shimo_goro_tts_${id}`,
    goro_kaisetsu: `語呂解説${id}`,
    kami_audio_url: `https://example.com/kami_${id}.mp3`,
    shimo_audio_url: `https://example.com/shimo_${id}.mp3`,
    kami_goro_audio_url: `https://example.com/kami_goro_${id}.mp3`,
    shimo_goro_audio_url: `https://example.com/shimo_goro_${id}.mp3`,
  };
}

function createQuizQuestion(correctIndex: number): QuizQuestion {
  const poems = [createPoem(1), createPoem(2), createPoem(3), createPoem(4)];
  return {
    poem: poems[correctIndex],
    options: poems,
    correctIndex,
  };
}

const sampleQuestions: QuizQuestion[] = [
  createQuizQuestion(0),
  createQuizQuestion(2),
  createQuizQuestion(1),
];

beforeEach(() => {
  act(() => {
    useTestStore.getState().reset();
  });
});

describe('testStore 初期状態', () => {
  it('questionsが空配列', () => {
    expect(useTestStore.getState().questions).toEqual([]);
  });

  it('currentIndexが0', () => {
    expect(useTestStore.getState().currentIndex).toBe(0);
  });

  it('scoreが0', () => {
    expect(useTestStore.getState().score).toBe(0);
  });

  it('consecutiveCorrectが0', () => {
    expect(useTestStore.getState().consecutiveCorrect).toBe(0);
  });

  it('bestConsecutiveが0', () => {
    expect(useTestStore.getState().bestConsecutive).toBe(0);
  });

  it('answeredがfalse', () => {
    expect(useTestStore.getState().answered).toBe(false);
  });

  it('selectedIndexがnull', () => {
    expect(useTestStore.getState().selectedIndex).toBeNull();
  });
});

describe('setQuestions', () => {
  it('問題をセットするとquestionsが更新される', () => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
    expect(useTestStore.getState().questions).toEqual(sampleQuestions);
  });

  it('問題をセットするとcurrentIndexが0になる', () => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
    expect(useTestStore.getState().currentIndex).toBe(0);
  });

  it('問題をセットするとansweredがfalseになる', () => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
    expect(useTestStore.getState().answered).toBe(false);
  });

  it('問題をセットするとselectedIndexがnullになる', () => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
    expect(useTestStore.getState().selectedIndex).toBeNull();
  });
});

describe('answer（正解の場合）', () => {
  beforeEach(() => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
  });

  it('正解インデックスを渡すとtrueを返す', () => {
    let result: boolean = false;
    act(() => {
      result = useTestStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(result).toBe(true);
  });

  it('正解するとscoreが1増加する', () => {
    act(() => {
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(useTestStore.getState().score).toBe(1);
  });

  it('正解するとconsecutiveCorrectが1増加する', () => {
    act(() => {
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(useTestStore.getState().consecutiveCorrect).toBe(1);
  });

  it('連続正解するとconsecutiveCorrectが加算される', () => {
    act(() => {
      // 問題1正解
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
      useTestStore.getState().nextQuestion();
      // 問題2正解
      useTestStore.getState().answer(sampleQuestions[1].correctIndex);
    });
    expect(useTestStore.getState().consecutiveCorrect).toBe(2);
  });

  it('正解するとansweredがtrueになる', () => {
    act(() => {
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(useTestStore.getState().answered).toBe(true);
  });

  it('正解するとselectedIndexが更新される', () => {
    const correctIndex = sampleQuestions[0].correctIndex;
    act(() => {
      useTestStore.getState().answer(correctIndex);
    });
    expect(useTestStore.getState().selectedIndex).toBe(correctIndex);
  });

  it('bestConsecutiveが連続正解数の最高値を記録する', () => {
    act(() => {
      // 2連続正解
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
      useTestStore.getState().nextQuestion();
      useTestStore.getState().answer(sampleQuestions[1].correctIndex);
    });
    expect(useTestStore.getState().bestConsecutive).toBe(2);
  });
});

describe('answer（不正解の場合）', () => {
  beforeEach(() => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
  });

  it('不正解インデックスを渡すとfalseを返す', () => {
    let result: boolean = true;
    const wrongIndex = (sampleQuestions[0].correctIndex + 1) % 4;
    act(() => {
      result = useTestStore.getState().answer(wrongIndex);
    });
    expect(result).toBe(false);
  });

  it('不正解のときscoreは増えない', () => {
    const wrongIndex = (sampleQuestions[0].correctIndex + 1) % 4;
    act(() => {
      useTestStore.getState().answer(wrongIndex);
    });
    expect(useTestStore.getState().score).toBe(0);
  });

  it('不正解のときconsecutiveCorrectが0にリセットされる', () => {
    const wrongIndex = (sampleQuestions[0].correctIndex + 1) % 4;
    act(() => {
      // 1問正解してから不正解
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
      useTestStore.getState().nextQuestion();
      useTestStore.getState().answer(wrongIndex);
    });
    expect(useTestStore.getState().consecutiveCorrect).toBe(0);
  });

  it('不正解でもbestConsecutiveは以前の最高値を保持する', () => {
    const wrongIndex = (sampleQuestions[0].correctIndex + 1) % 4;
    act(() => {
      // 1問正解してから不正解
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
      useTestStore.getState().nextQuestion();
      useTestStore.getState().answer(wrongIndex);
    });
    expect(useTestStore.getState().bestConsecutive).toBe(1);
  });
});

describe('answer（エッジケース）', () => {
  it('問題が存在しないとき（questions=[]）はfalseを返す', () => {
    let result: boolean = true;
    act(() => {
      result = useTestStore.getState().answer(0);
    });
    expect(result).toBe(false);
  });
});

describe('nextQuestion', () => {
  beforeEach(() => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
    });
  });

  describe('正常系', () => {
    it('次の問題がある場合 true を返す', () => {
      let result: boolean = false;
      act(() => {
        result = useTestStore.getState().nextQuestion();
      });
      expect(result).toBe(true);
    });

    it('次の問題に進むとcurrentIndexが1増加する', () => {
      act(() => {
        useTestStore.getState().nextQuestion();
      });
      expect(useTestStore.getState().currentIndex).toBe(1);
    });

    it('次の問題に進むとansweredがfalseにリセットされる', () => {
      act(() => {
        useTestStore.getState().answer(sampleQuestions[0].correctIndex);
        useTestStore.getState().nextQuestion();
      });
      expect(useTestStore.getState().answered).toBe(false);
    });

    it('次の問題に進むとselectedIndexがnullにリセットされる', () => {
      act(() => {
        useTestStore.getState().answer(sampleQuestions[0].correctIndex);
        useTestStore.getState().nextQuestion();
      });
      expect(useTestStore.getState().selectedIndex).toBeNull();
    });
  });

  describe('境界値', () => {
    it('最後の問題でnextQuestionを呼ぶと false を返す', () => {
      let result: boolean = true;
      act(() => {
        useTestStore.getState().nextQuestion();
        useTestStore.getState().nextQuestion();
        result = useTestStore.getState().nextQuestion(); // 3問中3問目→次なし
      });
      expect(result).toBe(false);
    });

    it('最後の問題でnextQuestionを呼んでもcurrentIndexは変わらない', () => {
      act(() => {
        useTestStore.getState().nextQuestion();
        useTestStore.getState().nextQuestion();
        useTestStore.getState().nextQuestion();
      });
      expect(useTestStore.getState().currentIndex).toBe(2); // 最後のインデックス
    });
  });
});

describe('reset', () => {
  it('全ての状態が初期値に戻る', () => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
      useTestStore.getState().nextQuestion();
      useTestStore.getState().reset();
    });
    const state = useTestStore.getState();
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.score).toBe(0);
    expect(state.consecutiveCorrect).toBe(0);
    expect(state.bestConsecutive).toBe(0);
    expect(state.answered).toBe(false);
    expect(state.selectedIndex).toBeNull();
  });
});

describe('スコア計算の総合シナリオ', () => {
  it('3問中2問正解でscoreが2になる', () => {
    act(() => {
      useTestStore.getState().setQuestions(sampleQuestions);
      // 問題1: 正解
      useTestStore.getState().answer(sampleQuestions[0].correctIndex);
      useTestStore.getState().nextQuestion();
      // 問題2: 不正解
      const wrongIndex = (sampleQuestions[1].correctIndex + 1) % 4;
      useTestStore.getState().answer(wrongIndex);
      useTestStore.getState().nextQuestion();
      // 問題3: 正解
      useTestStore.getState().answer(sampleQuestions[2].correctIndex);
    });
    expect(useTestStore.getState().score).toBe(2);
    expect(useTestStore.getState().bestConsecutive).toBe(1);
  });
});
