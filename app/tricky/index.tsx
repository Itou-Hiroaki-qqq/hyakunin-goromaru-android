import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';

interface TrickyCategory {
  key: string;
  title: string;
  description: string;
  emoji: string;
}

const CATEGORIES: TrickyCategory[] = [
  {
    key: 'kami',
    title: '上の句',
    description: '似た上の句を持つ和歌を識別する',
    emoji: '📜',
  },
  {
    key: 'shimo',
    title: '下の句',
    description: '似た下の句を持つ和歌を識別する',
    emoji: '📝',
  },
];

/**
 * Trickyトップ画面（上の句/下の句カテゴリ選択）
 */
export default function TrickyIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="間違えやすい問題" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          紛らわしい句を集中的に練習して、正確に覚えよう！
        </Text>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={styles.card}
            onPress={() => router.push(`/tricky/${cat.key}/test`)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardEmoji}>{cat.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.cardDesc}>{cat.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12 },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    gap: 12,
  },
  cardEmoji: { fontSize: 36 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 24, color: COLORS.textSecondary },
});
