export type SnapshotReason =
  | 'onboarding'
  | 'profile_update'
  | 'weekly_checkin'
  | 'measurement';

export type HealthSnapshot = {
  id: string;
  userId: string;
  createdAt: string;
  overallScore: number;
  bmiScore: number;
  whtrScore: number;
  bodyFatScore: number;
  activityScore: number;
  primaryFocus: string;
  coachRecommendationId: string;
  weightKg: number;
  waistCm: number;
  neckCm: number;
  engineVersion: string;
  snapshotReason: SnapshotReason;
  bodyFatPct: number | null;
  coachDurationMinutes: number | null;
  coachFrequencyPerWeek: number | null;
};

export type CreateSnapshotInput = {
  userId: string;
  overallScore: number;
  bmiScore: number;
  whtrScore: number;
  bodyFatScore: number;
  activityScore: number;
  primaryFocus: string;
  coachRecommendationId: string;
  weightKg: number;
  waistCm: number;
  neckCm: number;
  engineVersion: string;
  snapshotReason: SnapshotReason;
  bodyFatPct?: number | null;
  coachDurationMinutes?: number | null;
  coachFrequencyPerWeek?: number | null;
};
