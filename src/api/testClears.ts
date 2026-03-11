import apiClient from './client';
import { API_ENDPOINTS } from '@/constants/api';
import type { TestClear } from '@/types/test';

export async function getTestClears(): Promise<TestClear[]> {
  const response = await apiClient.get<{ clears: TestClear[] }>(API_ENDPOINTS.TEST_CLEARS);
  return response.data.clears ?? [];
}

export async function postTestClear(data: Omit<TestClear, 'cleared_at'>): Promise<TestClear> {
  const response = await apiClient.post<{ clear: TestClear }>(API_ENDPOINTS.TEST_CLEARS, data);
  return response.data.clear;
}
