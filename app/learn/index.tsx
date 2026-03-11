import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTestClears } from '@/api/testClears';
import Header from '@/components/layout/Header';
import StarBadge from '@/components/ui/StarBadge';
import { BLOCKS } from '@/utils/blockUtils';
import { COLORS } from '@/constants/study';

/**
 * 学習トップ画面（25ブロック一覧）
 */
export default function LearnIndexScreen() {
  const router = useRouter();
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  const { data: testClears = [] } = useQuery({
    queryKey: ['testClears'],
    queryFn: getTestClears,
    staleTime: 5 * 60 * 1000,
  });

  // ブロックのクリア状況を確認する
  const isBlockCleared = (rangeKey: string): boolean => {
    return testClears.some(
      (c) => c.range_key === rangeKey && c.test_type === '4首',
    );
  };

  const handleToggleBlock = (blockId: number) => {
    setExpandedBlock((prev) => (prev === blockId ? null : blockId));
  };

  const renderBlock = ({ item }: { item: (typeof BLOCKS)[0] }) => {
    const isExpanded = expandedBlock === item.id;
    const cleared = isBlockCleared(item.rangeKey);

    return (
      <View style={styles.blockContainer}>
        <TouchableOpacity
          style={styles.blockHeader}
          onPress={() => handleToggleBlock(item.id)}
          activeOpacity={0.8}
        >
          <StarBadge cleared={cleared} size={22} />
          <Text style={styles.blockTitle}>
            第{item.id}ブロック {item.label}
          </Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.blockActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/learn/${item.rangeKey}/study`)}
            >
              <Text style={styles.actionButtonText}>📚 Study</Text>
              <Text style={styles.actionSubtext}>6ステップで覚える</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.testButton]}
              onPress={() => router.push(`/learn/${item.rangeKey}/test`)}
            >
              <Text style={styles.actionButtonText}>✏️ Test</Text>
              <Text style={styles.actionSubtext}>4択クイズ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="学習" showBack />
      <FlatList
        data={BLOCKS}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBlock}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              25ブロック × 4首で百人一首をマスターしよう
            </Text>
            <TouchableOpacity
              style={styles.allTestButton}
              onPress={() => router.push('/learn/all-test')}
            >
              <Text style={styles.allTestButtonText}>100首テストに挑戦 🏆</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  listHeader: {
    marginBottom: 16,
    gap: 10,
  },
  listHeaderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  allTestButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  allTestButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  blockContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  blockTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  blockActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fffbf0',
  },
  testButton: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
