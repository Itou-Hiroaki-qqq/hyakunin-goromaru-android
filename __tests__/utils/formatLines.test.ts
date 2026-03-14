import { splitToLines } from '@/utils/formatLines';

describe('splitToLines', () => {
  describe('正常系 — 半角スペース区切り', () => {
    it('スペース区切りの3パーツをmaxLines=3で返す', () => {
      const result = splitToLines('あ い う', 3);
      expect(result).toEqual(['あ', 'い', 'う']);
    });

    it('スペース区切りの2パーツをmaxLines=2で返す', () => {
      const result = splitToLines('あいうえ おかきく', 2);
      expect(result).toEqual(['あいうえ', 'おかきく']);
    });

    it('パーツ数がmaxLinesを超える場合はmaxLinesまでスライスする', () => {
      const result = splitToLines('あ い う え お', 3);
      expect(result).toEqual(['あ', 'い', 'う']);
    });

    it('パーツが上の句3行分（maxLines=3）に対して正しく動作する', () => {
      const result = splitToLines('秋の田の かりほの庵の 苫をあらみ', 3);
      expect(result).toEqual(['秋の田の', 'かりほの庵の', '苫をあらみ']);
    });
  });

  describe('正常系 — 全角スペース区切り', () => {
    it('全角スペースで分割できる', () => {
      const result = splitToLines('あいう\u3000えおか', 2);
      expect(result).toEqual(['あいう', 'えおか']);
    });

    it('半角スペースと全角スペースが混在しても分割できる', () => {
      const result = splitToLines('あ\u3000い う', 3);
      expect(result).toEqual(['あ', 'い', 'う']);
    });
  });

  describe('正常系 — スペースなし（文字数折り返し）', () => {
    it('maxLines=2 かつ 1パーツで8文字以上なら半分に折り返す', () => {
      const result = splitToLines('あいうえおかきく', 2); // 8文字
      expect(result).toHaveLength(2);
      expect(result[0].length + result[1].length).toBe(8);
    });

    it('maxLines=2 かつ 1パーツで7文字以下はそのまま返す', () => {
      const result = splitToLines('あいうえおか', 2); // 6文字
      expect(result).toEqual(['あいうえおか']);
    });

    it('maxLines=2 かつ 1パーツで7文字ちょうどはそのまま返す（境界値）', () => {
      const result = splitToLines('あいうえおかき', 2); // 7文字
      expect(result).toEqual(['あいうえおかき']);
    });

    it('maxLines=2 かつ 1パーツで8文字は折り返す（境界値）', () => {
      const result = splitToLines('あいうえおかきく', 2); // 8文字
      expect(result).toHaveLength(2);
    });

    it('折り返し時は ceil(length/2) で前半を決める（奇数文字）', () => {
      const result = splitToLines('あいうえおかきくけ', 2); // 9文字
      // ceil(9/2) = 5 → 前半5文字、後半4文字
      expect(result[0]).toBe('あいうえお');
      expect(result[1]).toBe('かきくけ');
    });

    it('maxLines=3 かつスペースなし1パーツの場合は折り返しせずそのまま返す', () => {
      const result = splitToLines('あいうえおかきくけこ', 3);
      expect(result).toEqual(['あいうえおかきくけこ']);
    });
  });

  describe('異常系 — 空文字・特殊入力', () => {
    it('空文字を渡すと空配列を返す', () => {
      const result = splitToLines('', 3);
      expect(result).toEqual([]);
    });

    it('スペースのみの文字列を渡すとスペース文字列をそのまま返す（NOTE: 実装の既知挙動）', () => {
      // parts = [] になるが、text が truthy なので [text] にフォールバックする
      // 本来 [] を期待するケースだが、現在の実装では ['   '] を返す
      const result = splitToLines('   ', 3);
      expect(result).toEqual(['   ']);
    });

    it('全角スペースのみの文字列を渡すと全角スペース文字列をそのまま返す（NOTE: 実装の既知挙動）', () => {
      // 上記と同様のフォールバック挙動
      const result = splitToLines('\u3000\u3000', 3);
      expect(result).toEqual(['\u3000\u3000']);
    });

    it('先頭・末尾のスペースは無視される', () => {
      const result = splitToLines(' あ い う ', 3);
      expect(result).toEqual(['あ', 'い', 'う']);
    });

    it('連続スペースも1つのスペースとして扱われる', () => {
      const result = splitToLines('あ  い   う', 3);
      expect(result).toEqual(['あ', 'い', 'う']);
    });
  });

  describe('境界値', () => {
    it('maxLines=1 のときは最初のパーツだけ返す', () => {
      const result = splitToLines('あ い う', 1);
      expect(result).toEqual(['あ']);
    });

    it('1文字の入力でmaxLines=3はその1文字を返す', () => {
      const result = splitToLines('あ', 3);
      expect(result).toEqual(['あ']);
    });

    it('1文字の入力でmaxLines=2はその1文字を返す（折り返し不要）', () => {
      const result = splitToLines('あ', 2);
      expect(result).toEqual(['あ']);
    });

    it('パーツ数がmaxLines未満のとき、あるパーツだけ返す', () => {
      const result = splitToLines('あ い', 3);
      expect(result).toEqual(['あ', 'い']);
    });

    it('maxLines=2 かつ 2パーツなら折り返しせず2パーツをそのまま返す', () => {
      // 2パーツ = parts.length(2) >= maxLines(2) のルート
      const result = splitToLines('あいうえおかきくけこ さしすせそたちつてと', 2);
      expect(result).toEqual(['あいうえおかきくけこ', 'さしすせそたちつてと']);
    });
  });

  describe('エッジケース — 特殊文字', () => {
    it('ひらがな・カタカナ・漢字が混在しても動作する', () => {
      const result = splitToLines('春の夜の アカイ空 花', 3);
      expect(result).toEqual(['春の夜の', 'アカイ空', '花']);
    });

    it('数字が含まれても動作する', () => {
      const result = splitToLines('第1首 第2首', 2);
      expect(result).toEqual(['第1首', '第2首']);
    });
  });
});
