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
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { KAMI_TRICKY_SETS, SHIMO_TRICKY_SETS } from '@/data/tricky-questions';
import { getTestClears } from '@/api/testClears';
import StarBadge from '@/components/ui/StarBadge';

interface TrickyCategory {
  key: string;
  title: string;
  description: string;
  setCount: number;
}

const CATEGORIES: TrickyCategory[] = [
  {
    key: 'kami',
    title: '上の句がまぎらわしい',
    description: '下の句を見て、正しい上の句を当てる',
    setCount: KAMI_TRICKY_SETS.length,
  },
  {
    key: 'shimo',
    title: '下の句がまぎらわしい',
    description: '上の句を見て、正しい下の句を当てる',
    setCount: SHIMO_TRICKY_SETS.length,
  },
];

/**
 * 間違えやすい問題 トップ画面
 * 「上の句がまぎらわしい」「下の句がまぎらわしい」のカテゴリ選択
 */
export default function TrickyIndexScreen() {
  const router = useRouter();

  const { data: testClears = [] } = useQuery({
    queryKey: ['testClears'],
    queryFn: getTestClears,
    staleTime: 5 * 60 * 1000,
  });

  // カテゴリ内の全セットがクリアされているか（まとめテストクリアで判定）
  const isCategoryCleared = (key: string): boolean => {
    const trickyType = key === 'kami' ? 'tricky_kami' : 'tricky_shimo';
    return testClears.some(
      (c) => c.test_type === trickyType && c.range_key === 'all',
    );
  };

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
            onPress={() =>
              router.push(`/tricky/${cat.key}` as Parameters<typeof router.push>[0])
            }
            activeOpacity={0.8}
          >
            <View style={styles.cardText}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StarBadge cleared={isCategoryCleared(cat.key)} size={20} />
                <Text style={styles.cardTitle}>{cat.title}</Text>
              </View>
              <Text style={styles.cardDesc}>{cat.description}</Text>
              <Text style={styles.cardCount}>{cat.setCount}セット</Text>
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
  content: { padding: 16, gap: 12, paddingBottom: 60 },
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
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  cardCount: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  arrow: { fontSize: 24, color: COLORS.textSecondary },
});
