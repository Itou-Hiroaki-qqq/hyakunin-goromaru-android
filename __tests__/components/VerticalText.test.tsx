import React from 'react';
import { render } from '@testing-library/react-native';
import VerticalText from '@/components/ui/VerticalText';

describe('VerticalText', () => {
  describe('正常系 - 基本レンダリング', () => {
    it('テキストが文字単位で分割されてレンダリングされる', () => {
      const { getAllByText } = render(<VerticalText lines={['あいう']} />);
      expect(getAllByText('あ')).toHaveLength(1);
      expect(getAllByText('い')).toHaveLength(1);
      expect(getAllByText('う')).toHaveLength(1);
    });

    it('空配列を渡してもクラッシュしない', () => {
      expect(() => render(<VerticalText lines={[]} />)).not.toThrow();
    });

    it('1文字のテキストでもレンダリングできる', () => {
      const { getByText } = render(<VerticalText lines={['あ']} />);
      expect(getByText('あ')).toBeTruthy();
    });
  });

  describe('正常系 - 複数行', () => {
    it('複数行配列で行ごとにレンダリングされる', () => {
      const { getAllByText } = render(<VerticalText lines={['あいう', 'えお']} />);
      expect(getAllByText('あ')).toHaveLength(1);
      expect(getAllByText('え')).toHaveLength(1);
    });

    it('1行のみでもレンダリングできる', () => {
      const { getAllByText } = render(<VerticalText lines={['あいうえお']} />);
      expect(getAllByText('あ')).toHaveLength(1);
    });
  });

  describe('ハイライト - highlightRange', () => {
    it('highlightRangeを指定しない場合、全文字がデフォルト色でレンダリングされる', () => {
      const { getAllByText } = render(<VerticalText lines={['あいう']} />);
      expect(getAllByText('あ')).toHaveLength(1);
      expect(getAllByText('い')).toHaveLength(1);
      expect(getAllByText('う')).toHaveLength(1);
    });

    it('highlightRangeを指定してもクラッシュしない', () => {
      expect(() =>
        render(
          <VerticalText
            lines={['あいうえお']}
            highlightRange={{ start: 1, length: 2 }}
          />,
        ),
      ).not.toThrow();
    });

    it('range外の文字はハイライトされない（start=0, length=0）', () => {
      expect(() =>
        render(
          <VerticalText
            lines={['あいう']}
            highlightRange={{ start: 0, length: 0 }}
          />,
        ),
      ).not.toThrow();
    });

    it('カスタムhighlightColorを渡せる', () => {
      expect(() =>
        render(
          <VerticalText
            lines={['あいう']}
            highlightRange={{ start: 0, length: 1 }}
            highlightColor="#ff0000"
          />,
        ),
      ).not.toThrow();
    });
  });

  describe('フォントサイズ', () => {
    it('fontSizeを指定してもクラッシュしない', () => {
      expect(() => render(<VerticalText lines={['あ']} fontSize={30} />)).not.toThrow();
    });

    it('デフォルトのfontSize(22)でレンダリングできる', () => {
      expect(() => render(<VerticalText lines={['あ']} />)).not.toThrow();
    });
  });

  describe('境界値', () => {
    it('長い文字列（100文字）でもクラッシュしない', () => {
      const longText = 'あ'.repeat(100);
      expect(() => render(<VerticalText lines={[longText]} />)).not.toThrow();
    });

    it('highlightRangeが文字列の長さを超えても安全', () => {
      expect(() =>
        render(
          <VerticalText
            lines={['あ']}
            highlightRange={{ start: 0, length: 100 }}
          />,
        ),
      ).not.toThrow();
    });

    it('日本語文字（漢字・カタカナ混在）でもレンダリングできる', () => {
      expect(() => render(<VerticalText lines={['春の曙アイウ']} />)).not.toThrow();
    });

    it('記号・絵文字を含む文字列でもクラッシュしない', () => {
      expect(() => render(<VerticalText lines={['〇×△！']} />)).not.toThrow();
    });
  });

  describe('displayName', () => {
    it('コンポーネントのdisplayNameがVerticalTextである', () => {
      expect(VerticalText.displayName).toBe('VerticalText');
    });
  });
});
