import type { FocusType } from '@/lib/domain/focus-engine';
import type { SnapshotReason } from '@/lib/domain/snapshot';

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
  };
};

export type HomeCurrentHealthState =
  | { status: 'loading' }
  | { status: 'ready'; data: HomeCurrentHealth }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export const HOME_CURRENT_HEALTH_EMPTY_MESSAGE =
  'Din hälsodata är inte tillgänglig ännu.';

export const HOME_BODY_FAT_UNAVAILABLE_LABEL = 'Ingen sparad uppskattning';

export const HOME_COACH_UNAVAILABLE_MESSAGE =
  'Dagens rekommendation är inte tillgänglig för den här hälsosnapshoten.';

export const HOME_WEIGHT_SNAPSHOT_LABEL = 'Senaste mätningen';

export const HOME_WEIGHT_PROFILE_LABEL = 'Från din hälsoprofil';

export const HOME_BODY_FAT_SNAPSHOT_LABEL = 'Beräknat från senaste mätningen';

export const HOME_BODY_FAT_PROFILE_LABEL = 'Uppskattat från din hälsoprofil';
