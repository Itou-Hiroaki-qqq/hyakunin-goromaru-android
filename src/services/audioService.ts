import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { audioCacheService } from './audioCacheService';

/** 再生完了を待つ最大時間（ミリ秒）。これを超えたら強制resolve */
const PLAYBACK_TIMEOUT_MS = 15000;

/**
 * expo-audioのAudioPlayerを管理するサービス（シングルプレーヤー方式）
 *
 * 毎回 createAudioPlayer() するとネイティブリソースが枯渇するため、
 * 1つの AudioPlayer を使い回し、replace() でソースを差し替える。
 */
class AudioService {
  /** 唯一のプレーヤーインスタンス（遅延作成） */
  private player: AudioPlayer | null = null;
  /** 同時並行のplay呼び出しを識別するカウンター */
  private playGeneration = 0;
  /** stopAll時にハングしたPromiseを解決するためのresolveコールバック */
  private pendingResolve: (() => void) | null = null;
  /** タイムアウト用タイマーID */
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  /** 現在のlistenerサブスクリプション */
  private pendingSubscription: { remove: () => void } | null = null;

  /**
   * 音声モードを初期化する（アプリ起動時に1回呼ぶ）
   */
  async initialize(): Promise<void> {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    } as Parameters<typeof setAudioModeAsync>[0]);
  }

  /**
   * シングルトンのAudioPlayerを取得（なければ作成）
   * エラー発生時は新しいプレーヤーを作り直す
   */
  private getPlayer(): AudioPlayer {
    if (!this.player) {
      this.player = createAudioPlayer({ uri: '' });
    }
    return this.player;
  }

  /**
   * プレーヤーが壊れた場合に作り直す
   */
  private resetPlayer(): AudioPlayer {
    if (this.player) {
      try { this.player.pause(); } catch { /* ignore */ }
      try { this.player.remove(); } catch { /* ignore */ }
    }
    this.player = createAudioPlayer({ uri: '' });
    return this.player;
  }

  /**
   * URLをローカルにダウンロードしてURIを返す（プリダウンロード用）
   * プレーヤーは作成しない。
   */
  async preload(url: string): Promise<string> {
    return audioCacheService.downloadIfNeeded(url);
  }

  /**
   * 現在の再生を停止し、リスナー等をクリーンアップする（プレーヤーは破棄しない）
   */
  private stopCurrent(): void {
    // 1. 音声出力を即座に停止
    if (this.player) {
      try { this.player.pause(); } catch { /* ignore */ }
    }

    // 2. タイマー・リスナーのクリーンアップ
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    if (this.pendingSubscription) {
      try { this.pendingSubscription.remove(); } catch { /* ignore */ }
      this.pendingSubscription = null;
    }

    // 3. 待機中のPromiseを解決
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve();
    }
  }

  /**
   * プレーヤーにソースをセットして再生完了を待つ
   */
  private waitForPlayback(player: AudioPlayer, gen: number): Promise<void> {
    return new Promise<void>((resolve) => {
      let resolved = false;

      const done = () => {
        if (resolved) return;
        resolved = true;

        if (gen === this.playGeneration) {
          if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
          }
          if (this.pendingSubscription) {
            try { this.pendingSubscription.remove(); } catch { /* ignore */ }
            this.pendingSubscription = null;
          }
          this.pendingResolve = null;
        }

        resolve();
      };

      this.pendingResolve = done;

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          done();
        }
      });
      this.pendingSubscription = subscription;

      this.pendingTimeout = setTimeout(() => {
        console.warn('AudioService: playback timeout, forcing resolve');
        done();
      }, PLAYBACK_TIMEOUT_MS);

      try {
        player.play();
      } catch (err) {
        console.error('AudioService play error:', err);
        // play失敗 → プレーヤーをリセットして次回に備える
        this.resetPlayer();
        done();
      }
    });
  }

  /**
   * ローカルURIをシングルプレーヤーで再生する内部メソッド
   */
  private async playLocalUri(localUri: string, gen: number): Promise<void> {
    const player = this.getPlayer();
    try {
      player.replace({ uri: localUri });
    } catch {
      // replace失敗 → プレーヤーをリセットしてリトライ
      const newPlayer = this.resetPlayer();
      if (gen !== this.playGeneration) return;
      try {
        newPlayer.replace({ uri: localUri });
      } catch (err) {
        console.error('AudioService replace error after reset:', err);
        return;
      }
    }

    if (gen !== this.playGeneration) return;
    await this.waitForPlayback(this.player!, gen);
  }

  /**
   * 1回再生して完了を待つ
   */
  async playOnce(url: string): Promise<void> {
    const gen = ++this.playGeneration;
    this.stopCurrent();

    const localUri = await audioCacheService.downloadIfNeeded(url);
    if (gen !== this.playGeneration) return;

    await this.playLocalUri(localUri, gen);
  }

  /**
   * プリロード済みのローカルURIを即再生する
   */
  async playPreloaded(localUri: string): Promise<void> {
    const gen = ++this.playGeneration;
    this.stopCurrent();

    if (gen !== this.playGeneration) return;
    await this.playLocalUri(localUri, gen);
  }

  /**
   * 2つのURLを最小ギャップで連続再生する
   */
  async playPair(url1: string, url2: string): Promise<void> {
    const gen = ++this.playGeneration;
    this.stopCurrent();

    // 両方並行でダウンロード
    const [localUri1, localUri2] = await Promise.all([
      audioCacheService.downloadIfNeeded(url1),
      audioCacheService.downloadIfNeeded(url2),
    ]);
    if (gen !== this.playGeneration) return;

    // 1つ目を再生
    await this.playLocalUri(localUri1, gen);
    if (gen !== this.playGeneration) return;

    // 2つ目を再生
    await this.playLocalUri(localUri2, gen);
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
   * 現在再生中の音声を停止する（外部公開用）
   */
  async stopAll(): Promise<void> {
    this.stopCurrent();
  }

  /**
   * 複数のURLをプリロード（キャッシュダウンロード）する
   */
  async preloadSounds(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => audioCacheService.downloadIfNeeded(url)));
  }
}

export const audioService = new AudioService();
