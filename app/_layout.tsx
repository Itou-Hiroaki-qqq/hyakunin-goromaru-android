import { useEffect } from 'react';
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
 * ルートレイアウト
 * - QueryClientProvider でTanStack Queryを提供
 * - アプリ起動時に認証トークンを復元
 * - SQLiteとAudio初期化
 */
export default function RootLayout() {
  const restoreToken = useAuthStore((s) => s.restoreToken);

  useEffect(() => {
    const initApp = async () => {
      // 認証トークン復元
      await restoreToken();
      // SQLite復習DBの初期化
      await reviewDatabase.init().catch(console.error);
      // 音声サービス初期化
      await audioService.initialize().catch(console.error);
    };
    initApp();
  }, [restoreToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor="#f5a623" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fffbf0' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="learn/index" />
        <Stack.Screen name="learn/[range]/study" />
        <Stack.Screen name="learn/[range]/test" />
        <Stack.Screen name="learn/all-test" />
        <Stack.Screen name="tricky/index" />
        <Stack.Screen name="tricky/[category]/test" />
        <Stack.Screen name="battle/index" />
        <Stack.Screen name="battle/play" />
        <Stack.Screen name="jissen/index" />
        <Stack.Screen name="review/index" />
        <Stack.Screen name="review/study" />
      </Stack>
    </QueryClientProvider>
  );
}
