import apiClient from './client';
import { API_ENDPOINTS } from '@/constants/api';
import type { Poem } from '@/types/poem';

interface GetPoemsParams {
  from: number;
  to: number;
}

export async function getPoems(params: GetPoemsParams): Promise<Poem[]> {
  const response = await apiClient.get<Poem[]>(API_ENDPOINTS.POEMS, {
    params: { from: params.from, to: params.to },
  });
  return response.data;
}

// 全100首を取得
export async function getAllPoems(): Promise<Poem[]> {
  return getPoems({ from: 1, to: 100 });
}
