export type HealthScoreBreakdown = {
  bodyComposition: number | null;
  activity: number | null;
  recovery: number | null;
  consistency: number | null;
};

export type HealthScore = {
  id: string;
  userId: string;
  score: number;
  maxScore: number;
  breakdown: HealthScoreBreakdown;
  summary: string | null;
  calculatedAt: string;
};

export type HealthScoreTrend = {
  current: number;
  previous: number | null;
  delta: number | null;
  periodLabel: string;
};
