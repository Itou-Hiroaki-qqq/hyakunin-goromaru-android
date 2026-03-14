import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTestClears } from '@/api/testClears';
import Header from '@/components/layout/Header';
import { COLORS } from '@/constants/study';

/**
 * 実践問題 入口画面
 * 100首テストクリア後に解放される。解放済みなら play.tsx へ遷移。
 */
export default function JissenScreen() {
  const router = useRouter();
  const { data: testClears = [] } = useQuery({
    queryKey: ['testClears'],
    queryFn: getTestClears,
  });

  const isUnlocked = testClears.some(
    (c) => c.test_type === '100首' && c.range_key === 'all',
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="実践問題" showBack />
      <View style={styles.content}>
        {isUnlocked ? (
          <>
            <Text style={styles.unlockedTitle}>実践問題</Text>
            <Text style={styles.description}>
              音声を聞いて下の句を答える上位者向けモードです。
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push('/jissen/play')}
            >
              <Text style={styles.startButtonText}>実践問題に挑戦</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.lockTitle}>まだ解放されていません</Text>
            <Text style={styles.lockDescription}>
              100首テストをクリアすると、実践問題が解放されます。
            </Text>
            <TouchableOpacity
              style={styles.challengeButton}
              onPress={() => router.push('/learn/all-test')}
            >
              <Text style={styles.challengeButtonText}>100首テストに挑戦する</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  lockEmoji: { fontSize: 72 },
  lockTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  lockDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  challengeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  challengeButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
  unlockedTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  startButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
});
