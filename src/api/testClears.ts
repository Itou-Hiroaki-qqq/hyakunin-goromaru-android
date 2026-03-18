import apiClient from './client';
import { API_ENDPOINTS } from '@/constants/api';
import type { TestClear } from '@/types/test';

export async function getTestClears(): Promise<TestClear[]> {
  const response = await apiClient.get<{ clears: { test_type: string; range: string }[] }>(API_ENDPOINTS.TEST_CLEARS);
  // バックエンドは range を返すが、アプリ内部では range_key を使う
  return (response.data.clears ?? []).map((c) => ({
    test_type: c.test_type,
    range_key: c.range,
    cleared_at: '',
  }));
}

export async function postTestClear(data: Omit<TestClear, 'cleared_at'>): Promise<void> {
  // バックエンドは { testType, range } を期待する
  await apiClient.post(API_ENDPOINTS.TEST_CLEARS, {
    testType: data.test_type,
    range: data.range_key,
  });
}
