import { useQuery } from '@tanstack/react-query';
import { getPoems, getAllPoems } from '@/api/poems';
import type { Poem } from '@/types/poem';

// クエリキーのファクトリ
const poemQueryKeys = {
  all: ['poems'] as const,
  range: (from: number, to: number) => ['poems', from, to] as const,
};

/**
 * 指定範囲の首を取得するフック
 */
export function usePoems(from: number, to: number) {
  return useQuery<Poem[]>({
    queryKey: poemQueryKeys.range(from, to),
    queryFn: () => getPoems({ from, to }),
    staleTime: 24 * 60 * 60 * 1000, // 24時間キャッシュ
    gcTime: 48 * 60 * 60 * 1000,    // 48時間でGC
  });
}

/**
 * 全100首を取得するフック
 */
export function useAllPoems() {
  return useQuery<Poem[]>({
    queryKey: poemQueryKeys.all,
    queryFn: getAllPoems,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 48 * 60 * 60 * 1000,
  });
}
