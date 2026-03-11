import { shuffle, generateQuizQuestion, generateQuizQuestions, getPoemsByRange } from '@/utils/poemUtils';
import type { Poem } from '@/types/poem';

// テスト用のダミーPoem生成ヘルパー
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

// 100首分のダミーデータ生成
const allPoems: Poem[] = Array.from({ length: 100 }, (_, i) => createPoem(i + 1));

describe('shuffle', () => {
  describe('正常系', () => {
    it('配列の長さが変わらない', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result).toHaveLength(input.length);
    });

    it('元の配列を変更しない（コピーを返す）', () => {
      const input = [1, 2, 3, 4, 5];
      const original = [...input];
      shuffle(input);
      expect(input).toEqual(original);
    });

    it('元の要素が全て含まれる', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result.sort()).toEqual(input.sort());
    });

    it('文字列配列もシャッフルできる', () => {
      const input = ['a', 'b', 'c', 'd'];
      const result = shuffle(input);
      expect(result).toHaveLength(4);
      expect(result.sort()).toEqual(input.sort());
    });

    it('オブジェクト配列もシャッフルできる', () => {
      const poems = [createPoem(1), createPoem(2), createPoem(3)];
      const result = shuffle(poems);
      expect(result).toHaveLength(3);
      const ids = result.map((p) => p.id).sort();
      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe('境界値', () => {
    it('空配列を渡すと空配列を返す', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('要素が1つの配列は同じ要素を返す', () => {
      expect(shuffle([42])).toEqual([42]);
    });

    it('要素が2つの配列も正常に動作する', () => {
      const input = [1, 2];
      const result = shuffle(input);
      expect(result).toHaveLength(2);
      expect(result.sort()).toEqual([1, 2]);
    });
  });

  describe('統計的シャッフル検証', () => {
    it('同じ配列を複数回シャッフルすると異なる順序が生まれる可能性がある', () => {
      // 10回シャッフルして、少なくとも1回は異なる順序になることを確認
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        results.add(JSON.stringify(shuffle(input)));
      }
      // 10回のうち少なくとも2種類以上の順序が生まれるはず
      expect(results.size).toBeGreaterThan(1);
    });
  });
});

describe('generateQuizQuestion', () => {
  describe('正常系', () => {
    it('4つの選択肢を持つQuizQuestionを返す', () => {
      const correctPoem = allPoems[0];
      const result = generateQuizQuestion(correctPoem, allPoems);
      expect(result.options).toHaveLength(4);
    });

    it('返されたoptionsに正解の首が含まれる', () => {
      const correctPoem = allPoems[0];
      const result = generateQuizQuestion(correctPoem, allPoems);
      const hasCorrect = result.options.some((p) => p.id === correctPoem.id);
      expect(hasCorrect).toBe(true);
    });

    it('correctIndexが正しい位置を指している', () => {
      const correctPoem = allPoems[0];
      const result = generateQuizQuestion(correctPoem, allPoems);
      expect(result.options[result.correctIndex].id).toBe(correctPoem.id);
    });

    it('correctIndexは0から3の範囲内', () => {
      const correctPoem = allPoems[0];
      const result = generateQuizQuestion(correctPoem, allPoems);
      expect(result.correctIndex).toBeGreaterThanOrEqual(0);
      expect(result.correctIndex).toBeLessThanOrEqual(3);
    });

    it('poem フィールドが正解の首と一致する', () => {
      const correctPoem = allPoems[5];
      const result = generateQuizQuestion(correctPoem, allPoems);
      expect(result.poem.id).toBe(correctPoem.id);
    });

    it('選択肢に重複がない（全て異なるidを持つ）', () => {
      const correctPoem = allPoems[0];
      const result = generateQuizQuestion(correctPoem, allPoems);
      const ids = result.options.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });
  });

  describe('境界値', () => {
    it('4首しかない場合でも動作する（正解＋残り3首）', () => {
      const fourPoems = allPoems.slice(0, 4);
      const result = generateQuizQuestion(fourPoems[0], fourPoems);
      expect(result.options).toHaveLength(4);
    });

    it('最後の首（id=100）でも正常に動作する', () => {
      const lastPoem = allPoems[99];
      const result = generateQuizQuestion(lastPoem, allPoems);
      expect(result.options).toHaveLength(4);
      expect(result.options[result.correctIndex].id).toBe(100);
    });
  });
});

describe('generateQuizQuestions', () => {
  describe('正常系', () => {
    it('渡した首の数だけQuizQuestionを生成する', () => {
      const poems = allPoems.slice(0, 5);
      const result = generateQuizQuestions(poems, allPoems);
      expect(result).toHaveLength(5);
    });

    it('各QuizQuestionのpoemが対応する首と一致する', () => {
      const poems = allPoems.slice(0, 3);
      const result = generateQuizQuestions(poems, allPoems);
      result.forEach((q, i) => {
        expect(q.poem.id).toBe(poems[i].id);
      });
    });
  });

  describe('境界値', () => {
    it('空配列を渡すと空配列を返す', () => {
      const result = generateQuizQuestions([], allPoems);
      expect(result).toEqual([]);
    });

    it('1首だけの配列でも動作する', () => {
      const result = generateQuizQuestions([allPoems[0]], allPoems);
      expect(result).toHaveLength(1);
    });

    it('100首全てを渡しても動作する', () => {
      const result = generateQuizQuestions(allPoems, allPoems);
      expect(result).toHaveLength(100);
    });
  });
});

describe('getPoemsByRange', () => {
  describe('正常系', () => {
    it('fromからtoの範囲のPoemを取得する', () => {
      const result = getPoemsByRange(allPoems, 1, 4);
      expect(result).toHaveLength(4);
      expect(result[0].id).toBe(1);
      expect(result[3].id).toBe(4);
    });

    it('中間の範囲も正しく取得する', () => {
      const result = getPoemsByRange(allPoems, 5, 8);
      expect(result).toHaveLength(4);
      result.forEach((p, i) => {
        expect(p.id).toBe(5 + i);
      });
    });

    it('from と to が同じ値の場合、1首だけ返す', () => {
      const result = getPoemsByRange(allPoems, 50, 50);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(50);
    });

    it('最後の範囲（97-100）を取得できる', () => {
      const result = getPoemsByRange(allPoems, 97, 100);
      expect(result).toHaveLength(4);
      expect(result[result.length - 1].id).toBe(100);
    });
  });

  describe('境界値', () => {
    it('fromがtoより大きい場合は空配列を返す', () => {
      const result = getPoemsByRange(allPoems, 10, 5);
      expect(result).toEqual([]);
    });

    it('範囲外のfromを指定すると空配列を返す', () => {
      const result = getPoemsByRange(allPoems, 200, 300);
      expect(result).toEqual([]);
    });

    it('空配列を渡すと空配列を返す', () => {
      const result = getPoemsByRange([], 1, 4);
      expect(result).toEqual([]);
    });

    it('from=1 から to=100 で全首を取得できる', () => {
      const result = getPoemsByRange(allPoems, 1, 100);
      expect(result).toHaveLength(100);
    });
  });
});
