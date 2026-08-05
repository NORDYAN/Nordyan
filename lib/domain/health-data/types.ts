export type HealthMetricType =
  | 'weight'
  | 'body_fat'
  | 'sleep'
  | 'steps'
  | 'waist'
  | 'neck';

export type HealthMetricSource = 'manual' | 'garmin' | 'healthkit' | 'calculated';

export type HealthMetric = {
  id: string;
  userId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  recordedAt: string;
  source: HealthMetricSource;
};

export type DailyHealthSummary = {
  userId: string;
  date: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  sleepMinutes: number | null;
  stepCount: number | null;
};
