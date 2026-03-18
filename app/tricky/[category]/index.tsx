import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import { KAMI_TRICKY_SETS, SHIMO_TRICKY_SETS } from '@/data/tricky-questions';
import { getTestClears } from '@/api/testClears';
import StarBadge from '@/components/ui/StarBadge';

/**
 * 間違えやすい問題 セット一覧画面
 * category='kami' or 'shimo' に応じたセットリストを表示
 */
export default function TrickyCategoryIndexScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const isKami = category === 'kami';

  const sets = isKami ? KAMI_TRICKY_SETS : SHIMO_TRICKY_SETS;
  const title = isKami ? '上の句がまぎらわしい' : '下の句がまぎらわしい';
  const questionDesc = isKami
    ? '下の句を見て上の句を当てる'
    : '上の句を見て下の句を当てる';

  // 全セットの問題数（各セットの句ID数の合計）
  const totalQuestionCount = sets.reduce((sum, set) => sum + set.poemIds.length, 0);

  const { data: testClears = [] } = useQuery({
    queryKey: ['testClears'],
    queryFn: getTestClears,
    staleTime: 5 * 60 * 1000,
  });

  const trickyType = isKami ? 'tricky_kami' : 'tricky_shimo';

  const isSetCleared = (setIdStr: string): boolean => {
    return testClears.some(
      (c) => c.test_type === trickyType && c.range_key === setIdStr,
    );
  };

  const isSummaryCleared = testClears.some(
    (c) => c.test_type === trickyType && c.range_key === 'all',
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={title} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>{questionDesc}</Text>

        {/* まとめテストボタン */}
        <TouchableOpacity
          style={styles.summaryButton}
          onPress={() =>
            router.push(
              `/tricky/${category}/test?setId=all` as Parameters<typeof router.push>[0],
            )
          }
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StarBadge cleared={isSummaryCleared} size={18} />
            <Text style={styles.summaryButtonText}>
              まとめテスト（全{totalQuestionCount}問）
            </Text>
          </View>
        </TouchableOpacity>

        {sets.map((set) => (
          <TouchableOpacity
            key={set.id}
            style={styles.card}
            onPress={() =>
              router.push(
                `/tricky/${category}/test?setId=${set.id}` as Parameters<typeof router.push>[0],
              )
            }
            activeOpacity={0.8}
          >
            <View style={styles.cardText}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StarBadge cleared={isSetCleared(set.id)} size={18} />
                <Text style={styles.setLabel}>セット {set.id}</Text>
              </View>
              <Text style={styles.poemIds}>
                {set.poemIds.length}首の組み合わせ（#
                {set.poemIds.join(' / #')}）
              </Text>
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
  content: { padding: 16, gap: 8, paddingBottom: 60 },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  summaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  cardText: { flex: 1 },
  setLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  poemIds: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 22, color: COLORS.textSecondary },
});
