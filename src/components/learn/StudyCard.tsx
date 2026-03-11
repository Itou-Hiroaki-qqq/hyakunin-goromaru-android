import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PoemCard from '@/components/ui/PoemCard';
import TypewriterText from '@/components/ui/TypewriterText';
import GoroText from '@/components/ui/GoroText';
import AudioButton from '@/components/ui/AudioButton';
import { COLORS } from '@/constants/study';
import type { Poem } from '@/types/poem';

interface StudyCardProps {
  poem: Poem;
  step: number;
  isPlaying: boolean;
  onPlayAudio: (url: string) => void;
}

/**
 * Studyモード用カードコンポーネント
 * ステップに応じてコンテンツを切り替えて表示する
 */
const StudyCard = memo(({ poem, step, isPlaying, onPlayAudio }: StudyCardProps) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* ステップ1: 上の句（漢字）表示 */}
      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.stepLabel}>上の句</Text>
          <View style={styles.cardRow}>
            <PoemCard poem={poem} showKamiOnly fontSize={24} />
            <AudioButton
              onPress={() => onPlayAudio(poem.kami_audio_url)}
              isPlaying={isPlaying}
              size={48}
            />
          </View>
        </View>
      )}

      {/* ステップ2: 上の句（ひらがな）逐字表示 */}
      {step === 2 && (
        <View style={styles.section}>
          <Text style={styles.stepLabel}>上の句（ひらがな）</Text>
          <View style={styles.hiraganaContainer}>
            <TypewriterText text={poem.kami_hiragana} fontSize={20} />
          </View>
        </View>
      )}

      {/* ステップ3: 下の句表示 */}
      {step === 3 && (
        <View style={styles.section}>
          <Text style={styles.stepLabel}>下の句</Text>
          <View style={styles.cardRow}>
            <PoemCard poem={poem} fontSize={22} />
            <AudioButton
              onPress={() => onPlayAudio(poem.shimo_audio_url)}
              isPlaying={isPlaying}
              size={48}
            />
          </View>
        </View>
      )}

      {/* ステップ4: 語呂（上）音声 + 解説 */}
      {step === 4 && (
        <View style={styles.section}>
          <Text style={styles.stepLabel}>語呂合わせ（上の句）</Text>
          <View style={styles.goroContainer}>
            <GoroText text={poem.kami_goro} fontSize={18} />
            <AudioButton
              onPress={() => onPlayAudio(poem.kami_goro_audio_url)}
              isPlaying={isPlaying}
              size={44}
              style={styles.audioButtonMargin}
            />
          </View>
          <Text style={styles.kaisetsu}>{poem.goro_kaisetsu}</Text>
        </View>
      )}

      {/* ステップ5: 語呂（下）音声 + 解説 */}
      {step === 5 && (
        <View style={styles.section}>
          <Text style={styles.stepLabel}>語呂合わせ（下の句）</Text>
          <View style={styles.goroContainer}>
            <GoroText text={poem.shimo_goro} fontSize={18} />
            <AudioButton
              onPress={() => onPlayAudio(poem.shimo_goro_audio_url)}
              isPlaying={isPlaying}
              size={44}
              style={styles.audioButtonMargin}
            />
          </View>
        </View>
      )}

      {/* ステップ6: 語呂まとめ */}
      {step === 6 && (
        <View style={styles.section}>
          <Text style={styles.stepLabel}>語呂合わせ まとめ</Text>
          <View style={styles.goroContainer}>
            <GoroText text={poem.kami_goro} fontSize={16} />
          </View>
          <View style={[styles.goroContainer, { marginTop: 8 }]}>
            <GoroText text={poem.shimo_goro} fontSize={16} />
          </View>
          <Text style={styles.kaisetsu}>{poem.goro_kaisetsu}</Text>
        </View>
      )}
    </ScrollView>
  );
});

StudyCard.displayName = 'StudyCard';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  stepLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hiraganaContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goroContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  kaisetsu: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    width: '100%',
    backgroundColor: '#fffbf0',
    padding: 12,
    borderRadius: 8,
  },
  audioButtonMargin: {
    marginLeft: 8,
  },
});

export default StudyCard;
