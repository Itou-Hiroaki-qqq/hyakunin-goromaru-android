import { act } from 'react';
import { useBattleStore, type BattleQuestion } from '@/stores/battleStore';
import { BATTLE_DIFFICULTIES } from '@/constants/study';
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

function createBattleQuestion(correctIndex: number): BattleQuestion {
  const poems = [createPoem(1), createPoem(2), createPoem(3), createPoem(4)];
  return {
    poem: poems[correctIndex],
    options: poems,
    correctIndex,
  };
}

const sampleQuestions: BattleQuestion[] = [
  createBattleQuestion(0),
  createBattleQuestion(2),
  createBattleQuestion(1),
];

beforeEach(() => {
  act(() => {
    useBattleStore.getState().reset();
  });
});

describe('battleStore 初期状態', () => {
  it('difficultyがBEGINNER', () => {
    expect(useBattleStore.getState().difficulty).toBe('BEGINNER');
  });

  it('questionCountが20', () => {
    expect(useBattleStore.getState().questionCount).toBe(20);
  });

  it('questionsが空配列', () => {
    expect(useBattleStore.getState().questions).toEqual([]);
  });

  it('currentIndexが0', () => {
    expect(useBattleStore.getState().currentIndex).toBe(0);
  });

  it('playerScoreが0', () => {
    expect(useBattleStore.getState().playerScore).toBe(0);
  });

  it('aiScoreが0', () => {
    expect(useBattleStore.getState().aiScore).toBe(0);
  });

  it('isPlayingがfalse', () => {
    expect(useBattleStore.getState().isPlaying).toBe(false);
  });

  it('isFinishedがfalse', () => {
    expect(useBattleStore.getState().isFinished).toBe(false);
  });

  it('answeredがfalse', () => {
    expect(useBattleStore.getState().answered).toBe(false);
  });

  it('selectedIndexがnull', () => {
    expect(useBattleStore.getState().selectedIndex).toBeNull();
  });

  it('timeLeftがBEGINNERのaiTimeSeconds', () => {
    expect(useBattleStore.getState().timeLeft).toBe(BATTLE_DIFFICULTIES.BEGINNER.aiTimeSeconds);
  });
});

describe('setConfig', () => {
  it('難易度をINTERMEDIATEに変更できる', () => {
    act(() => {
      useBattleStore.getState().setConfig('INTERMEDIATE', 40);
    });
    expect(useBattleStore.getState().difficulty).toBe('INTERMEDIATE');
    expect(useBattleStore.getState().questionCount).toBe(40);
  });

  it('難易度をADVANCEDに変更するとtimeLeftが更新される', () => {
    act(() => {
      useBattleStore.getState().setConfig('ADVANCED', 20);
    });
    expect(useBattleStore.getState().timeLeft).toBe(BATTLE_DIFFICULTIES.ADVANCED.aiTimeSeconds);
  });

  it('各難易度のtimeLeftが正しい値に設定される', () => {
    act(() => {
      useBattleStore.getState().setConfig('BEGINNER', 20);
    });
    expect(useBattleStore.getState().timeLeft).toBe(4);

    act(() => {
      useBattleStore.getState().setConfig('INTERMEDIATE', 20);
    });
    expect(useBattleStore.getState().timeLeft).toBe(2);

    act(() => {
      useBattleStore.getState().setConfig('ADVANCED', 20);
    });
    expect(useBattleStore.getState().timeLeft).toBe(0.5);
  });
});

describe('setQuestions', () => {
  it('問題をセットするとquestionsが更新される', () => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
    });
    expect(useBattleStore.getState().questions).toEqual(sampleQuestions);
  });

  it('問題をセットするとcurrentIndexが0になる', () => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
    });
    expect(useBattleStore.getState().currentIndex).toBe(0);
  });
});

