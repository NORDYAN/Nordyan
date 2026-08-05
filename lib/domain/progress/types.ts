export type ProgressTrend = 'improving' | 'declining' | 'stable' | 'insufficient_history';

export type ProgressComparisonType = 'latest_vs_previous';

export type ProgressComparison = {
  type: ProgressComparisonType;
  snapshotsCompared: 2;
};

export type ProgressSummary =
  | {
      trend: 'insufficient_history';
    }
  | {
      trend: Exclude<ProgressTrend, 'insufficient_history'>;
      comparison: ProgressComparison;
      currentScore: number;
      previousScore: number;
      scoreChange: number;
      weightChange: number;
      waistChange: number;
      neckChange: number;
    };
