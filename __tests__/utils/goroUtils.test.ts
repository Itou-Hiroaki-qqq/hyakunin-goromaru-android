import { goroToSearch, findGoroRange } from '@/utils/goroUtils';

// ────────────────────────────────────────────────
// goroToSearch
// ────────────────────────────────────────────────
describe('goroToSearch', () => {
  describe('正常系', () => {
    it('～がない語呂はそのまま返す', () => {
      expect(goroToSearch('あきた')).toBe('あきた');
    });

    it('語呂の～を除去する', () => {
      expect(goroToSearch('あ～き～た')).toBe('あきた');
    });

    it('複数の～を全て除去する', () => {
      expect(goroToSearch('む～す～め～')).toBe('むすめ');
    });

    it('先頭・末尾の空白をトリムする', () => {
      expect(goroToSearch('  あきた  ')).toBe('あきた');
    });

    it('～と空白が混在しても正しく処理する', () => {
      expect(goroToSearch('  あ～き  ')).toBe('あき');
    });
  });

  describe('異常系', () => {
    it('空文字を渡すと空文字を返す', () => {
      expect(goroToSearch('')).toBe('');
    });

    it('～のみを渡すと空文字を返す', () => {
      expect(goroToSearch('～')).toBe('');
    });

    it('スペースのみを渡すと空文字を返す', () => {
      expect(goroToSearch('   ')).toBe('');
    });
  });

  describe('エッジケース', () => {
    it('漢字・カタカナが含まれても動作する', () => {
      expect(goroToSearch('春～花')).toBe('春花');
    });

    it('連続する～を除去する', () => {
      expect(goroToSearch('あ～～～い')).toBe('あい');
    });
  });
});

// ────────────────────────────────────────────────
// findGoroRange
// ────────────────────────────────────────────────
describe('findGoroRange', () => {
  describe('正常系 — 直接一致', () => {
    it('語呂がひらがなテキストの先頭に一致する', () => {
      const result = findGoroRange('あきのたの', 'あきの');
      expect(result.start).toBe(0);
      expect(result.length).toBe(3);
    });

    it('語呂がひらがなテキストの中間に一致する', () => {
      const result = findGoroRange('あきのたのかりほの', 'かりほの');
      expect(result.start).toBe(5);
      expect(result.length).toBe(4);
    });

    it('語呂がひらがなテキストの末尾に一致する', () => {
      const result = findGoroRange('あきのたの', 'のたの');
      expect(result.start).toBe(2);
      expect(result.length).toBe(3);
    });

    it('テキスト全体に一致する', () => {
      const result = findGoroRange('あきのたの', 'あきのたの');
      expect(result.start).toBe(0);
      expect(result.length).toBe(5);
    });

    it('語呂に～が含まれていても正しく一致する', () => {
      // goroToSearch('あ～き') = 'あき'
      const result = findGoroRange('あきのたの', 'あ～き');
      expect(result.start).toBe(0);
      expect(result.length).toBe(2);
    });
  });

  describe('正常系 — スペースを無視した検索', () => {
    it('ひらがなテキストにスペースが含まれていても一致する', () => {
      const result = findGoroRange('あき のた の', 'あきのたの');
      expect(result.start).toBe(0);
      expect(result.length).toBeGreaterThan(0);
    });

    it('語呂にスペースが含まれていてもひらがなテキストに一致する', () => {
      const result = findGoroRange('あきのたの', 'あきの たの');
      expect(result.start).toBe(0);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('正常系 — 表記ゆれ（正規化）での一致', () => {
    it('ひらがなテキストの「が」を「か」に正規化して一致する', () => {
      // hiragana に「が」、goro に「か」 → 正規化後に一致
      const result = findGoroRange('あがた', 'あかた');
      expect(result.length).toBeGreaterThan(0);
    });

    it('ひらがなテキストの「べ」を「へ」に正規化して一致する', () => {
      const result = findGoroRange('たべる', 'たへる');
      expect(result.length).toBeGreaterThan(0);
    });

    it('ひらがなテキストの「ゐ」を「い」に正規化して一致する', () => {
      const result = findGoroRange('こゐのぼり', 'こいのぼり');
      expect(result.length).toBeGreaterThan(0);
    });

    it('ひらがなテキストの「ゑ」を「え」に正規化して一致する', () => {
      const result = findGoroRange('うゑる', 'うえる');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('異常系', () => {
    it('ひらがなテキストが空のとき {start:0, length:0} を返す', () => {
      const result = findGoroRange('', 'あきの');
      expect(result).toEqual({ start: 0, length: 0 });
    });

    it('語呂が空文字のとき {start:0, length:0} を返す', () => {
      const result = findGoroRange('あきのたの', '');
      expect(result).toEqual({ start: 0, length: 0 });
    });

    it('両方空のとき {start:0, length:0} を返す', () => {
      const result = findGoroRange('', '');
      expect(result).toEqual({ start: 0, length: 0 });
    });

    it('一致しない語呂はフォールバックで先頭1文字を返す', () => {
      // ひらがなテキストが空でなく、マッチしない場合 → {start:0, length:1}
      const result = findGoroRange('あいうえお', 'ざじずぜぞ');
      expect(result).toEqual({ start: 0, length: 1 });
    });
  });

  describe('境界値', () => {
    it('1文字のひらがなテキストと1文字の語呂が一致する', () => {
      const result = findGoroRange('あ', 'あ');
      expect(result.start).toBe(0);
      expect(result.length).toBe(1);
    });

    it('語呂がひらがなテキストより長い場合はフォールバックを返す', () => {
      const result = findGoroRange('あ', 'あいうえおかきく');
      expect(result).toEqual({ start: 0, length: 1 });
    });

    it('語呂が～のみの場合（searchが空になる）は {start:0, length:0} を返す', () => {
      const result = findGoroRange('あいうえお', '～～～');
      expect(result).toEqual({ start: 0, length: 0 });
    });

    it('語呂がひらがなテキストの末尾1文字に一致する', () => {
      const result = findGoroRange('あいうえお', 'お');
      expect(result.start).toBe(4);
      expect(result.length).toBe(1);
    });
  });

  describe('エッジケース', () => {
    it('同一文字が繰り返されるテキストでも正しい先頭位置を返す', () => {
      // 'ああああ' の中の 'ああ' は位置0
      const result = findGoroRange('ああああ', 'ああ');
      expect(result.start).toBe(0);
      expect(result.length).toBe(2);
    });

    it('マルチバイト文字（絵文字なし、長音符など）が含まれても動作する', () => {
      // 長音符はスペースではないので通常検索
      const result = findGoroRange('おーい', 'おー');
      expect(result.start).toBe(0);
      expect(result.length).toBe(2);
    });
  });
});
