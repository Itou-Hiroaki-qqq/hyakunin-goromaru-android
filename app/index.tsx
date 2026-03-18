import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getTestClears } from '@/api/testClears';
import { reviewDatabase } from '@/services/reviewDatabase';
import { COLORS } from '@/constants/study';

interface NavItem {
  title: string;
  subtitle: string;
  route: string;
  color: string;
  /** true のときアンロック条件あり（灰色表示） */
  requiresUnlock?: boolean;
}

/**
 * ホーム画面
 *
 * ロック/アンロック状態の動的反映:
 * - 復習: reviewDatabase に1件以上あるときのみ有効
 * - 実践問題・コンピューター対戦: 100首テストクリア後に有効
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: testClears = [] } = useQuery({
    queryKey: ['testClears'],
    queryFn: getTestClears,
    enabled: !!user,
  });

  const [hasReview, setHasReview] = useState(false);

  // 画面がフォーカスされるたびに復習データを確認
  useFocusEffect(
    useCallback(() => {
      reviewDatabase.getAll().then((items) => setHasReview(items.length > 0)).catch(() => {});
    }, [])
  );

  // 100首テストクリア済みか
  const isAllCleared = testClears.some(
    (c) => c.test_type === '100首' && c.range_key === 'all',
  );

  const NAV_ITEMS: NavItem[] = [
    {
      title: '学習',
      subtitle: '2ステップで百人一首をマスター',
      route: '/learn',
      color: '#f5a623',
    },
    {
      title: '間違えやすい問題',
      subtitle: '紛らわしい句を集中練習',
      route: '/tricky',
      color: '#8b5cf6',
    },
    {
      title: 'コンピューター対戦',
      subtitle: isAllCleared ? 'AIと対決！難易度を選んで挑戦' : '100首テスト ノーミスクリアで解放',
      route: '/battle',
      color: '#3b82f6',
      requiresUnlock: !isAllCleared,
    },
    {
      title: '実践問題',
      subtitle: isAllCleared ? '音声を聞いて下の句を答える' : '100首テスト ノーミスクリアで解放',
      route: '/jissen',
      color: '#10b981',
      requiresUnlock: !isAllCleared,
    },
    {
      title: '復習',
      subtitle: hasReview ? '間違えた問題を効率よく復習' : '復習リストは空です',
      route: '/review',
      color: '#ef4444',
      requiresUnlock: !hasReview,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>百人一首</Text>
        <Text style={styles.appSubtitle}>ゴロでマル覚え</Text>
        {user ? (
          <Text style={styles.userGreeting}>こんにちは、{user.name}さん</Text>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>ログインしてスコアを保存</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.navGrid}
        showsVerticalScrollIndicator={false}
      >
        {!user && (
          <Text style={styles.notLoggedInText}>
            未ログインのためスコアは保存されません
          </Text>
        )}
        {NAV_ITEMS.map((item) => {
          const isLocked = item.requiresUnlock;
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navCard,
                { borderLeftColor: isLocked ? '#d1d5db' : item.color },
                isLocked && styles.navCardLocked,
              ]}
              onPress={() => {
                if (!isLocked) {
                  router.push(item.route as Parameters<typeof router.push>[0]);
                }
              }}
              activeOpacity={isLocked ? 1 : 0.8}
            >
              <View style={styles.navTextContainer}>
                <Text
                  style={[styles.navTitle, isLocked && styles.navTitleLocked]}
                >
                  {item.title}
                  {isLocked ? ' 🔒' : ''}
                </Text>
                <Text style={styles.navSubtitle}>{item.subtitle}</Text>
              </View>
              <Text
                style={[styles.navArrow, isLocked && { color: '#d1d5db' }]}
              >
                ›
              </Text>
            </TouchableOpacity>
          );
        })}

        {user && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await useAuthStore.getState().logout();
            }}
          >
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
    letterSpacing: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  userGreeting: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  loginLink: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
  },
  notLoggedInText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 4,
  },
  navGrid: {
    padding: 16,
    gap: 12,
  },
  navCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  navCardLocked: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  navTitleLocked: {
    color: '#9ca3af',
  },
  navSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  navArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
    marginLeft: 8,
  },
  logoutButton: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  logoutText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
