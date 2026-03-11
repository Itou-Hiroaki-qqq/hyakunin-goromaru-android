import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, SECURE_STORE_KEYS } from '@/constants/api';

// axiosインスタンス作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: JWTトークンを自動付与
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStoreエラーは無視（未認証状態として続行）
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// レスポンスインターセプター: 401エラー時のトークン削除 + 認証状態リセット
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 認証エラー時はトークンを削除し、認証状態をリセット
      try {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
        const { useAuthStore } = await import('@/stores/authStore');
        useAuthStore.getState().logout();
      } catch {
        // 削除エラーは無視
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
