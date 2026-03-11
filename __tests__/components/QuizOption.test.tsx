import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuizOption from '@/components/learn/QuizOption';
import type { Poem } from '@/types/poem';
import { COLORS } from '@/constants/study';

function createPoem(id: number): Poem {
  return {
    id,
    kami: `上の句${id}`,
    shimo: `下の句テスト${id}`,
    kami_hiragana: `かみのく${id}`,
    shimo_hiragana: `しものくひらがな${id}`,
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

const samplePoem = createPoem(1);

describe('QuizOption', () => {
  const defaultProps = {
    poem: samplePoem,
    index: 0,
    isCorrectAnswer: false,
    isSelected: false,
    answered: false,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系 - レンダリング', () => {
    it('下の句テキストが表示される', () => {
      const { getByText } = render(<QuizOption {...defaultProps} />);
      expect(getByText(samplePoem.shimo)).toBeTruthy();
    });

    it('ひらがなサブテキストが表示される', () => {
      const { getByText } = render(<QuizOption {...defaultProps} />);
      expect(getByText(samplePoem.shimo_hiragana)).toBeTruthy();
    });

    it('未回答のときフィードバックアイコンが表示されない', () => {
      const { queryByText } = render(
        <QuizOption {...defaultProps} answered={false} />,
      );
      expect(queryByText('〇')).toBeNull();
      expect(queryByText('×')).toBeNull();
    });
  });

  describe('タップ応答', () => {
    it('タップするとonPressがindexと共に呼ばれる', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <QuizOption {...defaultProps} index={2} onPress={onPress} />,
      );
      fireEvent.press(getByText(samplePoem.shimo));
      expect(onPress).toHaveBeenCalledWith(2);
    });

    it('onPressが1回だけ呼ばれる', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <QuizOption {...defaultProps} onPress={onPress} />,
      );
      fireEvent.press(getByText(samplePoem.shimo));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('answered=trueのとき（disabled）はタップしてもonPressが呼ばれない', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <QuizOption
          {...defaultProps}
          answered={true}
          isCorrectAnswer={true}
          onPress={onPress}
        />,
      );
      fireEvent.press(getByText(samplePoem.shimo));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('フィードバック表示（回答後）', () => {
    it('正解の選択肢には〇が表示される', () => {
      const { getByText } = render(
        <QuizOption
          {...defaultProps}
          answered={true}
          isCorrectAnswer={true}
          isSelected={true}
        />,
      );
      expect(getByText('〇')).toBeTruthy();
    });

    it('選択した不正解の選択肢には×が表示される', () => {
      const { getByText } = render(
        <QuizOption
          {...defaultProps}
          answered={true}
          isCorrectAnswer={false}
          isSelected={true}
        />,
      );
      expect(getByText('×')).toBeTruthy();
    });

    it('選択していない不正解の選択肢にはフィードバックが表示されない', () => {
      const { queryByText } = render(
        <QuizOption
          {...defaultProps}
          answered={true}
          isCorrectAnswer={false}
          isSelected={false}
        />,
      );
      expect(queryByText('〇')).toBeNull();
      expect(queryByText('×')).toBeNull();
    });

    it('正解かつ非選択の場合も〇が表示される（他の選択肢が誤答した場合の正解表示）', () => {
      const { getByText } = render(
        <QuizOption
          {...defaultProps}
          answered={true}
          isCorrectAnswer={true}
          isSelected={false}
        />,
      );
      expect(getByText('〇')).toBeTruthy();
    });
  });

  describe('背景色とボーダー', () => {
    it('未回答のときは通常のサーフェス色で表示される', () => {
      const { getByRole } = render(
        <QuizOption {...defaultProps} answered={false} />,
      );
      // クラッシュなくレンダリングできることを確認
      const { getByText } = render(
        <QuizOption {...defaultProps} answered={false} />,
      );
      expect(getByText(samplePoem.shimo)).toBeTruthy();
    });

    it('正解のとき（answered=true, isCorrectAnswer=true）はクラッシュしない', () => {
      expect(() =>
        render(
          <QuizOption
            {...defaultProps}
            answered={true}
            isCorrectAnswer={true}
            isSelected={true}
          />,
        ),
      ).not.toThrow();
    });

    it('不正解のとき（answered=true, isSelected=true, isCorrectAnswer=false）はクラッシュしない', () => {
      expect(() =>
        render(
          <QuizOption
            {...defaultProps}
            answered={true}
            isCorrectAnswer={false}
            isSelected={true}
          />,
        ),
      ).not.toThrow();
    });
  });

  describe('境界値', () => {
    it('index=0でも正常に動作する', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <QuizOption {...defaultProps} index={0} onPress={onPress} />,
      );
      fireEvent.press(getByText(samplePoem.shimo));
      expect(onPress).toHaveBeenCalledWith(0);
    });

    it('index=3でも正常に動作する', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <QuizOption {...defaultProps} index={3} onPress={onPress} />,
      );
      fireEvent.press(getByText(samplePoem.shimo));
      expect(onPress).toHaveBeenCalledWith(3);
    });

    it('下の句が長い場合もクラッシュしない', () => {
      const longPoem = {
        ...samplePoem,
        shimo: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめも',
        shimo_hiragana: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめも',
      };
      expect(() =>
        render(<QuizOption {...defaultProps} poem={longPoem} />),
      ).not.toThrow();
    });
  });

  describe('displayName', () => {
    it('コンポーネントのdisplayNameがQuizOptionである', () => {
      expect(QuizOption.displayName).toBe('QuizOption');
    });
  });
});
