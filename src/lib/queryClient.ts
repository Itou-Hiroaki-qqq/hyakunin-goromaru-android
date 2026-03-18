import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query のグローバルクライアント
 * _layout.tsx と各画面で共有する
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5分
    },
  },
});
