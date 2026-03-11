import { act } from 'react';
import { useStudyStore } from '@/stores/studyStore';
import { TOTAL_STEPS } from '@/constants/study';
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

const samplePoems: Poem[] = [createPoem(1), createPoem(2), createPoem(3), createPoem(4)];

// 各テスト前にストアをリセット
beforeEach(() => {
  act(() => {
    useStudyStore.getState().reset();
  });
});

describe('studyStore 初期状態', () => {
  it('currentStepが1', () => {
    expect(useStudyStore.getState().currentStep).toBe(1);
  });

  it('currentPoemIndexが0', () => {
    expect(useStudyStore.getState().currentPoemIndex).toBe(0);
  });

  it('poemsが空配列', () => {
    expect(useStudyStore.getState().poems).toEqual([]);
  });
});

describe('setPoems', () => {
  it('首をセットするとpoemsが更新される', () => {
    act(() => {
      useStudyStore.getState().setPoems(samplePoems);
    });
    expect(useStudyStore.getState().poems).toEqual(samplePoems);
  });

  it('首をセットするとcurrentPoemIndexが0にリセットされる', () => {
    act(() => {
      useStudyStore.getState().setPoems(samplePoems);
      // 手動でインデックスを進める
      useStudyStore.getState().nextPoem();
      // 再セット
      useStudyStore.getState().setPoems(samplePoems);
    });
    expect(useStudyStore.getState().currentPoemIndex).toBe(0);
  });

  it('首をセットするとcurrentStepが1にリセットされる', () => {
    act(() => {
      useStudyStore.getState().setPoems(samplePoems);
      useStudyStore.getState().nextStep();
      useStudyStore.getState().nextStep();
      useStudyStore.getState().setPoems(samplePoems);
    });
    expect(useStudyStore.getState().currentStep).toBe(1);
  });
});

describe('nextStep', () => {
  describe('正常系', () => {
    it('ステップが1増加する', () => {
      act(() => {
        useStudyStore.getState().nextStep();
      });
      expect(useStudyStore.getState().currentStep).toBe(2);
    });

    it('TOTAL_STEPSまで進む', () => {
      act(() => {
        for (let i = 1; i < TOTAL_STEPS; i++) {
          useStudyStore.getState().nextStep();
        }
      });
      expect(useStudyStore.getState().currentStep).toBe(TOTAL_STEPS);
    });
  });

  describe('境界値', () => {
    it('TOTAL_STEPSに達したらそれ以上増えない', () => {
      act(() => {
        // TOTAL_STEPSを超えて呼ぶ
        for (let i = 0; i < TOTAL_STEPS + 5; i++) {
          useStudyStore.getState().nextStep();
        }
      });
      expect(useStudyStore.getState().currentStep).toBe(TOTAL_STEPS);
    });
  });
});

describe('prevStep', () => {
  describe('正常系', () => {
    it('ステップが1減少する', () => {
      act(() => {
        useStudyStore.getState().nextStep();
        useStudyStore.getState().prevStep();
      });
      expect(useStudyStore.getState().currentStep).toBe(1);
    });

    it('step=3からprevStepするとstep=2になる', () => {
      act(() => {
        useStudyStore.getState().nextStep();
        useStudyStore.getState().nextStep();
        useStudyStore.getState().prevStep();
      });
      expect(useStudyStore.getState().currentStep).toBe(2);
    });
  });

  describe('境界値', () => {
    it('step=1のときはそれ以上減らない', () => {
      act(() => {
        useStudyStore.getState().prevStep();
        useStudyStore.getState().prevStep();
      });
      expect(useStudyStore.getState().currentStep).toBe(1);
    });
  });
});

describe('nextPoem', () => {
  beforeEach(() => {
    act(() => {
      useStudyStore.getState().setPoems(samplePoems);
    });
  });

  describe('正常系', () => {
    it('次の首がある場合 true を返す', () => {
      let result: boolean = false;
      act(() => {
        result = useStudyStore.getState().nextPoem();
      });
      expect(result).toBe(true);
    });

    it('次の首に進むとcurrentPoemIndexが1増加する', () => {
      act(() => {
        useStudyStore.getState().nextPoem();
      });
      expect(useStudyStore.getState().currentPoemIndex).toBe(1);
    });

    it('次の首に進むとcurrentStepが1にリセットされる', () => {
      act(() => {
        useStudyStore.getState().nextStep();
        useStudyStore.getState().nextStep();
        useStudyStore.getState().nextPoem();
      });
      expect(useStudyStore.getState().currentStep).toBe(1);
    });
  });

  describe('境界値', () => {
    it('最後の首でnextPoemを呼ぶと false を返す', () => {
      let result: boolean = true;
      act(() => {
        // 3回進めて最後(index=3)へ
        useStudyStore.getState().nextPoem();
        useStudyStore.getState().nextPoem();
        useStudyStore.getState().nextPoem();
        // これ以上進めない
        result = useStudyStore.getState().nextPoem();
      });
      expect(result).toBe(false);
    });

    it('最後の首でnextPoemを呼んでもcurrentPoemIndexは変わらない', () => {
      act(() => {
        useStudyStore.getState().nextPoem();
        useStudyStore.getState().nextPoem();
        useStudyStore.getState().nextPoem();
        useStudyStore.getState().nextPoem(); // 最後で呼ぶ
      });
      expect(useStudyStore.getState().currentPoemIndex).toBe(3); // 最後のインデックス
    });

    it('poems が空のとき nextPoem は false を返す', () => {
      act(() => {
        useStudyStore.getState().reset();
      });
      let result: boolean = true;
      act(() => {
        result = useStudyStore.getState().nextPoem();
      });
      expect(result).toBe(false);
    });
  });
});

describe('reset', () => {
  it('全ての状態が初期値に戻る', () => {
    act(() => {
      useStudyStore.getState().setPoems(samplePoems);
      useStudyStore.getState().nextStep();
      useStudyStore.getState().nextPoem();
      useStudyStore.getState().reset();
    });
    const state = useStudyStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.currentPoemIndex).toBe(0);
    expect(state.poems).toEqual([]);
  });
});

describe('TOTAL_STEPS定数との一致', () => {
  it('TOTAL_STEPSは6である', () => {
    expect(TOTAL_STEPS).toBe(6);
  });
});
