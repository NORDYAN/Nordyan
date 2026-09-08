import type { CoachQuickQuestionScaleSignal, CoachQuickQuestionSignals } from './coach-quick-question.types';

const absent: CoachQuickQuestionScaleSignal = {
  available: false,
  weak: false,
  fromWeeklyCheckIn: false,
};

export function moderateSignal(fromWeeklyCheckIn: boolean): CoachQuickQuestionScaleSignal {
  return { available: true, weak: false, fromWeeklyCheckIn };
}

export function weakSignal(fromWeeklyCheckIn: boolean): CoachQuickQuestionScaleSignal {
  return { available: true, weak: true, fromWeeklyCheckIn };
}

export function sparseNewUserSignals(): CoachQuickQuestionSignals {
  return {
    hasHealthContext: true,
    healthScoreAvailable: true,
    healthScoreChangeComparable: false,
    healthScoreDeclined: false,
    developmentComparable: false,
    waistCurrent: true,
    waistComparable: false,
    weightCurrent: true,
    weightComparable: false,
    bodyFatPresentable: false,
    bodyFatReferenceReady: false,
    focusType: 'maintain_current_path',
    weeklyFocusImproveAreas: [],
    sleep: moderateSignal(false),
    energy: moderateSignal(false),
    stress: moderateSignal(false),
    everydayActivity: moderateSignal(false),
    training: absent,
    eating: moderateSignal(false),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: false },
    nutritionBaseline: true,
  };
}

export function bodyCompositionConcernSignals(): CoachQuickQuestionSignals {
  return {
    hasHealthContext: true,
    healthScoreAvailable: true,
    healthScoreChangeComparable: true,
    healthScoreDeclined: false,
    developmentComparable: true,
    waistCurrent: true,
    waistComparable: true,
    weightCurrent: true,
    weightComparable: false,
    bodyFatPresentable: true,
    bodyFatReferenceReady: true,
    focusType: 'improve_body_composition',
    weeklyFocusImproveAreas: [],
    sleep: moderateSignal(true),
    energy: moderateSignal(true),
    stress: moderateSignal(true),
    everydayActivity: moderateSignal(true),
    training: moderateSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: true },
    nutritionBaseline: true,
  };
}

export function poorSleepSignals(): CoachQuickQuestionSignals {
  return {
    ...sparseNewUserSignals(),
    focusType: 'improve_activity',
    sleep: weakSignal(true),
    energy: moderateSignal(true),
    stress: moderateSignal(true),
    everydayActivity: moderateSignal(true),
    training: moderateSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: true },
    weeklyFocusImproveAreas: ['sleep'],
  };
}

export function highStressLowEnergySignals(): CoachQuickQuestionSignals {
  return {
    ...sparseNewUserSignals(),
    focusType: 'maintain_current_path',
    sleep: moderateSignal(true),
    energy: weakSignal(true),
    stress: weakSignal(true),
    everydayActivity: moderateSignal(true),
    training: moderateSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: true },
    weeklyFocusImproveAreas: ['recovery'],
  };
}

export function lowEverydayActivitySignals(): CoachQuickQuestionSignals {
  return {
    ...sparseNewUserSignals(),
    focusType: 'improve_activity',
    sleep: moderateSignal(true),
    energy: moderateSignal(true),
    stress: moderateSignal(true),
    everydayActivity: weakSignal(true),
    training: moderateSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: true },
    weeklyFocusImproveAreas: ['everyday_movement'],
  };
}

export function littleTrainingSignals(): CoachQuickQuestionSignals {
  return {
    ...sparseNewUserSignals(),
    focusType: 'maintain_current_path',
    sleep: moderateSignal(true),
    energy: moderateSignal(true),
    stress: moderateSignal(true),
    everydayActivity: moderateSignal(true),
    training: weakSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: true },
    weeklyFocusImproveAreas: ['training'],
  };
}

export function elevatedAlcoholSignals(): CoachQuickQuestionSignals {
  return {
    ...sparseNewUserSignals(),
    focusType: 'maintain_current_path',
    sleep: moderateSignal(true),
    energy: moderateSignal(true),
    stress: moderateSignal(true),
    everydayActivity: moderateSignal(true),
    training: moderateSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: true, fromWeeklyCheckIn: true },
    weeklyFocusImproveAreas: ['alcohol'],
  };
}

export function healthyMaintainSignals(): CoachQuickQuestionSignals {
  return {
    hasHealthContext: true,
    healthScoreAvailable: true,
    healthScoreChangeComparable: true,
    healthScoreDeclined: false,
    developmentComparable: true,
    waistCurrent: true,
    waistComparable: true,
    weightCurrent: true,
    weightComparable: true,
    bodyFatPresentable: true,
    bodyFatReferenceReady: true,
    focusType: 'maintain_current_path',
    weeklyFocusImproveAreas: [],
    sleep: moderateSignal(true),
    energy: moderateSignal(true),
    stress: moderateSignal(true),
    everydayActivity: moderateSignal(true),
    training: moderateSignal(true),
    eating: moderateSignal(true),
    alcohol: { available: true, elevated: false, fromWeeklyCheckIn: true },
    nutritionBaseline: true,
  };
}

export function noSleepEvidenceSignals(): CoachQuickQuestionSignals {
  return {
    ...sparseNewUserSignals(),
    sleep: absent,
    energy: absent,
    stress: absent,
    everydayActivity: absent,
    eating: absent,
    alcohol: { available: false, elevated: false, fromWeeklyCheckIn: false },
    nutritionBaseline: false,
  };
}
