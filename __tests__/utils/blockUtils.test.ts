import {
  generateBlocks,
  BLOCKS,
  getBlockByRangeKey,
  generateEightGroups,
  generateTwentyGroups,
  type Block,
  type EightGroup,
  type TwentyGroup,
} from '@/utils/blockUtils';

describe('generateBlocks', () => {
  let blocks: Block[];

  beforeEach(() => {
    blocks = generateBlocks();
  });

  describe('正常系', () => {
    it('25ブロックを生成する', () => {
      expect(blocks).toHaveLength(25);
    });

    it('ブロックidが1から25まで連番になっている', () => {
      blocks.forEach((block, i) => {
        expect(block.id).toBe(i + 1);
      });
    });

    it('最初のブロックはid=1、from=1、to=4', () => {
      expect(blocks[0]).toMatchObject({ id: 1, from: 1, to: 4 });
    });

    it('最後のブロックはid=25、from=97、to=100', () => {
      expect(blocks[24]).toMatchObject({ id: 25, from: 97, to: 100 });
    });

    it('各ブロックのfromとtoの差が3（4首ずつ）', () => {
      blocks.forEach((block) => {
        expect(block.to - block.from).toBe(3);
      });
    });

    it('連続するブロックが重複なく繋がっている', () => {
      for (let i = 0; i < blocks.length - 1; i++) {
        expect(blocks[i + 1].from).toBe(blocks[i].to + 1);
      }
    });

    it('labelが正しいフォーマット（例: "1〜4首"）', () => {
      expect(blocks[0].label).toBe('1〜4首');
      expect(blocks[1].label).toBe('5〜8首');
      expect(blocks[24].label).toBe('97〜100首');
    });

    it('rangeKeyが正しいフォーマット（例: "1-4"）', () => {
      expect(blocks[0].rangeKey).toBe('1-4');
      expect(blocks[1].rangeKey).toBe('5-8');
      expect(blocks[24].rangeKey).toBe('97-100');
    });
  });
});

describe('BLOCKS（定数）', () => {
  it('generateBlocks()と同じ結果である', () => {
    expect(BLOCKS).toEqual(generateBlocks());
  });

  it('25要素持つ', () => {
    expect(BLOCKS).toHaveLength(25);
  });
});

describe('getBlockByRangeKey', () => {
  describe('正常系', () => {
    it('"1-4"で最初のブロックを取得できる', () => {
      const block = getBlockByRangeKey('1-4');
      expect(block).toBeDefined();
      expect(block?.id).toBe(1);
      expect(block?.from).toBe(1);
      expect(block?.to).toBe(4);
    });

    it('"97-100"で最後のブロックを取得できる', () => {
      const block = getBlockByRangeKey('97-100');
      expect(block).toBeDefined();
      expect(block?.id).toBe(25);
    });

    it('"49-52"で13番目のブロックを取得できる', () => {
      const block = getBlockByRangeKey('49-52');
      expect(block).toBeDefined();
      expect(block?.from).toBe(49);
      expect(block?.to).toBe(52);
    });
  });

  describe('異常系', () => {
    it('存在しないrangeKeyはundefinedを返す', () => {
      expect(getBlockByRangeKey('0-4')).toBeUndefined();
    });

    it('空文字はundefinedを返す', () => {
      expect(getBlockByRangeKey('')).toBeUndefined();
    });

    it('形式が異なる文字列はundefinedを返す', () => {
      expect(getBlockByRangeKey('1_4')).toBeUndefined();
      expect(getBlockByRangeKey('1to4')).toBeUndefined();
    });

    it('数値が正しくてもフォーマットが違えばundefinedを返す', () => {
      expect(getBlockByRangeKey('01-04')).toBeUndefined();
    });
  });
});

describe('generateEightGroups', () => {
  let groups: EightGroup[];

  beforeEach(() => {
    groups = generateEightGroups();
  });

  describe('正常系', () => {
    it('13グループを生成する', () => {
      expect(groups).toHaveLength(13);
    });

    it('グループidが1から13まで連番', () => {
      groups.forEach((g, i) => {
        expect(g.id).toBe(i + 1);
      });
    });

    it('最初のグループはfrom=1、to=8', () => {
      expect(groups[0]).toMatchObject({ id: 1, from: 1, to: 8 });
    });

    it('最後のグループはfrom=97、to=100', () => {
      expect(groups[12]).toMatchObject({ id: 13, from: 97, to: 100 });
    });

    it('最後のグループのtoが100を超えない', () => {
      groups.forEach((g) => {
        expect(g.to).toBeLessThanOrEqual(100);
      });
    });

    it('labelが正しいフォーマット（例: "1〜8首"）', () => {
      expect(groups[0].label).toBe('1〜8首');
      expect(groups[12].label).toBe('97〜100首');
    });

    it('rangeKeyが正しいフォーマット（例: "1-8"）', () => {
      expect(groups[0].rangeKey).toBe('1-8');
      expect(groups[12].rangeKey).toBe('97-100');
    });
  });
});

describe('generateTwentyGroups', () => {
  let groups: TwentyGroup[];

  beforeEach(() => {
    groups = generateTwentyGroups();
  });

  describe('正常系', () => {
    it('5グループを生成する', () => {
      expect(groups).toHaveLength(5);
    });

    it('グループidが1から5まで連番', () => {
      groups.forEach((g, i) => {
        expect(g.id).toBe(i + 1);
      });
    });

    it('最初のグループはfrom=1、to=20', () => {
      expect(groups[0]).toMatchObject({ id: 1, from: 1, to: 20 });
    });

    it('最後のグループはfrom=81、to=100', () => {
      expect(groups[4]).toMatchObject({ id: 5, from: 81, to: 100 });
    });

    it('各グループのfromとtoの差が19（20首ずつ）', () => {
      groups.forEach((g) => {
        expect(g.to - g.from).toBe(19);
      });
    });

    it('連続するグループが重複なく繋がっている', () => {
      for (let i = 0; i < groups.length - 1; i++) {
        expect(groups[i + 1].from).toBe(groups[i].to + 1);
      }
    });

    it('labelが正しいフォーマット（例: "1〜20首"）', () => {
      expect(groups[0].label).toBe('1〜20首');
      expect(groups[4].label).toBe('81〜100首');
    });

    it('rangeKeyが正しいフォーマット（例: "1-20"）', () => {
      expect(groups[0].rangeKey).toBe('1-20');
      expect(groups[4].rangeKey).toBe('81-100');
    });
  });
});
