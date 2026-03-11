import { Audio } from 'expo-av';
import { audioCacheService } from './audioCacheService';

/**
 * expo-avのAudio.Soundを管理するサービス
 * Howler.jsに相当する機能を提供する
 */
class AudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private currentSound: Audio.Sound | null = null;

  /**
   * 音声モードを初期化する（アプリ起動時に1回呼ぶ）
   */
  async initialize(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }

  /**
   * URLから音声を読み込む（キャッシュ優先）
   */
  async loadSound(url: string): Promise<Audio.Sound> {
    // キャッシュ済みのローカルパスを取得
    const localUri = await audioCacheService.getCachedUri(url);
    const source = localUri ? { uri: localUri } : { uri: url };

    const { sound } = await Audio.Sound.createAsync(source);
    return sound;
  }

  /**
   * 1回再生して完了を待つ
   */
  async playOnce(url: string): Promise<void> {
    await this.stopAll();

    const sound = await this.loadSound(url);
    this.currentSound = sound;

    return new Promise((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          this.currentSound = null;
          resolve();
        }
      });
      sound.playAsync().catch((err) => {
        console.error('AudioService.playOnce error:', err);
        resolve();
      });
    });
  }

  /**
   * 複数URLを順番に再生する
   */
  async playSequence(urls: string[], intervalMs = 500): Promise<void> {
    for (const url of urls) {
      await this.playOnce(url);
      if (intervalMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  }

  /**
   * 現在再生中の音声を停止する
   */
  async stopAll(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch {
        // 停止エラーは無視
      }
      this.currentSound = null;
    }
  }

  /**
   * 複数のURLをプリロード（キャッシュダウンロード）する
   */
  async preloadSounds(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => audioCacheService.downloadIfNeeded(url)));
  }
}

export const audioService = new AudioService();