describe('start', () => {
  beforeEach(() => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
    });
  });

  it('startするとisPlayingがtrueになる', () => {
    act(() => {
      useBattleStore.getState().start();
    });
    expect(useBattleStore.getState().isPlaying).toBe(true);
  });

  it('startするとisFinishedがfalseになる', () => {
    act(() => {
      useBattleStore.getState().finish();
      useBattleStore.getState().start();
    });
    expect(useBattleStore.getState().isFinished).toBe(false);
  });

  it('startするとスコアがリセットされる', () => {
    act(() => {
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
      useBattleStore.getState().start();
    });
    expect(useBattleStore.getState().playerScore).toBe(0);
    expect(useBattleStore.getState().aiScore).toBe(0);
  });

  it('startするとcurrentIndexが0にリセットされる', () => {
    act(() => {
      useBattleStore.getState().nextQuestion();
      useBattleStore.getState().start();
    });
    expect(useBattleStore.getState().currentIndex).toBe(0);
  });

  it('startするとtimeLeftが難易度のaiTimeSecondsに設定される', () => {
    act(() => {
      useBattleStore.getState().setConfig('INTERMEDIATE', 20);
      useBattleStore.getState().start();
    });
    expect(useBattleStore.getState().timeLeft).toBe(BATTLE_DIFFICULTIES.INTERMEDIATE.aiTimeSeconds);
  });
});

describe('answer（プレイヤー回答）', () => {
  beforeEach(() => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
      useBattleStore.getState().start();
    });
  });

  it('正解インデックスを渡すとtrueを返す', () => {
    let result: boolean = false;
    act(() => {
      result = useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(result).toBe(true);
  });

  it('正解するとplayerScoreが1増加する', () => {
    act(() => {
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(useBattleStore.getState().playerScore).toBe(1);
  });

  it('不正解のときplayerScoreは増えない', () => {
    const wrongIndex = (sampleQuestions[0].correctIndex + 1) % 4;
    act(() => {
      useBattleStore.getState().answer(wrongIndex);
    });
    expect(useBattleStore.getState().playerScore).toBe(0);
  });

  it('回答するとansweredがtrueになる', () => {
    act(() => {
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
    });
    expect(useBattleStore.getState().answered).toBe(true);
  });

  it('回答するとselectedIndexが更新される', () => {
    const correctIndex = sampleQuestions[0].correctIndex;
    act(() => {
      useBattleStore.getState().answer(correctIndex);
    });
    expect(useBattleStore.getState().selectedIndex).toBe(correctIndex);
  });

  it('問題が存在しないとき（questions=[]）はfalseを返す', () => {
    let result: boolean = true;
    act(() => {
      useBattleStore.getState().reset();
      result = useBattleStore.getState().answer(0);
    });
    expect(result).toBe(false);
  });
});

describe('aiAnswer', () => {
  beforeEach(() => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
      useBattleStore.getState().start();
    });
  });

  it('aiAnswerを呼ぶとaiScoreが1増加する', () => {
    act(() => {
      useBattleStore.getState().aiAnswer();
    });
    expect(useBattleStore.getState().aiScore).toBe(1);
  });

  it('aiAnswerを呼ぶとansweredがtrueになる', () => {
    act(() => {
      useBattleStore.getState().aiAnswer();
    });
    expect(useBattleStore.getState().answered).toBe(true);
  });
});

describe('tick（タイマー更新）', () => {
  beforeEach(() => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
      useBattleStore.getState().setConfig('BEGINNER', 20); // timeLeft = 4
      useBattleStore.getState().start();
    });
  });

  it('tickを呼ぶとtimeLeftが減少する', () => {
    act(() => {
      useBattleStore.getState().tick(1);
    });
    expect(useBattleStore.getState().timeLeft).toBe(3);
  });

  it('timeLeftが0以下になったらAIが回答する', () => {
    act(() => {
      useBattleStore.getState().tick(5); // 4秒以上のdeltaで0以下に
    });
    expect(useBattleStore.getState().aiScore).toBe(1);
    expect(useBattleStore.getState().answered).toBe(true);
  });

  it('timeLeftは0未満にならない', () => {
    act(() => {
      useBattleStore.getState().tick(100);
    });
    // AI回答後はanswered=trueになるので、tickは効果なし
    // 実際のtimeLeftはaiAnswer呼び出し時点で確定しないが、
    // tick内でMath.max(0, ...)が保証されている
    expect(useBattleStore.getState().timeLeft).toBeGreaterThanOrEqual(0);
  });

  it('答え済みのときtickを呼んでもtimeLeftは変わらない', () => {
    act(() => {
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
      const timeLeftBefore = useBattleStore.getState().timeLeft;
      useBattleStore.getState().tick(1);
      // answeredがtrueなのでtickは何もしない
      expect(useBattleStore.getState().timeLeft).toBe(timeLeftBefore);
    });
  });

  it('小数点のデルタでも正確に減算される', () => {
    act(() => {
      useBattleStore.getState().tick(0.5);
    });
    expect(useBattleStore.getState().timeLeft).toBeCloseTo(3.5, 5);
  });
});

