import type { WeeklyCheckIn, WeeklyCheckInAnswers } from '@/lib/domain/weekly-check-in';
import {
  COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
  COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS,
  COACH_ASK_EATING_QUALITY_MEANINGS,
  COACH_ASK_ENERGY_MEANINGS,
  COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS,
  COACH_ASK_PLAN_ADHERENCE_MEANINGS,
  COACH_ASK_SLEEP_QUALITY_MEANINGS,
  COACH_ASK_STRESS_MEANINGS,
  COACH_ASK_TRAINING_FREQUENCY_KIND,
  COACH_ASK_TRAINING_FREQUENCY_MEANINGS,
  COACH_ASK_WEEKLY_CHECK_IN_SOURCE,
  isCoachAskAlcoholConsumptionValue,
  isCoachAskTrainingFrequencyValue,
  isCoachAskWeeklyCheckInScaleValue,
  type CoachAskWeeklyCheckIn,
} from '@/shared/coach-language';

/**
 * Projects a current-week Weekly Check-in onto the v1.2 Ask allowlist.
 * Never forwards id, userId, weekStartDate, timestamps, or raw DB fields.
 * Returns null on any unmappable field (fail closed for enrichment).
 */
export function mapWeeklyCheckInForCoachAsk(
  checkIn: WeeklyCheckIn | WeeklyCheckInAnswers,
): CoachAskWeeklyCheckIn | null {
  if (!isCoachAskWeeklyCheckInScaleValue(checkIn.sleepQuality)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(checkIn.energy)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(checkIn.stress)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(checkIn.everydayActivity)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(checkIn.eatingQuality)) {
    return null;
  }
  if (!isCoachAskWeeklyCheckInScaleValue(checkIn.planAdherence)) {
    return null;
  }
  if (!isCoachAskTrainingFrequencyValue(checkIn.trainingFrequency)) {
    return null;
  }
  if (!isCoachAskAlcoholConsumptionValue(checkIn.alcoholConsumption)) {
    return null;
  }

  return {
    source: COACH_ASK_WEEKLY_CHECK_IN_SOURCE,
    sleepQuality: {
      value: checkIn.sleepQuality,
      polarity: 'higher_better',
      meaning: COACH_ASK_SLEEP_QUALITY_MEANINGS[checkIn.sleepQuality],
    },
    energy: {
      value: checkIn.energy,
      polarity: 'higher_better',
      meaning: COACH_ASK_ENERGY_MEANINGS[checkIn.energy],
    },
    stress: {
      value: checkIn.stress,
      polarity: 'higher_worse',
      meaning: COACH_ASK_STRESS_MEANINGS[checkIn.stress],
    },
    trainingFrequency: {
      value: checkIn.trainingFrequency,
      meaning: COACH_ASK_TRAINING_FREQUENCY_MEANINGS[checkIn.trainingFrequency],
      kind: COACH_ASK_TRAINING_FREQUENCY_KIND,
    },
    everydayActivity: {
      value: checkIn.everydayActivity,
      polarity: 'higher_better',
      meaning: COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS[checkIn.everydayActivity],
    },
    eatingQuality: {
      value: checkIn.eatingQuality,
      polarity: 'higher_better',
      meaning: COACH_ASK_EATING_QUALITY_MEANINGS[checkIn.eatingQuality],
    },
    alcoholConsumption: {
      value: checkIn.alcoholConsumption,
      meaning: COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS[checkIn.alcoholConsumption],
      kind: COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
    },
    planAdherence: {
      value: checkIn.planAdherence,
      polarity: 'higher_better',
      meaning: COACH_ASK_PLAN_ADHERENCE_MEANINGS[checkIn.planAdherence],
    },
  };
}
