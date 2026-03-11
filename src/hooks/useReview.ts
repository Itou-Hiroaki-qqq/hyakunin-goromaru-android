import { useState, useEffect, useCallback } from 'react';
import { reviewDatabase, type ReviewItem } from '@/services/reviewDatabase';
import { notificationService } from '@/services/notificationService';

/**
 * 復習データ管理フック（expo-sqlite）
 */
export function useReview() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [all, due] = await Promise.all([
        reviewDatabase.getAll(),
        reviewDatabase.getNextReview(),
      ]);
      setItems(all);
      setDueItems(due);

      // 通知を再スケジュール
      await notificationService.scheduleReviewReminders(all).catch(() => {});
    } catch (err) {
      console.error('useReview load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * 復習アイテムを追加する
   */
  const addItem = useCallback(
    async (poemId: number) => {
      await reviewDatabase.add(poemId);
      await load();
    },
    [load],
  );

  /**
   * 復習アイテムを削除する
   */
  const removeItem = useCallback(
    async (poemId: number) => {
      await reviewDatabase.remove(poemId);
      await load();
    },
    [load],
  );

  return {
    items,
    dueItems,
    isLoading,
    addItem,
    removeItem,
    reload: load,
  };
}