describe('nextQuestion', () => {
  beforeEach(() => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
      useBattleStore.getState().start();
    });
  });

  it('次の問題がある場合 true を返す', () => {
    let result: boolean = false;
    act(() => {
      result = useBattleStore.getState().nextQuestion();
    });
    expect(result).toBe(true);
  });

  it('次の問題に進むとcurrentIndexが1増加する', () => {
    act(() => {
      useBattleStore.getState().nextQuestion();
    });
    expect(useBattleStore.getState().currentIndex).toBe(1);
  });

  it('次の問題に進むとansweredがfalseにリセットされる', () => {
    act(() => {
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
      useBattleStore.getState().nextQuestion();
    });
    expect(useBattleStore.getState().answered).toBe(false);
  });

  it('次の問題に進むとselectedIndexがnullにリセットされる', () => {
    act(() => {
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
      useBattleStore.getState().nextQuestion();
    });
    expect(useBattleStore.getState().selectedIndex).toBeNull();
  });

  it('次の問題に進むとtimeLeftが難易度のaiTimeSecondsにリセットされる', () => {
    act(() => {
      useBattleStore.getState().tick(2);
      useBattleStore.getState().nextQuestion();
    });
    expect(useBattleStore.getState().timeLeft).toBe(BATTLE_DIFFICULTIES.BEGINNER.aiTimeSeconds);
  });

  it('最後の問題でnextQuestionを呼ぶと false を返す', () => {
    let result: boolean = true;
    act(() => {
      useBattleStore.getState().nextQuestion();
      useBattleStore.getState().nextQuestion();
      result = useBattleStore.getState().nextQuestion();
    });
    expect(result).toBe(false);
  });
});

describe('finish', () => {
  it('finishするとisPlayingがfalseになる', () => {
    act(() => {
      useBattleStore.getState().start();
      useBattleStore.getState().finish();
    });
    expect(useBattleStore.getState().isPlaying).toBe(false);
  });

  it('finishするとisFinishedがtrueになる', () => {
    act(() => {
      useBattleStore.getState().start();
      useBattleStore.getState().finish();
    });
    expect(useBattleStore.getState().isFinished).toBe(true);
  });
});

describe('reset', () => {
  it('全ての状態が初期値に戻る', () => {
    act(() => {
      useBattleStore.getState().setQuestions(sampleQuestions);
      useBattleStore.getState().start();
      useBattleStore.getState().answer(sampleQuestions[0].correctIndex);
      useBattleStore.getState().nextQuestion();
      useBattleStore.getState().finish();
      useBattleStore.getState().reset();
    });
    const state = useBattleStore.getState();
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.playerScore).toBe(0);
    expect(state.aiScore).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.isFinished).toBe(false);
    expect(state.answered).toBe(false);
    expect(state.selectedIndex).toBeNull();
  });
});

describe('難易度ごとのAI応答時間', () => {
  it('BEGINNER: aiTimeSeconds = 4', () => {
    expect(BATTLE_DIFFICULTIES.BEGINNER.aiTimeSeconds).toBe(4);
  });

  it('INTERMEDIATE: aiTimeSeconds = 2', () => {
    expect(BATTLE_DIFFICULTIES.INTERMEDIATE.aiTimeSeconds).toBe(2);
  });

  it('ADVANCED: aiTimeSeconds = 0.5', () => {
    expect(BATTLE_DIFFICULTIES.ADVANCED.aiTimeSeconds).toBe(0.5);
  });
});
