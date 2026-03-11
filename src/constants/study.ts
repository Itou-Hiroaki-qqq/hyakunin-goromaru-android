// Studyモードの6ステップ定義
export const STUDY_STEPS = [
  { id: 1, label: '上の句（漢字）', description: '上の句を漢字で確認' },
  { id: 2, label: '上の句（ひらがな）', description: '上の句をひらがなで逐字確認' },
  { id: 3, label: '下の句', description: '下の句を確認' },
  { id: 4, label: '語呂（上）', description: '上の句の語呂合わせ' },
  { id: 5, label: '語呂（下）', description: '下の句の語呂合わせ' },
  { id: 6, label: '語呂まとめ', description: '語呂合わせを通しで確認' },
] as const;

export const TOTAL_STEPS = STUDY_STEPS.length;

// Studyモードの逐字アニメーション間隔（ミリ秒）
export const TYPEWRITER_INTERVAL_MS = 120;

// Battle難易度定義（AI回答時間、秒）
export const BATTLE_DIFFICULTIES = {
  BEGINNER: { label: '初級', aiTimeSeconds: 4, key: 'beginner' },
  INTERMEDIATE: { label: '中級', aiTimeSeconds: 2, key: 'intermediate' },
  ADVANCED: { label: '上級', aiTimeSeconds: 0.5, key: 'advanced' },
} as const;

export type BattleDifficultyKey = keyof typeof BATTLE_DIFFICULTIES;

// Battle問題数の選択肢
export const BATTLE_QUESTION_COUNTS = [20, 40, 60, 80, 100] as const;

// カラーテーマ
export const COLORS = {
  primary: '#f5a623',      // 琥珀色メイン
  primaryDark: '#d4841a',  // 琥珀色ダーク
  highlight: '#dc2626',    // 語呂ハイライト（赤）
  correct: '#22c55e',      // 正解（緑）
  incorrect: '#ef4444',    // 不正解（赤）
  background: '#fffbf0',   // 背景（クリーム色）
  surface: '#ffffff',      // カード背景
  textPrimary: '#1a1a1a',  // 主要テキスト
  textSecondary: '#666666', // 補助テキスト
  border: '#f5a623',       // ボーダー（琥珀色）
} as const;
