import * as Notifications from 'expo-notifications';
import type { ReviewItem } from './reviewDatabase';

// 通知ハンドラーの設定（フォアグラウンドでも通知を表示）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * プッシュ通知（復習リマインダー）管理サービス
 * expo-notificationsによるローカル通知のみ（サーバー不要）
 */
class NotificationService {
  /**
   * 通知権限をリクエストする
   * @returns 権限が許可された場合はtrue
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * 現在の通知権限状態を確認する
   */
  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * 既存のすべてのスケジュール済み通知をキャンセルする
   */
  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * 復習アイテムに基づいて通知をスケジュールする
   * アプリ起動時に呼び出す
   */
  async scheduleReviewReminders(reviewItems: ReviewItem[]): Promise<void> {
    // 既存の通知をクリア
    await this.cancelAllScheduled();

    const status = await this.getPermissionStatus();
    if (status !== 'granted') return;

    // 今後30日以内の復習アイテムのみスケジュール
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const upcomingItems = reviewItems.filter((item) => {
      const nextReview = new Date(item.next_review_at);
      return nextReview >= now && nextReview <= thirtyDaysLater;
    });

    if (upcomingItems.length === 0) return;

    // 最初の復習日時にまとめて通知を設定
    const firstReview = new Date(upcomingItems[0].next_review_at);
    const reviewCount = upcomingItems.length;

    // 翌日以降の場合のみ通知をスケジュール
    if (firstReview > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '百人一首の復習時間です',
          body: `${reviewCount}首の復習があります。忘れる前に確認しましょう！`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: firstReview,
        },
      });
    }
  }

  /**
   * テスト用の即時通知を送信する
   */
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'テスト通知',
        body: '通知が正常に動作しています',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  }
}

export const notificationService = new NotificationService();
