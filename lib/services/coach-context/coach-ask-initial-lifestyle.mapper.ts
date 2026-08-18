import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import {
  COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
  COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS,
  COACH_ASK_EATING_QUALITY_MEANINGS,
  COACH_ASK_ENERGY_MEANINGS,
  COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS,
  COACH_ASK_INITIAL_LIFESTYLE_SOURCE,
  COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND,
  COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS,
  COACH_ASK_SLEEP_QUALITY_MEANINGS,
  COACH_ASK_STRESS_MEANINGS,
  isCoachAskAlcoholConsumptionValue,
  isCoachAskLessHealthyFoodFrequencyValue,
  isCoachAskWeeklyCheckInScaleValue,
  type CoachAskInitialLifestyle,
  type CoachAskLessHealthyFoodFrequencyEntry,
} from '@/shared/coach-language';

function mapLessHealthyFoodFrequency(
  value: InitialLifestyleCheck['lessHealthyFoodFrequency'],
): CoachAskLessHealthyFoodFrequencyEntry | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isCoachAskLessHealthyFoodFrequencyValue(value)) {
    return undefined;
  }
  return {
    value,
    meaning: COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS[value],
    kind: COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND,
  };
}

/**
 * Projects a persisted Initial Lifestyle baseline onto the v1.3 Ask allowlist.
 * Never forwards id, userId, timestamps, or raw DB fields.
 * Legacy null nutrition is preserved; any unreadable required field fails closed.
 * Does not run the seven-field write validator.
 */
export function mapInitialLifestyleForCoachAsk(
  check: InitialLifestyleCheck,
): CoachAskInitialLifestyle | null {
  if (!isCoachAskWeeklyCheckInScaleValue(check.sleepQuality)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(check.energy)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(check.stress)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(check.everydayActivity)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(check.eatingQuality)) {
    return null;
  }
  if (!isCoachAskAlcoholConsumptionValue(check.alcoholConsumption)) {
    return null;
  }

  const lessHealthyFoodFrequency = mapLessHealthyFoodFrequency(check.lessHealthyFoodFrequency);
  if (lessHealthyFoodFrequency === undefined) {
    return null;
  }

  return {
    source: COACH_ASK_INITIAL_LIFESTYLE_SOURCE,
    sleepQuality: {
      value: check.sleepQuality,
      polarity: 'higher_better',
      meaning: COACH_ASK_SLEEP_QUALITY_MEANINGS[check.sleepQuality],
    },
    energy: {
      value: check.energy,
      polarity: 'higher_better',
      meaning: COACH_ASK_ENERGY_MEANINGS[check.energy],
    },
    stress: {
      value: check.stress,
      polarity: 'higher_worse',
      meaning: COACH_ASK_STRESS_MEANINGS[check.stress],
    },
    lessHealthyFoodFrequency,
    everydayActivity: {
      value: check.everydayActivity,
      polarity: 'higher_better',
      meaning: COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS[check.everydayActivity],
    },
    eatingQuality: {
      value: check.eatingQuality,
      polarity: 'higher_better',
      meaning: COACH_ASK_EATING_QUALITY_MEANINGS[check.eatingQuality],
    },
    alcoholConsumption: {
      value: check.alcoholConsumption,
      meaning: COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS[check.alcoholConsumption],
      kind: COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
    },
  };
}
