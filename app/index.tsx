import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/constants/study';

interface NavItem {
  title: string;
  subtitle: string;
  route: string;
  emoji: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: '学習',
    subtitle: '6ステップで百人一首をマスター',
    route: '/learn',
    emoji: '📖',
    color: '#f5a623',
  },
  {
    title: '間違えやすい問題',
    subtitle: '紛らわしい句を集中練習',
    route: '/tricky',
    emoji: '⚡',
    color: '#8b5cf6',
  },
  {
    title: 'コンピューター対戦',
    subtitle: 'AIと対決！難易度を選んで挑戦',
    route: '/battle',
    emoji: '🎮',
    color: '#3b82f6',
  },
  {
    title: '実践問題',
    subtitle: '100首テストクリア後に解放',
    route: '/jissen',
    emoji: '🏆',
    color: '#10b981',
  },
  {
    title: '復習',
    subtitle: '間違えた問題を効率よく復習',
    route: '/review',
    emoji: '🔄',
    color: '#ef4444',
  },
];

/**
 * ホーム画面
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

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
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.navCard, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.route as Parameters<typeof router.push>[0])}
            activeOpacity={0.8}
          >
            <Text style={styles.navEmoji}>{item.emoji}</Text>
            <View style={styles.navTextContainer}>
              <Text style={styles.navTitle}>{item.title}</Text>
              <Text style={styles.navSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        ))}

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
  navEmoji: {
    fontSize: 32,
    width: 48,
    textAlign: 'center',
  },
  navTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
