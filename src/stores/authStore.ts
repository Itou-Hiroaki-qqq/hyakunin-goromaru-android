import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '@/constants/api';
import { getMe } from '@/api/auth';
import type { User } from '@/types/user';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  /** ログイン成功後にトークンとユーザーをセット */
  login: (token: string, user: User) => Promise<void>;
  /** ログアウト: トークン削除 */
  logout: () => Promise<void>;
  /** アプリ起動時にSecureStoreからトークンを復元 */
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  login: async (token: string, user: User) => {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN, token);
    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
    set({ token: null, user: null });
  },

  restoreToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
      if (token) {
        // トークンが存在する場合はユーザー情報を取得
        const user = await getMe();
        set({ token, user, isLoading: false });
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
