// APIベースURL は EXPO_PUBLIC_API_URL 環境変数から読み取る
// .env ファイルに EXPO_PUBLIC_API_URL=https://your-api.workers.dev を設定すること
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL が設定されていません。.env ファイルを確認してください。'
  );
}
export const API_BASE_URL = apiUrl;

export const API_ENDPOINTS = {
  POEMS: '/api/poems',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  TEST_CLEARS: '/api/test-clears',
  TEST_BEST_SCORES: '/api/test-best-scores',
} as const;

// expo-secure-store のキー
export const SECURE_STORE_KEYS = {
  AUTH_TOKEN: 'auth_token',
} as const;
