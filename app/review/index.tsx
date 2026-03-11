import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReview } from '@/hooks/useReview';
import { useAllPoems } from '@/hooks/usePoems';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';
import type { ReviewItem } from '@/services/reviewDatabase';

/**
 * 復習一覧画面（間隔反復スケジュール表示）
 */
export default function ReviewIndexScreen() {
  const router = useRouter();
  const { items, dueItems, isLoading, removeItem } = useReview();
  const { data: allPoems } = useAllPoems();

  const getPoemById = (id: number) => allPoems?.find((p) => p.id === id);

  const handleRemove = (poemId: number) => {
    Alert.alert(
      '復習リストから削除',
      'この首を復習リストから削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeItem(poemId),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ReviewItem }) => {
    const poem = getPoemById(item.poem_id);
    const isDue = dueItems.some((d) => d.poem_id === item.poem_id);
    const nextDate = new Date(item.next_review_at);
    const isToday = nextDate <= new Date();

    return (
      <View style={[styles.item, isDue && styles.itemDue]}>
        <View style={styles.itemContent}>
          <Text style={styles.itemId}>#{item.poem_id}</Text>
          <View style={styles.itemText}>
            {poem && (
              <>
                <Text style={styles.itemKami} numberOfLines={1}>{poem.kami}</Text>
                <Text style={styles.itemShimo} numberOfLines={1}>{poem.shimo}</Text>
              </>
            )}
            <Text style={[styles.itemDate, isToday && styles.itemDateDue]}>
              {isToday ? '今日復習！' : `次回: ${nextDate.toLocaleDateString('ja-JP')}`}
            </Text>
            <Text style={styles.errorCount}>エラー回数: {item.error_count}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.poem_id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="復習" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="復習" showBack />

      {dueItems.length > 0 && (
        <TouchableOpacity
          style={styles.reviewBanner}
          onPress={() => router.push('/review/study')}
        >
          <Text style={styles.reviewBannerText}>
            {dueItems.length}首の復習があります → 今すぐ復習
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.poem_id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>復習リストは空です</Text>
            <Text style={styles.emptyDesc}>
              テストで間違えた問題が自動で追加されます
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reviewBanner: {
    backgroundColor: COLORS.primary,
    padding: 14,
    alignItems: 'center',
  },
  reviewBannerText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },
  list: { padding: 12, gap: 8 },
  item: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  itemDue: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: '#fff7ed' },
  itemContent: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemId: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, minWidth: 28 },
  itemText: { flex: 1 },
  itemKami: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  itemShimo: { fontSize: 13, color: COLORS.textSecondary },
  itemDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  itemDateDue: { color: COLORS.primary, fontWeight: '700' },
  errorCount: { fontSize: 11, color: COLORS.textSecondary },
  removeButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { fontSize: 16, color: '#9ca3af' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
