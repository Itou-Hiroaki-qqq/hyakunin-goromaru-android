import apiClient from './client';
import { API_ENDPOINTS } from '@/constants/api';
import type { TestBestScore } from '@/types/test';

export async function getTestBestScores(): Promise<TestBestScore[]> {
  const response = await apiClient.get<{ scores: TestBestScore[] }>(API_ENDPOINTS.TEST_BEST_SCORES);
  return response.data.scores ?? [];
}

export async function postTestBestScore(
  data: Omit<TestBestScore, 'updated_at'>,
): Promise<TestBestScore> {
  const response = await apiClient.post<{ score: TestBestScore }>(
    API_ENDPOINTS.TEST_BEST_SCORES,
    data,
  );
  return response.data.score;
}
