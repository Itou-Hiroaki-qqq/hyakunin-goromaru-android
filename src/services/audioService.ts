import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { audioCacheService } from './audioCacheService';

/**
 * expo-audioのAudioPlayerを管理するサービス
 * Howler.jsに相当する機能を提供する
 */
class AudioService {
  private currentPlayer: AudioPlayer | null = null;
  /** 同時並行のplayOnce呼び出しを識別するカウンター */
  private playGeneration = 0;
  /** stopAll時にハングしたPromiseを解決するためのresolveコールバック */
  private pendingResolve: (() => void) | null = null;

  /**
   * 音声モードを初期化する（アプリ起動時に1回呼ぶ）
   */
  async initialize(): Promise<void> {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldDuckAndroid: true,
      shouldPlayInBackground: false,
    });
  }

  /**
   * URLから音声プレーヤーを作成する（キャッシュ優先）
   */
  async loadSound(url: string): Promise<AudioPlayer> {
    // キャッシュ済みのローカルパスを取得
    const localUri = await audioCacheService.getCachedUri(url);
    const source = { uri: localUri || url };

    const player = createAudioPlayer(source);
    return player;
  }

  /**
   * 1回再生して完了を待つ
   */
  async playOnce(url: string): Promise<void> {
    const gen = ++this.playGeneration;

    await this.stopAll();

    const player = await this.loadSound(url);

    if (gen !== this.playGeneration) {
      player.remove();
      return;
    }

    this.currentPlayer = player;

    return new Promise<void>((resolve) => {
      this.pendingResolve = resolve;

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          player.remove();
          if (this.currentPlayer === player) {
            this.currentPlayer = null;
          }
          this.pendingResolve = null;
          resolve();
        }
      });

      try {
        player.play();
      } catch (err) {
        console.error('AudioService.playOnce error:', err);
        subscription.remove();
        this.pendingResolve = null;
        resolve();
      }
    });
  }

  /**
   * プリロード済みの AudioPlayer を即再生する
   */
  async playLoadedSound(player: AudioPlayer): Promise<void> {
    const gen = ++this.playGeneration;
    await this.stopAll();

    if (gen !== this.playGeneration) {
      player.remove();
      return;
    }

    this.currentPlayer = player;

    return new Promise<void>((resolve) => {
      this.pendingResolve = resolve;

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          player.remove();
          if (this.currentPlayer === player) {
            this.currentPlayer = null;
          }
          this.pendingResolve = null;
          resolve();
        }
      });

      try {
        player.play();
      } catch (err) {
        console.error('AudioService.playLoadedSound error:', err);
        subscription.remove();
        this.pendingResolve = null;
        resolve();
      }
    });
  }

  /**
   * 2つのURLを最小ギャップで連続再生する
   */
  async playPair(url1: string, url2: string): Promise<void> {
    const gen = ++this.playGeneration;
    await this.stopAll();

    const player1 = await this.loadSound(url1);
    if (gen !== this.playGeneration) {
      player1.remove();
      return;
    }

    const player2Promise = this.loadSound(url2);

    this.currentPlayer = player1;
    await new Promise<void>((resolve) => {
      this.pendingResolve = resolve;
      const subscription = player1.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          player1.remove();
          if (this.currentPlayer === player1) this.currentPlayer = null;
          this.pendingResolve = null;
          resolve();
        }
      });
      try {
        player1.play();
      } catch {
        subscription.remove();
        this.pendingResolve = null;
        resolve();
      }
    });

    if (gen !== this.playGeneration) {
      player2Promise.then((p) => p.remove());
      return;
    }

    const player2 = await player2Promise;
    if (gen !== this.playGeneration) {
      player2.remove();
      return;
    }

    this.currentPlayer = player2;
    await new Promise<void>((resolve) => {
      this.pendingResolve = resolve;
      const subscription = player2.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          player2.remove();
          if (this.currentPlayer === player2) this.currentPlayer = null;
          this.pendingResolve = null;
          resolve();
        }
      });
      try {
        player2.play();
      } catch {
        subscription.remove();
        this.pendingResolve = null;
        resolve();
      }
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
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve();
    }

    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause();
        this.currentPlayer.remove();
      } catch {
        // 停止エラーは無視
      }
      this.currentPlayer = null;
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
