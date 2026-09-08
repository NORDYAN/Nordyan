import type { FocusType } from '@/lib/domain/focus-engine';
import type {
  InitialLifestyleAlcoholConsumption,
  InitialLifestyleLessHealthyFoodFrequency,
  InitialLifestyleScale,
} from '@/lib/domain/initial-lifestyle';
import type { ProfileActivityLevel } from '@/lib/domain/profile';
import type {
  WeeklyCheckInAlcoholConsumption,
  WeeklyCheckInScale,
  WeeklyCheckInTrainingFrequency,
} from '@/lib/domain/weekly-check-in';

import { FOCUS_TYPES } from './weekly-focus.constants';
import type { WeeklyFocusEngineInput } from './weekly-focus.types';

function pickFresh<T>(weekly: T | null | undefined, baseline: T | null | undefined): T | null {
  if (weekly !== undefined && weekly !== null) {
    return weekly;
  }
  if (baseline !== undefined && baseline !== null) {
    return baseline;
  }
  return null;
}

export type ResolvedWeeklyFocusSignals = {
  sleepQuality: WeeklyCheckInScale | InitialLifestyleScale | null;
  energy: WeeklyCheckInScale | InitialLifestyleScale | null;
  stress: WeeklyCheckInScale | InitialLifestyleScale | null;
  everydayActivity: WeeklyCheckInScale | InitialLifestyleScale | null;
  eatingQuality: WeeklyCheckInScale | InitialLifestyleScale | null;
  alcoholConsumption: WeeklyCheckInAlcoholConsumption | InitialLifestyleAlcoholConsumption | null;
  trainingFrequency: WeeklyCheckInTrainingFrequency | null;
  lessHealthyFoodFrequency: InitialLifestyleLessHealthyFoodFrequency | null;
  activityLevel: ProfileActivityLevel | null;
  primaryFocus: FocusType | null;
};

export function isFocusType(value: string | null | undefined): value is FocusType {
  return value != null && (FOCUS_TYPES as readonly string[]).includes(value);
}

export function resolveWeeklyFocusSignals(input: WeeklyFocusEngineInput): ResolvedWeeklyFocusSignals {
  const weekly = input.weeklyCheckIn ?? null;
  const lifestyle = input.initialLifestyle ?? null;
  const rawPrimaryFocus = input.primaryFocus ?? null;

  return {
    sleepQuality: pickFresh(weekly?.sleepQuality, lifestyle?.sleepQuality),
    energy: pickFresh(weekly?.energy, lifestyle?.energy),
    stress: pickFresh(weekly?.stress, lifestyle?.stress),
    everydayActivity: pickFresh(weekly?.everydayActivity, lifestyle?.everydayActivity),
    eatingQuality: pickFresh(weekly?.eatingQuality, lifestyle?.eatingQuality),
    alcoholConsumption: pickFresh(weekly?.alcoholConsumption, lifestyle?.alcoholConsumption),
    trainingFrequency: weekly?.trainingFrequency ?? null,
    lessHealthyFoodFrequency: lifestyle?.lessHealthyFoodFrequency ?? null,
    activityLevel: input.activityLevel ?? null,
    primaryFocus: isFocusType(rawPrimaryFocus) ? rawPrimaryFocus : null,
  };
}

export function isHighTrainingLoad(
  trainingFrequency: WeeklyCheckInTrainingFrequency | null,
  activityLevel: ProfileActivityLevel | null,
): boolean {
  if (trainingFrequency === 'four_plus') {
    return true;
  }
  return activityLevel === 'very_active' || activityLevel === 'extra_active';
}
