import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBattleStore } from '@/stores/battleStore';
import Header from '@/components/layout/Header';
import { COLORS, BATTLE_DIFFICULTIES, BATTLE_QUESTION_COUNTS, type BattleDifficultyKey } from '@/constants/study';

/**
 * Battle設定画面（難易度・問題数の選択）
 */
export default function BattleIndexScreen() {
  const router = useRouter();
  const { setConfig } = useBattleStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<BattleDifficultyKey>('BEGINNER');
  const [selectedCount, setSelectedCount] = useState(20);

  const handleStart = () => {
    setConfig(selectedDifficulty, selectedCount);
    router.push('/battle/play');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="コンピューター対戦" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>難易度</Text>
        <View style={styles.optionGroup}>
          {(Object.entries(BATTLE_DIFFICULTIES) as Array<[BattleDifficultyKey, typeof BATTLE_DIFFICULTIES[BattleDifficultyKey]]>).map(
            ([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  selectedDifficulty === key && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedDifficulty(key)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    selectedDifficulty === key && styles.optionButtonTextSelected,
                  ]}
                >
                  {config.label}
                </Text>
                <Text
                  style={[
                    styles.optionButtonSub,
                    selectedDifficulty === key && styles.optionButtonSubSelected,
                  ]}
                >
                  AI回答: {config.aiTimeSeconds}秒
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        <Text style={styles.sectionTitle}>問題数</Text>
        <View style={styles.countGroup}>
          {BATTLE_QUESTION_COUNTS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.countButton,
                selectedCount === count && styles.countButtonSelected,
              ]}
              onPress={() => setSelectedCount(count)}
            >
              <Text
                style={[
                  styles.countButtonText,
                  selectedCount === count && styles.countButtonTextSelected,
                ]}
              >
                {count}問
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {BATTLE_DIFFICULTIES[selectedDifficulty].label} ・ {selectedCount}問
          </Text>
          <Text style={styles.summarySubText}>
            AI回答時間: {BATTLE_DIFFICULTIES[selectedDifficulty].aiTimeSeconds}秒以内に答えよう！
          </Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>対戦スタート 🎮</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  optionGroup: { gap: 8 },
  optionButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  optionButtonSelected: { borderColor: COLORS.primary, backgroundColor: '#fff7ed' },
  optionButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  optionButtonTextSelected: { color: COLORS.primary },
  optionButtonSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  optionButtonSubSelected: { color: COLORS.primaryDark },
  countGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  countButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
  },
  countButtonSelected: { borderColor: COLORS.primary, backgroundColor: '#fff7ed' },
  countButtonText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  countButtonTextSelected: { color: COLORS.primary },
  summary: {
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  summarySubText: { fontSize: 13, color: COLORS.textSecondary },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: { color: COLORS.surface, fontSize: 18, fontWeight: '700' },
});
