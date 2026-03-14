import { Audio } from 'expo-av';
import { audioCacheService } from './audioCacheService';

/**
 * expo-avのAudio.Soundを管理するサービス
 * Howler.jsに相当する機能を提供する
 */
class AudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private currentSound: Audio.Sound | null = null;
  /** 同時並行のplayOnce呼び出しを識別するカウンター */
  private playGeneration = 0;
  /** stopAll時にハングしたPromiseを解決するためのresolveコールバック */
  private pendingResolve: (() => void) | null = null;

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
   *
   * 並行呼び出し対策:
   * - generationカウンターにより、ローディング中に別のplayOnceが来た場合は
   *   古いsoundを即座にunloadして処理を中断する
   * - pendingResolveにより、stopAll()が呼ばれたときにPromiseがハングしない
   */
  async playOnce(url: string): Promise<void> {
    // このplayOnce呼び出しの世代番号を確定する
    const gen = ++this.playGeneration;

    await this.stopAll();

    // ロード中に別のplayOnceが呼ばれた場合はここで検出してキャンセル
    const sound = await this.loadSound(url);

    if (gen !== this.playGeneration) {
      // 自分より新しいplayOnceが既に起動している — このsoundは不要
      sound.unloadAsync().catch(() => {});
      return;
    }

    this.currentSound = sound;

    return new Promise<void>((resolve) => {
      this.pendingResolve = resolve;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (this.currentSound === sound) {
            this.currentSound = null;
          }
          this.pendingResolve = null;
          resolve();
        }
      });

      sound.playAsync().catch((err) => {
        console.error('AudioService.playOnce error:', err);
        this.pendingResolve = null;
        resolve();
      });
    });
  }

  /**
   * プリロード済みの Sound を即再生する
   *
   * useGoroPlayback のように、ハイライト切替タイミングを制御しながら
   * プリロード済み音声を再生したい場合に使う
   */
  async playLoadedSound(sound: Audio.Sound): Promise<void> {
    const gen = ++this.playGeneration;
    await this.stopAll();

    if (gen !== this.playGeneration) {
      sound.unloadAsync().catch(() => {});
      return;
    }

    this.currentSound = sound;

    return new Promise<void>((resolve) => {
      this.pendingResolve = resolve;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (this.currentSound === sound) {
            this.currentSound = null;
          }
          this.pendingResolve = null;
          resolve();
        }
      });

      sound.playAsync().catch((err) => {
        console.error('AudioService.playLoadedSound error:', err);
        this.pendingResolve = null;
        resolve();
      });
    });
  }

  /**
   * 2つのURLを最小ギャップで連続再生する
   *
   * url2 を url1 再生中にプリロードしておくことで
   * 音声切り替え時の loadSound 待ちを排除する
   */
  async playPair(url1: string, url2: string): Promise<void> {
    const gen = ++this.playGeneration;
    await this.stopAll();

    // url1 をロードして再生しながら、url2 を並行プリロード
    const sound1 = await this.loadSound(url1);
    if (gen !== this.playGeneration) {
      sound1.unloadAsync().catch(() => {});
      return;
    }

    const sound2Promise = this.loadSound(url2);

    this.currentSound = sound1;
    await new Promise<void>((resolve) => {
      this.pendingResolve = resolve;
      sound1.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound1.unloadAsync().catch(() => {});
          if (this.currentSound === sound1) this.currentSound = null;
          this.pendingResolve = null;
          resolve();
        }
      });
      sound1.playAsync().catch(() => {
        this.pendingResolve = null;
        resolve();
      });
    });

    if (gen !== this.playGeneration) {
      sound2Promise.then((s) => s.unloadAsync().catch(() => {}));
      return;
    }

    // sound2 は既にプリロード済み — 即座に再生
    const sound2 = await sound2Promise;
    if (gen !== this.playGeneration) {
      sound2.unloadAsync().catch(() => {});
      return;
    }

    this.currentSound = sound2;
    await new Promise<void>((resolve) => {
      this.pendingResolve = resolve;
      sound2.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound2.unloadAsync().catch(() => {});
          if (this.currentSound === sound2) this.currentSound = null;
          this.pendingResolve = null;
          resolve();
        }
      });
      sound2.playAsync().catch(() => {
        this.pendingResolve = null;
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
   *
   * pendingResolveを先に解決することで、停止によってplayOnceのPromiseが
   * ハングしたままになる問題を防ぐ
   */
  async stopAll(): Promise<void> {
    // 再生完了待ちのPromiseがあれば先に解決しておく（ハング防止）
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve();
    }

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
