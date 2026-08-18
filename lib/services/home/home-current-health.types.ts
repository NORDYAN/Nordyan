import type { FocusType } from '@/lib/domain/focus-engine';
import type { SnapshotReason } from '@/lib/domain/snapshot';
import type { ProductionCoachLanguageSource } from '@/lib/services/coach-language';

export type HomeCurrentHealthSource = 'snapshot' | 'profile_fallback';

export type HomeFieldAvailability = 'available' | 'unavailable';

export type HomeCurrentHealth = {
  source: HomeCurrentHealthSource;
  snapshotId?: string;
  snapshotReason?: SnapshotReason;
  capturedAt?: string;

  healthScore: {
    score: number;
    subtitle: string;
  };

  metrics: {
    weightKg: number;
    weightDisplay: string;
    weightSourceLabel: string;
    bodyFatPct: number | null;
    bodyFatDisplay: string;
    bodyFatSourceLabel: string;
    bodyFatAvailability: HomeFieldAvailability;
  };

  focus: {
    primaryFocus: FocusType;
    title: string;
    subtitle: string;
  };

  coach: {
    recommendationId: string | null;
    title: string | null;
    message: string;
    availability: HomeFieldAvailability;
    /** Privacy-safe decision surface for async language formulation (no PII). */
    languageSource: ProductionCoachLanguageSource | null;
  };
};

export type HomeCurrentHealthState =
  | { status: 'loading' }
  | { status: 'ready'; data: HomeCurrentHealth }
  | { status: 'empty' }
  | { status: 'error'; message: string };
