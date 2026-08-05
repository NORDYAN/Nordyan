import type { HealthScoreInput } from '@/lib/domain/health-score';
import type { Measurement } from '@/lib/domain/measurement';
import type { UserProfile } from '@/lib/domain/profile';

import {
  mapProfileActivityLevel,
  mapProfileToHealthScoreInput,
} from './health-score.mapper';

type MeasurementBodyFields = Pick<
  Measurement,
  'weightKg' | 'waistCm' | 'neckCm' | 'measuredAt'
>;

/**
 * Merges stable profile fields with body measurements from a persisted measurement event.
 * Returns null when required profile context is missing for engine input.
 */
export function mapProfileAndMeasurementToHealthScoreInput(
  profile: UserProfile,
  measurement: MeasurementBodyFields,
): HealthScoreInput | null {
  const profileInput = mapProfileToHealthScoreInput(profile, measurement.measuredAt);
  if (!profileInput) {
    return null;
  }

  return {
    ...profileInput,
    weightKg: measurement.weightKg,
    waistCm: measurement.waistCm,
    neckCm: measurement.neckCm,
    asOfDate: measurement.measuredAt,
  };
}
