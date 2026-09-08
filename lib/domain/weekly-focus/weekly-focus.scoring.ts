import {
  ACTIVITY_LEVEL_MOVEMENT_NEED,
  ACTIVITY_LEVEL_TRAINING_NEED,
  ALCOHOL_NEED,
  ALCOHOL_SELECTABLE_BUCKETS,
  HIGHER_BETTER_NEED,
  LESS_HEALTHY_FOOD_NEED,
  RECOVERY_ENERGY_CONTRIBUTION,
  RECOVERY_STRESS_CONTRIBUTION,
  TRAINING_FREQUENCY_NEED,
} from './weekly-focus.constants';
import { isHighTrainingLoad, type ResolvedWeeklyFocusSignals } from './weekly-focus.signals';
import type {
  WeeklyFocusAreaScore,
  WeeklyFocusNeedScore,
  WeeklyFocusScores,
} from './weekly-focus.types';

const unknownScore: WeeklyFocusAreaScore = { status: 'unknown' };

function known(needScore: WeeklyFocusNeedScore): WeeklyFocusAreaScore {
  return { status: 'known', needScore };
}

/** Stress / higher_worse 1–5 → need. Used for load qualification only. */
const HIGHER_WORSE_NEED: Record<1 | 2 | 3 | 4 | 5, WeeklyFocusNeedScore> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 5,
};

function mapRecoverySum(sum: number): WeeklyFocusNeedScore {
  if (sum <= 0) {
    return 0;
  }
  if (sum === 1) {
    return 1;
  }
  if (sum === 2) {
    return 2;
  }
  if (sum === 3) {
    return 3;
  }
  if (sum <= 5) {
    return 4;
  }
  return 5;
}

function clampNeed(value: number): WeeklyFocusNeedScore {
  if (value <= 0) {
    return 0;
  }
  if (value >= 5) {
    return 5;
  }
  return value as WeeklyFocusNeedScore;
}

export function scoreSleep(signals: ResolvedWeeklyFocusSignals): WeeklyFocusAreaScore {
  if (signals.sleepQuality == null) {
    return unknownScore;
  }
  return known(HIGHER_BETTER_NEED[signals.sleepQuality]);
}

export function scoreEverydayMovement(signals: ResolvedWeeklyFocusSignals): WeeklyFocusAreaScore {
  if (signals.everydayActivity != null) {
    return known(HIGHER_BETTER_NEED[signals.everydayActivity]);
  }
  if (signals.activityLevel != null) {
    return known(ACTIVITY_LEVEL_MOVEMENT_NEED[signals.activityLevel]);
  }
  return unknownScore;
}

export function scoreTraining(signals: ResolvedWeeklyFocusSignals): WeeklyFocusAreaScore {
  if (signals.trainingFrequency != null) {
    return known(TRAINING_FREQUENCY_NEED[signals.trainingFrequency]);
  }
  if (signals.activityLevel != null) {
    return known(ACTIVITY_LEVEL_TRAINING_NEED[signals.activityLevel]);
  }
  return unknownScore;
}

export function scoreNutrition(signals: ResolvedWeeklyFocusSignals): WeeklyFocusAreaScore {
  const eatingQuality = signals.eatingQuality;
  const frequency = signals.lessHealthyFoodFrequency;
  const eatingNeed = eatingQuality == null ? null : HIGHER_BETTER_NEED[eatingQuality];
  const freqNeed = frequency == null ? null : LESS_HEALTHY_FOOD_NEED[frequency];

  if (eatingNeed == null && freqNeed == null) {
    return unknownScore;
  }
  if (eatingNeed == null) {
    return known(freqNeed!);
  }

  let need = eatingNeed;
  if (freqNeed != null) {
    if (eatingQuality != null && eatingQuality >= 3) {
      const residual = freqNeed === 4 ? 2 : freqNeed === 3 ? 1 : 0;
      need = clampNeed(Math.min(3, eatingNeed + residual));
    } else if (freqNeed === 4) {
      need = clampNeed(Math.min(5, eatingNeed + 1));
    }
  }

  if (eatingQuality != null && eatingQuality >= 4) {
    need = clampNeed(Math.min(3, need));
  }

  return known(need);
}

export function scoreAlcohol(signals: ResolvedWeeklyFocusSignals): WeeklyFocusAreaScore {
  if (signals.alcoholConsumption == null) {
    return unknownScore;
  }
  return known(ALCOHOL_NEED[signals.alcoholConsumption]);
}

export function isAlcoholSelectable(signals: ResolvedWeeklyFocusSignals): boolean {
  return (
    signals.alcoholConsumption != null && ALCOHOL_SELECTABLE_BUCKETS.has(signals.alcoholConsumption)
  );
}

export type RecoveryScoreBreakdown = {
  score: WeeklyFocusAreaScore;
  independentNeed: WeeklyFocusNeedScore | null;
};

export function scoreRecovery(signals: ResolvedWeeklyFocusSignals): RecoveryScoreBreakdown {
  const hasStress = signals.stress != null;
  const hasEnergy = signals.energy != null;
  const hasSleep = signals.sleepQuality != null;

  if (!hasStress && !hasEnergy && !hasSleep) {
    return { score: unknownScore, independentNeed: null };
  }

  const stressContrib = hasStress ? RECOVERY_STRESS_CONTRIBUTION[signals.stress!] : 0;
  const energyContrib = hasEnergy ? RECOVERY_ENERGY_CONTRIBUTION[signals.energy!] : 0;
  const sleepContrib =
    hasSleep && (signals.sleepQuality === 1 || signals.sleepQuality === 2) ? 1 : 0;

  const energyNeed = hasEnergy ? HIGHER_BETTER_NEED[signals.energy!] : 0;
  const stressNeed = hasStress ? HIGHER_WORSE_NEED[signals.stress!] : 0;
  const hasIndependentSource = hasStress || hasEnergy;
  const loadQualifies =
    hasIndependentSource &&
    isHighTrainingLoad(signals.trainingFrequency, signals.activityLevel) &&
    (energyNeed >= 2 || stressNeed >= 3);
  const load = loadQualifies ? 1 : 0;

  const total = stressContrib + energyContrib + sleepContrib + load;
  const independent = stressContrib + energyContrib + load;

  return {
    score: known(mapRecoverySum(total)),
    independentNeed: mapRecoverySum(independent),
  };
}

export function resolveRecoveryConstraint(signals: ResolvedWeeklyFocusSignals): boolean {
  if (signals.stress != null && signals.stress >= 4) {
    return true;
  }
  if (signals.energy != null && signals.energy <= 2) {
    return true;
  }
  if (signals.sleepQuality != null && signals.sleepQuality <= 2) {
    return true;
  }
  if (signals.trainingFrequency === 'four_plus' && signals.energy != null && signals.energy <= 3) {
    return true;
  }
  return false;
}

export function scoreWeeklyFocusAreas(signals: ResolvedWeeklyFocusSignals): {
  scores: WeeklyFocusScores;
  recoveryIndependentNeed: WeeklyFocusNeedScore | null;
} {
  const recovery = scoreRecovery(signals);
  return {
    scores: {
      everyday_movement: scoreEverydayMovement(signals),
      training: scoreTraining(signals),
      sleep: scoreSleep(signals),
      nutrition: scoreNutrition(signals),
      alcohol: scoreAlcohol(signals),
      recovery: recovery.score,
    },
    recoveryIndependentNeed: recovery.independentNeed,
  };
}
