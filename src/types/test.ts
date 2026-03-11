export interface TestClear {
  test_type: string;
  range_key: string;
  cleared_at: string;
}

export interface TestBestScore {
  test_key: string;
  best_score: number;
  updated_at: string;
}
