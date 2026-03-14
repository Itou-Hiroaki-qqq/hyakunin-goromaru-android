import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { reviewDatabase } from '@/services/reviewDatabase';
import { audioService } from '@/services/audioService';

// TanStack Queryのグローバルクライアント設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5分
    },
  },
});

/**
 * エラーバウンダリ: クラッシュ時にエラーメッセージを画面に表示する
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 40, backgroundColor: '#fff', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 16 }}>
            アプリエラー
          </Text>
          <ScrollView>
            <Text style={{ fontSize: 14, color: '#333' }}>
              {this.state.error.message}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 12 }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * ルートレイアウト
 * - QueryClientProvider でTanStack Queryを提供
 * - アプリ起動時に認証トークンを復元
 * - SQLiteとAudio初期化
 */
export default function RootLayout() {
  const restoreToken = useAuthStore((s) => s.restoreToken);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 認証トークン復元
        await restoreToken();
      } catch (e: any) {
        setInitError(`restoreToken: ${e?.message}`);
      }
      try {
        // SQLite復習DBの初期化
        await reviewDatabase.init();
      } catch (e: any) {
        setInitError((prev) => `${prev ?? ''}\nreviewDB: ${e?.message}`);
      }
      try {
        // 音声サービス初期化
        await audioService.initialize();
      } catch (e: any) {
        setInitError((prev) => `${prev ?? ''}\naudio: ${e?.message}`);
      }
    };
    initApp();
  }, [restoreToken]);

  if (initError) {
    return (
      <View style={{ flex: 1, padding: 40, backgroundColor: '#fff', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 16 }}>
          初期化エラー
        </Text>
        <Text style={{ fontSize: 14, color: '#333' }}>{initError}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#f5a623" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fffbf0' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="learn/index" />
          <Stack.Screen name="learn/[range]/study" />
          <Stack.Screen name="learn/[range]/test" />
          <Stack.Screen name="learn/all-test" />
          <Stack.Screen name="tricky/index" />
          <Stack.Screen name="tricky/[category]/index" />
          <Stack.Screen name="tricky/[category]/test" />
          <Stack.Screen name="battle/index" />
          <Stack.Screen name="battle/play" />
          <Stack.Screen name="jissen/index" />
          <Stack.Screen name="jissen/play" />
          <Stack.Screen name="review/index" />
          <Stack.Screen name="review/study" />
        </Stack>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
