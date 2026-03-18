import apiClient from './client';
import { API_ENDPOINTS } from '@/constants/api';
import type { TestBestScore } from '@/types/test';

export async function getTestBestScores(): Promise<TestBestScore[]> {
  const response = await apiClient.get<{ scores: Record<string, number> }>(API_ENDPOINTS.TEST_BEST_SCORES);
  const scoresMap = response.data.scores ?? {};
  return Object.entries(scoresMap).map(([test_key, best_score]) => ({
    test_key,
    best_score,
    updated_at: '',
  }));
}

export async function postTestBestScore(
  data: Omit<TestBestScore, 'updated_at'>,
): Promise<void> {
  // バックエンドは { testKey, score } を期待する
  await apiClient.post(API_ENDPOINTS.TEST_BEST_SCORES, {
    testKey: data.test_key,
    score: data.best_score,
  });
}
