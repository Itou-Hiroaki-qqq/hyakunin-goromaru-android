import {
  calculateAccuracy,
  isTestCleared,
  getBattleResult,
  formatScore,
  type BattleResult,
} from '@/utils/scoreUtils';

describe('calculateAccuracy', () => {
  describe('正常系', () => {
    it('全問正解の場合は100を返す', () => {
      expect(calculateAccuracy(10, 10)).toBe(100);
    });

    it('全問不正解の場合は0を返す', () => {
      expect(calculateAccuracy(0, 10)).toBe(0);
    });

    it('半分正解の場合は50を返す', () => {
      expect(calculateAccuracy(5, 10)).toBe(50);
    });

    it('1/3正解（切り捨て/四捨五入）の計算', () => {
      // 1/3 ≈ 0.3333... → Math.round(33.33) = 33
      expect(calculateAccuracy(1, 3)).toBe(33);
    });

    it('2/3正解の計算', () => {
      // 2/3 ≈ 0.6666... → Math.round(66.66) = 67
      expect(calculateAccuracy(2, 3)).toBe(67);
    });

    it('1/4 = 25%', () => {
      expect(calculateAccuracy(1, 4)).toBe(25);
    });

    it('3/4 = 75%', () => {
      expect(calculateAccuracy(3, 4)).toBe(75);
    });

    it('大きな数値でも正確に計算する', () => {
      expect(calculateAccuracy(99, 100)).toBe(99);
    });
  });

  describe('境界値', () => {
    it('total=0のとき0を返す（ゼロ除算回避）', () => {
      expect(calculateAccuracy(0, 0)).toBe(0);
    });

    it('total=1でcorrect=0のとき0を返す', () => {
      expect(calculateAccuracy(0, 1)).toBe(0);
    });

    it('total=1でcorrect=1のとき100を返す', () => {
      expect(calculateAccuracy(1, 1)).toBe(100);
    });
  });
});

describe('isTestCleared', () => {
  describe('正常系', () => {
    it('全問正解のとき true を返す', () => {
      expect(isTestCleared(10, 10)).toBe(true);
    });

    it('1問でも不正解のとき false を返す', () => {
      expect(isTestCleared(9, 10)).toBe(false);
    });

    it('全問不正解のとき false を返す', () => {
      expect(isTestCleared(0, 10)).toBe(false);
    });

    it('4問全問正解（ブロックテスト相当）', () => {
      expect(isTestCleared(4, 4)).toBe(true);
    });

    it('100問全問正解', () => {
      expect(isTestCleared(100, 100)).toBe(true);
    });
  });

  describe('境界値', () => {
    it('total=0のとき false を返す（問題がない場合はクリアにならない）', () => {
      expect(isTestCleared(0, 0)).toBe(false);
    });

    it('total=1でcorrect=1のとき true', () => {
      expect(isTestCleared(1, 1)).toBe(true);
    });

    it('total=1でcorrect=0のとき false', () => {
      expect(isTestCleared(0, 1)).toBe(false);
    });
  });
});

describe('getBattleResult', () => {
  describe('正常系', () => {
    it('プレイヤースコアが高い場合 "win" を返す', () => {
      expect(getBattleResult(5, 3)).toBe('win');
    });

    it('プレイヤースコアが低い場合 "lose" を返す', () => {
      expect(getBattleResult(3, 5)).toBe('lose');
    });

    it('スコアが同じ場合 "draw" を返す', () => {
      expect(getBattleResult(5, 5)).toBe('draw');
    });

    it('どちらも0のとき "draw" を返す', () => {
      expect(getBattleResult(0, 0)).toBe('draw');
    });

    it('プレイヤーが1問のみ正解でAIが0問のとき "win"', () => {
      expect(getBattleResult(1, 0)).toBe('win');
    });

    it('プレイヤーが0問正解でAIが1問のとき "lose"', () => {
      expect(getBattleResult(0, 1)).toBe('lose');
    });
  });

  describe('境界値', () => {
    it('大きなスコア差でも正しく判定する', () => {
      expect(getBattleResult(100, 0)).toBe('win');
      expect(getBattleResult(0, 100)).toBe('lose');
    });

    it('スコア差が1でも正しく判定する', () => {
      expect(getBattleResult(10, 9)).toBe('win');
      expect(getBattleResult(9, 10)).toBe('lose');
    });
  });

  describe('型チェック', () => {
    it('戻り値の型がBattleResult（"win" | "lose" | "draw"）のどれかである', () => {
      const validResults: BattleResult[] = ['win', 'lose', 'draw'];
      const result = getBattleResult(5, 3);
      expect(validResults).toContain(result);
    });
  });
});

describe('formatScore', () => {
  describe('正常系', () => {
    it('"correct / total" 形式の文字列を返す', () => {
      expect(formatScore(7, 10)).toBe('7 / 10');
    });

    it('0問正解のフォーマット', () => {
      expect(formatScore(0, 10)).toBe('0 / 10');
    });

    it('全問正解のフォーマット', () => {
      expect(formatScore(10, 10)).toBe('10 / 10');
    });

    it('100問のフォーマット', () => {
      expect(formatScore(98, 100)).toBe('98 / 100');
    });
  });

  describe('境界値', () => {
    it('0問0問のフォーマット', () => {
      expect(formatScore(0, 0)).toBe('0 / 0');
    });

    it('1問1問のフォーマット', () => {
      expect(formatScore(1, 1)).toBe('1 / 1');
    });
  });
});
