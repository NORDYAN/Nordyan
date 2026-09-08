import type { CoachAskFocusType } from '@/shared/coach-language';
import type {
  CoachAskBodyComposition,
  CoachAskBodyFatReference,
  CoachAskInitialLifestyle,
  CoachAskWeeklyCheckIn,
} from '@/shared/coach-language';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';
import type { DevelopmentHomeSummary } from '@/lib/services/development';
import type {
  CoachQuickQuestionScaleSignal,
  CoachQuickQuestionSignals,
} from '@/lib/domain/coach-quick-questions';

const absent: CoachQuickQuestionScaleSignal = {
  available: false,
  weak: false,
  fromWeeklyCheckIn: false,
};

function higherBetterSignal(
  value: number | null | undefined,
  fromWeeklyCheckIn: boolean,
): CoachQuickQuestionScaleSignal {
  if (value == null) {
    return absent;
  }
  return {
    available: true,
    weak: value <= 2,
    fromWeeklyCheckIn,
  };
}

function stressSignal(
  value: number | null | undefined,
  fromWeeklyCheckIn: boolean,
): CoachQuickQuestionScaleSignal {
  if (value == null) {
    return absent;
  }
  return {
    available: true,
    weak: value >= 4,
    fromWeeklyCheckIn,
  };
}

function pickScale(
  weekly: number | null | undefined,
  initial: number | null | undefined,
  map: (value: number | null | undefined, fromWeeklyCheckIn: boolean) => CoachQuickQuestionScaleSignal,
): CoachQuickQuestionScaleSignal {
  if (weekly != null) {
    return map(weekly, true);
  }
  return map(initial, false);
}

export type CoachQuickQuestionSignalInput = {
  hasHealthContext: boolean;
  focusType: CoachAskFocusType | null;
  development: DevelopmentHomeSummary;
  weeklyCheckIn: CoachAskWeeklyCheckIn | null;
  initialLifestyle: CoachAskInitialLifestyle | null;
  bodyComposition: CoachAskBodyComposition;
  bodyFatReference: CoachAskBodyFatReference;
  weeklyFocusImproveAreas?: readonly WeeklyFocusArea[];
};

export function mapCoachQuickQuestionSignals(
  input: CoachQuickQuestionSignalInput,
): CoachQuickQuestionSignals {
  const developmentReady = input.development.status === 'ready';
  const weekly = input.weeklyCheckIn;
  const initial = input.initialLifestyle;
  const trainingValue = weekly?.trainingFrequency.value;
  const alcoholValue = weekly?.alcoholConsumption.value ?? initial?.alcoholConsumption.value;
  const alcoholFromWeekly = weekly != null;

  return {
    hasHealthContext: input.hasHealthContext,
    healthScoreAvailable: developmentReady,
    healthScoreChangeComparable:
      developmentReady && input.development.scoreChange.status === 'ready',
    healthScoreDeclined:
      developmentReady &&
      input.development.scoreChange.status === 'ready' &&
      input.development.scoreChange.change < 0,
    developmentComparable:
      developmentReady &&
      input.development.trend !== 'insufficient_history' &&
      input.development.scoreChange.status === 'ready',
    waistCurrent:
      developmentReady &&
      (input.development.waist.status === 'ready' || input.development.waist.current != null),
    waistComparable: developmentReady && input.development.waist.status === 'ready',
    weightCurrent:
      developmentReady &&
      (input.development.weight.status === 'ready' || input.development.weight.current != null),
    weightComparable: developmentReady && input.development.weight.status === 'ready',
    bodyFatPresentable: input.bodyComposition.status === 'ready',
    bodyFatReferenceReady: input.bodyFatReference.status === 'ready',
    focusType: input.focusType,
    weeklyFocusImproveAreas: input.weeklyFocusImproveAreas ?? [],
    sleep: pickScale(weekly?.sleepQuality.value, initial?.sleepQuality.value, higherBetterSignal),
    energy: pickScale(weekly?.energy.value, initial?.energy.value, higherBetterSignal),
    stress: pickScale(weekly?.stress.value, initial?.stress.value, stressSignal),
    everydayActivity: pickScale(
      weekly?.everydayActivity.value,
      initial?.everydayActivity.value,
      higherBetterSignal,
    ),
    training:
      trainingValue == null
        ? absent
        : {
            available: true,
            weak: trainingValue === 'none' || trainingValue === 'once',
            fromWeeklyCheckIn: true,
          },
    eating: pickScale(weekly?.eatingQuality.value, initial?.eatingQuality.value, higherBetterSignal),
    alcohol: {
      available: alcoholValue != null,
      elevated: alcoholValue === '8_14' || alcoholValue === '15_plus',
      fromWeeklyCheckIn: alcoholFromWeekly,
    },
    nutritionBaseline:
      initial?.eatingQuality != null || initial?.lessHealthyFoodFrequency != null,
  };
}
