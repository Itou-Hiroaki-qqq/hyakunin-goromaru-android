import { getKamiGoroEndSec, KAMI_GORO_END_SEC } from '@/data/goro-timings';

describe('getKamiGoroEndSec', () => {
  describe('正常系 — 定義済みidを返す', () => {
    it('id=1 は 0.4 秒を返す', () => {
      expect(getKamiGoroEndSec(1)).toBe(0.4);
    });

    it('id=100 は 0.8 秒を返す', () => {
      expect(getKamiGoroEndSec(100)).toBe(0.8);
    });

    it('id=27 は 2.2 秒を返す（長めの値）', () => {
      expect(getKamiGoroEndSec(27)).toBe(2.2);
    });

    it('id=94 は 2.9 秒を返す（最大値）', () => {
      expect(getKamiGoroEndSec(94)).toBe(2.9);
    });

    it('id=50 は定義値を返す', () => {
      expect(getKamiGoroEndSec(50)).toBe(KAMI_GORO_END_SEC[50]);
    });
  });

  describe('フォールバック — 未定義idはデフォルト値 2.0 を返す', () => {
    it('id=0 はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(0)).toBe(2.0);
    });

    it('id=-1 はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(-1)).toBe(2.0);
    });

    it('id=101 はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(101)).toBe(2.0);
    });

    it('id=999 はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(999)).toBe(2.0);
    });

    it('id=NaN はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(NaN)).toBe(2.0);
    });
  });

  describe('境界値 — 範囲の境界id', () => {
    it('id=1（最小定義id）は定義値を返す', () => {
      expect(getKamiGoroEndSec(1)).toBe(KAMI_GORO_END_SEC[1]);
    });

    it('id=100（最大定義id）は定義値を返す', () => {
      expect(getKamiGoroEndSec(100)).toBe(KAMI_GORO_END_SEC[100]);
    });

    it('id=1 の直前である id=0 はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(0)).toBe(2.0);
    });

    it('id=100 の直後である id=101 はデフォルト値 2.0 を返す', () => {
      expect(getKamiGoroEndSec(101)).toBe(2.0);
    });
  });

  describe('KAMI_GORO_END_SEC 定数の検証', () => {
    it('1〜100のidが全て定義されている（100エントリ）', () => {
      const keys = Object.keys(KAMI_GORO_END_SEC).map(Number);
      expect(keys).toHaveLength(100);
    });

    it('idが1〜100の連番になっている', () => {
      const keys = Object.keys(KAMI_GORO_END_SEC).map(Number).sort((a, b) => a - b);
      for (let i = 0; i < 100; i++) {
        expect(keys[i]).toBe(i + 1);
      }
    });

    it('全ての値が正の数値である', () => {
      Object.values(KAMI_GORO_END_SEC).forEach((sec) => {
        expect(typeof sec).toBe('number');
        expect(sec).toBeGreaterThan(0);
      });
    });

    it('全ての値が妥当な音声秒数（0超〜10秒以内）である', () => {
      Object.values(KAMI_GORO_END_SEC).forEach((sec) => {
        expect(sec).toBeGreaterThan(0);
        expect(sec).toBeLessThanOrEqual(10);
      });
    });

    it('getKamiGoroEndSec は KAMI_GORO_END_SEC の値と一致する（全100首）', () => {
      for (let id = 1; id <= 100; id++) {
        expect(getKamiGoroEndSec(id)).toBe(KAMI_GORO_END_SEC[id]);
      }
    });
  });
});
