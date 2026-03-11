import * as SQLite from 'expo-sqlite';

const DB_NAME = 'review.db';

interface ReviewItem {
  poem_id: number;
  error_count: number;
  next_review_at: string;
  last_reviewed_at: string;
}

/**
 * expo-sqliteを使った復習データのローカルDB管理
 */
class ReviewDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * DBを初期化する（テーブル作成）
   */
  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS review_items (
        poem_id INTEGER PRIMARY KEY,
        error_count INTEGER DEFAULT 1,
        next_review_at TEXT NOT NULL,
        last_reviewed_at TEXT NOT NULL
      );
    `);
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('ReviewDatabase not initialized. Call init() first.');
    return this.db;
  }

  /**
   * 間隔反復の次回復習日時を計算する（error_countに応じて間隔を拡大）
   */
  private calculateNextReview(errorCount: number): string {
    const intervals = [1, 3, 7, 14, 30]; // 日数
    const index = Math.min(errorCount - 1, intervals.length - 1);
    const days = intervals[index];
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next.toISOString();
  }

  /**
   * 復習アイテムを追加（既存の場合はerror_countを増やす）
   */
  async add(poemId: number): Promise<void> {
    const db = this.getDb();
    const existing = await db.getFirstAsync<ReviewItem>(
      'SELECT * FROM review_items WHERE poem_id = ?',
      [poemId],
    );

    const now = new Date().toISOString();

    if (existing) {
      const newErrorCount = existing.error_count + 1;
      const nextReview = this.calculateNextReview(newErrorCount);
      await db.runAsync(
        'UPDATE review_items SET error_count = ?, next_review_at = ?, last_reviewed_at = ? WHERE poem_id = ?',
        [newErrorCount, nextReview, now, poemId],
      );
    } else {
      const nextReview = this.calculateNextReview(1);
      await db.runAsync(
        'INSERT INTO review_items (poem_id, error_count, next_review_at, last_reviewed_at) VALUES (?, 1, ?, ?)',
        [poemId, nextReview, now],
      );
    }
  }

  /**
   * 復習アイテムを削除する
   */
  async remove(poemId: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM review_items WHERE poem_id = ?', [poemId]);
  }

  /**
   * 全復習アイテムを取得する
   */
  async getAll(): Promise<ReviewItem[]> {
    const db = this.getDb();
    return db.getAllAsync<ReviewItem>('SELECT * FROM review_items ORDER BY next_review_at ASC');
  }

  /**
   * 今日復習すべきアイテムを取得する
   */
  async getNextReview(): Promise<ReviewItem[]> {
    const db = this.getDb();
    const now = new Date().toISOString();
    return db.getAllAsync<ReviewItem>(
      'SELECT * FROM review_items WHERE next_review_at <= ? ORDER BY next_review_at ASC',
      [now],
    );
  }

  /**
   * 指定IDの復習アイテムを取得する
   */
  async getById(poemId: number): Promise<ReviewItem | null> {
    const db = this.getDb();
    return db.getFirstAsync<ReviewItem>(
      'SELECT * FROM review_items WHERE poem_id = ?',
      [poemId],
    );
  }
}

export const reviewDatabase = new ReviewDatabase();
export type { ReviewItem };
