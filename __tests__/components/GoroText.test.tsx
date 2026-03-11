import React from 'react';
import { render } from '@testing-library/react-native';
import GoroText from '@/components/ui/GoroText';

describe('GoroText', () => {
  describe('正常系 - ハイライトパース', () => {
    it('[]なしのテキストはそのままレンダリングされる', () => {
      const { getByText } = render(<GoroText text="ふじのたかね" />);
      expect(getByText('ふじのたかね')).toBeTruthy();
    });

    it('[]で囲まれた部分がハイライトテキストとして分割される', () => {
      const { getByText } = render(<GoroText text="[ふじ]のたかね" />);
      // "ふじ"はハイライト部分として分割
      expect(getByText('ふじ')).toBeTruthy();
      // "のたかね"は通常部分
      expect(getByText('のたかね')).toBeTruthy();
    });

    it('複数の[]が含まれる場合、全てのハイライト部分が分割される', () => {
      const { getByText } = render(<GoroText text="[ふじ]の[たかね]" />);
      expect(getByText('ふじ')).toBeTruthy();
      expect(getByText('たかね')).toBeTruthy();
    });

    it('[]が文頭にある場合もパースできる', () => {
      const { getByText } = render(<GoroText text="[あきの]たの" />);
      expect(getByText('あきの')).toBeTruthy();
      expect(getByText('たの')).toBeTruthy();
    });

    it('[]が文末にある場合もパースできる', () => {
      const { getByText } = render(<GoroText text="たの[かりほ]" />);
      expect(getByText('たの')).toBeTruthy();
      expect(getByText('かりほ')).toBeTruthy();
    });

    it('テキスト全体が[]に囲まれている場合', () => {
      const { getByText } = render(<GoroText text="[ふじのたかね]" />);
      expect(getByText('ふじのたかね')).toBeTruthy();
    });
  });

  describe('正常系 - フォントサイズ', () => {
    it('fontSizeを指定してもクラッシュしない', () => {
      expect(() => render(<GoroText text="てすと" fontSize={24} />)).not.toThrow();
    });

    it('デフォルトのfontSize(18)でレンダリングできる', () => {
      expect(() => render(<GoroText text="てすと" />)).not.toThrow();
    });
  });

  describe('境界値', () => {
    it('空文字を渡してもクラッシュしない', () => {
      expect(() => render(<GoroText text="" />)).not.toThrow();
    });

    it('[]だけの文字列でもクラッシュしない', () => {
      expect(() => render(<GoroText text="[]" />)).not.toThrow();
    });

    it('ネストしたブラケット（非対応ケース）でもクラッシュしない', () => {
      expect(() => render(<GoroText text="[外[内]外]" />)).not.toThrow();
    });

    it('閉じブラケットがない場合でもクラッシュしない', () => {
      expect(() => render(<GoroText text="[開いたまま" />)).not.toThrow();
    });

    it('開きブラケットがない場合でもクラッシュしない', () => {
      expect(() => render(<GoroText text="閉じるだけ]" />)).not.toThrow();
    });

    it('長い文字列（100文字）でもクラッシュしない', () => {
      const longText = '[あ'.repeat(20) + ']ずつ'.repeat(20);
      expect(() => render(<GoroText text={longText} />)).not.toThrow();
    });

    it('漢字を含む[]テキストでもクラッシュしない', () => {
      expect(() => render(<GoroText text="[秋の田の]かりほのいほのとまをあらみ" />)).not.toThrow();
    });

    it('英数字を含むテキストでもクラッシュしない', () => {
      expect(() => render(<GoroText text="[ABC]def123" />)).not.toThrow();
    });
  });

  describe('displayName', () => {
    it('コンポーネントのdisplayNameがGoroTextである', () => {
      expect(GoroText.displayName).toBe('GoroText');
    });
  });
});
