import type { HealthScoreInput } from '@/lib/domain/health-score';
import type { Measurement } from '@/lib/domain/measurement';
import { resolveOptionalHipCm } from '@/lib/domain/measurement/hip-cm';
import type { UserProfile } from '@/lib/domain/profile';

import {
  getLocalCalendarDate,
  mapProfileToHealthScoreInput,
} from './health-score.mapper';

type MeasurementBodyFields = Pick<
  Measurement,
  'weightKg' | 'waistCm' | 'neckCm' | 'hipCm' | 'measuredAt'
>;

/**
 * Merges stable profile fields with body measurements from a persisted measurement event.
 * Returns null when required profile context is missing for engine input.
 */
export function mapProfileAndMeasurementToHealthScoreInput(
  profile: UserProfile,
  measurement: MeasurementBodyFields,
  asOfDate: string = measurement.measuredAt,
): HealthScoreInput | null {
  const profileInput = mapProfileToHealthScoreInput(profile, asOfDate);
  if (!profileInput) {
    return null;
  }

  const hipCm = resolveOptionalHipCm(measurement.hipCm);

  return {
    ...profileInput,
    weightKg: measurement.weightKg,
    waistCm: measurement.waistCm,
    neckCm: measurement.neckCm,
    asOfDate,
    ...(hipCm !== undefined ? { hipCm } : {}),
  };
}

/**
 * Profile-update scoring: current profile fields (sex, DOB/age, height, activity)
 * with the latest real measurement's body composition when one exists.
 * Weight follows the existing measurement-merge mapper, not a new policy.
 */
export function mapProfileUpdateToHealthScoreInput(
  profile: UserProfile,
  latestMeasurement: MeasurementBodyFields | null,
  asOfDate: string = getLocalCalendarDate(),
): HealthScoreInput | null {
  if (!latestMeasurement) {
    return mapProfileToHealthScoreInput(profile, asOfDate);
  }

  return mapProfileAndMeasurementToHealthScoreInput(profile, latestMeasurement, asOfDate);
}
