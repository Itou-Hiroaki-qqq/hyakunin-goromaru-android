import * as FileSystem from 'expo-file-system';

const CACHE_DIR = `${FileSystem.documentDirectory}audio/`;
// キャッシュサイズ上限: 200MB
const MAX_CACHE_SIZE_BYTES = 200 * 1024 * 1024;

/**
 * 音声ファイルのローカルキャッシュ管理サービス
 * - 初回アクセス時にダウンロードしてローカル保存
 * - 以降はローカルファイルパスを返す（遅延DL戦略）
 */
class AudioCacheService {
  /**
   * URLからキャッシュファイル名を生成する
   */
  private getFileName(url: string): string {
    // URLを安全なファイル名に変換
    const hash = url.replace(/[^a-zA-Z0-9]/g, '_').slice(-100);
    return `${hash}.mp3`;
  }

  /**
   * ローカルキャッシュパスを返す
   */
  private getLocalPath(url: string): string {
    return `${CACHE_DIR}${this.getFileName(url)}`;
  }

  /**
   * キャッシュディレクトリを初期化する
   */
  private async ensureCacheDir(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  }

  /**
   * キャッシュ済みのローカルURIを返す。なければnull。
   */
  async getCachedUri(url: string): Promise<string | null> {
    const localPath = this.getLocalPath(url);
    const info = await FileSystem.getInfoAsync(localPath);
    return info.exists ? localPath : null;
  }

  /**
   * 必要であればダウンロードしてキャッシュする
   */
  async downloadIfNeeded(url: string): Promise<string> {
    const localPath = this.getLocalPath(url);
    const info = await FileSystem.getInfoAsync(localPath);

    if (info.exists) {
      return localPath;
    }

    await this.ensureCacheDir();

    try {
      await FileSystem.downloadAsync(url, localPath);
      return localPath;
    } catch (err) {
      console.error('AudioCacheService download error:', err);
      // ダウンロード失敗時はオリジナルURLを返す
      return url;
    }
  }

  /**
   * キャッシュサイズを確認し、上限を超えた場合に古いファイルを削除する
   */
  async evictIfNeeded(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;
      const fileInfos: Array<{ path: string; size: number; modificationTime: number }> = [];

      for (const file of files) {
        const path = `${CACHE_DIR}${file}`;
        const info = await FileSystem.getInfoAsync(path, { size: true });
        if (info.exists) {
          fileInfos.push({
            path,
            size: info.size ?? 0,
            modificationTime: info.modificationTime ?? 0,
          });
          totalSize += info.size ?? 0;
        }
      }

      if (totalSize <= MAX_CACHE_SIZE_BYTES) return;

      // 古い順に削除
      fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);
      for (const fileInfo of fileInfos) {
        if (totalSize <= MAX_CACHE_SIZE_BYTES * 0.8) break;
        await FileSystem.deleteAsync(fileInfo.path, { idempotent: true });
        totalSize -= fileInfo.size;
      }
    } catch (err) {
      console.error('AudioCacheService evict error:', err);
    }
  }

  /**
   * キャッシュを全削除する
   */
  async clearAll(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    } catch (err) {
      console.error('AudioCacheService clearAll error:', err);
    }
  }
}

export const audioCacheService = new AudioCacheService();
