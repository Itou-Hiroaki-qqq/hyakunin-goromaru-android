import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTestClears } from '@/api/testClears';
import Header from '@/components/layout/Header';
import StarBadge from '@/components/ui/StarBadge';
import { BLOCKS, EIGHT_TEST_BLOCK_IDS, TWENTY_TEST_BLOCKS } from '@/utils/blockUtils';
import { COLORS } from '@/constants/study';

/**
 * ブロックの「8首テスト」用の範囲キーを計算する
 * 例: ブロック2(5-8) → "1-8"、ブロック25(97-100) → "93-100"
 */
function getEightTestRangeKey(blockFrom: number, blockTo: number): string {
  const eightFrom = blockFrom - 4;
  return `${eightFrom}-${blockTo}`;
}

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

  // ブロックのクリア状況を確認する（そのブロックの最後のテストで判定）
  const isBlockCleared = (block: (typeof BLOCKS)[0]): boolean => {
    // 20首テストがあるブロック → 20首クリアで星
    if (TWENTY_TEST_BLOCKS[block.id]) {
      const twenty = TWENTY_TEST_BLOCKS[block.id];
      const rangeKey = `${twenty.from}-${twenty.to}`;
      return testClears.some(
        (c) => c.range_key === rangeKey && c.test_type === '20首',
      );
    }
    // 8首テストがあるブロック → 8首クリアで星
    if (EIGHT_TEST_BLOCK_IDS.has(block.id)) {
      const eightFrom = block.from - 4;
      const rangeKey = `${eightFrom}-${block.to}`;
      return testClears.some(
        (c) => c.range_key === rangeKey && c.test_type === '8首',
      );
    }
    // 4首テストのみ → 4首クリアで星
    return testClears.some(
      (c) => c.range_key === block.rangeKey && c.test_type === '4首',
    );
  };

  const isAllCleared = testClears.some(
    (c) => c.test_type === '100首' && c.range_key === 'all',
  );

  const handleToggleBlock = (blockId: number) => {
    setExpandedBlock((prev) => (prev === blockId ? null : blockId));
  };

  const renderBlock = ({ item }: { item: (typeof BLOCKS)[0] }) => {
    const isExpanded = expandedBlock === item.id;
    const cleared = isBlockCleared(item);

    const showEightTest = EIGHT_TEST_BLOCK_IDS.has(item.id);
    const twentyTestInfo = TWENTY_TEST_BLOCKS[item.id];

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
            {/* 基本ボタン行: Study と 4首テスト */}
            <View style={styles.mainButtonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/learn/${item.rangeKey}/study`)}
              >
                <Text style={styles.actionButtonText}>📚 Study</Text>
                <Text style={styles.actionSubtext}>2ステップで覚える</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.testButton]}
                onPress={() => router.push(`/learn/${item.rangeKey}/test`)}
              >
                <Text style={styles.actionButtonText}>✏️ Test</Text>
                <Text style={styles.actionSubtext}>4首テスト</Text>
              </TouchableOpacity>
            </View>

            {/* 8首テストボタン */}
            {showEightTest && (
              <TouchableOpacity
                style={styles.eightTestButton}
                onPress={() => {
                  const rangeKey = getEightTestRangeKey(item.from, item.to);
                  router.push(`/learn/${rangeKey}/test`);
                }}
              >
                <Text style={styles.eightTestButtonText}>
                  📝 前回も入れて8首テスト
                </Text>
                <Text style={styles.eightTestSubtext}>
                  {item.from - 4}〜{item.to}首
                </Text>
              </TouchableOpacity>
            )}

            {/* 20首テストボタン */}
            {twentyTestInfo && (
              <TouchableOpacity
                style={styles.twentyTestButton}
                onPress={() => {
                  const rangeKey = `${twentyTestInfo.from}-${twentyTestInfo.to}`;
                  router.push(`/learn/${rangeKey}/test`);
                }}
              >
                <Text style={styles.twentyTestButtonText}>
                  🏆 {twentyTestInfo.label}
                </Text>
                <Text style={styles.twentyTestSubtext}>
                  {twentyTestInfo.to - twentyTestInfo.from + 1}首まとめテスト
                </Text>
              </TouchableOpacity>
            )}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <StarBadge cleared={isAllCleared} size={22} />
                <Text style={styles.allTestButtonText}>100首テストに挑戦 🏆</Text>
              </View>
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
    paddingBottom: 60,
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
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  mainButtonRow: {
    flexDirection: 'row',
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
  // 8首テストボタン — 緑系
  eightTestButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
  },
  eightTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  eightTestSubtext: {
    fontSize: 11,
    color: '#4ade80',
    marginTop: 2,
  },
  // 20首テストボタン — 紫系
  twentyTestButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderTopWidth: 1,
    borderTopColor: '#e9d5ff',
  },
  twentyTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  twentyTestSubtext: {
    fontSize: 11,
    color: '#a78bfa',
    marginTop: 2,
  },
});
