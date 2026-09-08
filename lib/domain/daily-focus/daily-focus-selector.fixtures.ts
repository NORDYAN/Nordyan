import type { WeeklyFocusArea } from '../weekly-focus';

import { DAILY_FOCUS_ACTION_BANK } from './daily-focus-action-bank';
import { addDailyFocusCalendarDays, selectDailyFocus } from './daily-focus-selector';
import type {
  DailyFocusHistoryEntry,
  DailyFocusSelectorFocus,
  DailyFocusSelectorInput,
  DailyFocusSelectorResult,
} from './daily-focus-selector.types';
import type { DailyFocusIntensity } from './daily-focus.types';

export const SELECTOR_WEEK_START = '2026-03-02';

export function selectorFocus(
  area: WeeklyFocusArea,
  mode: 'improve' | 'maintain',
  needScore: 0 | 1 | 2 | 3 | 4 | 5,
): DailyFocusSelectorFocus {
  return { area, mode, needScore };
}

export function selectorWeeklyFocus(options: {
  focuses: readonly [DailyFocusSelectorFocus, DailyFocusSelectorFocus];
  recoveryConstraint?: boolean;
  weekStartDate?: string;
}): DailyFocusSelectorInput['weeklyFocus'] {
  return {
    weekStartDate: options.weekStartDate ?? SELECTOR_WEEK_START,
    focuses: options.focuses,
    recoveryConstraint: options.recoveryConstraint ?? false,
    engineVersion: '1.0.0',
  };
}

export function selectorInput(
  weekly: DailyFocusSelectorInput['weeklyFocus'],
  overrides: Partial<DailyFocusSelectorInput> = {},
): DailyFocusSelectorInput {
  return {
    weeklyFocus: weekly,
    localDate: overrides.localDate ?? SELECTOR_WEEK_START,
    history: overrides.history ?? [],
    selectionSeed: overrides.selectionSeed ?? 'seed-a',
    selectionReason: overrides.selectionReason,
    context: overrides.context,
  };
}

export function historyEntry(
  localDate: string,
  actionId: string,
  extras: Partial<DailyFocusHistoryEntry> = {},
): DailyFocusHistoryEntry {
  const action = DAILY_FOCUS_ACTION_BANK.find((item) => item.id === actionId);
  if (!action) {
    throw new Error(`Unknown action ${actionId}`);
  }
  return {
    localDate,
    actionId,
    behaviorFamily: extras.behaviorFamily ?? action.behaviorFamily,
    focusArea: extras.focusArea ?? action.focusArea,
    intensity: extras.intensity ?? action.intensity,
    swappedFromActionId: extras.swappedFromActionId,
    swappedFromBehaviorFamily: extras.swappedFromBehaviorFamily,
    swappedFromFocusArea: extras.swappedFromFocusArea,
    swappedFromIntensity: extras.swappedFromIntensity,
    completed: extras.completed,
  };
}

export type SimulatedDay = {
  localDate: string;
  result: DailyFocusSelectorResult;
};

export function simulateDays(
  weekly: DailyFocusSelectorInput['weeklyFocus'],
  startDate: string,
  dayCount: number,
  options: {
    selectionSeed?: string;
    context?: DailyFocusSelectorInput['context'];
    completed?: boolean;
  } = {},
): SimulatedDay[] {
  const history: DailyFocusHistoryEntry[] = [];
  const days: SimulatedDay[] = [];
  for (let offset = 0; offset < dayCount; offset += 1) {
    const localDate = addDailyFocusCalendarDays(startDate, offset);
    const result = selectDailyFocus(
      selectorInput(weekly, {
        localDate,
        history,
        selectionSeed: options.selectionSeed ?? 'seed-a',
        context: options.context,
      }),
    );
    days.push({ localDate, result });
    history.push({
      localDate,
      actionId: result.actionId,
      behaviorFamily: result.behaviorFamily,
      focusArea: result.focusArea,
      intensity: result.intensity,
      completed: options.completed,
    });
  }
  return days;
}

export function byId(actionId: string) {
  const action = DAILY_FOCUS_ACTION_BANK.find((item) => item.id === actionId);
  if (!action) {
    throw new Error(`Unknown action ${actionId}`);
  }
  return action;
}

export function sleepNutritionImprove(recoveryConstraint = false) {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('sleep', 'improve', 5), selectorFocus('nutrition', 'improve', 4)],
    recoveryConstraint,
  });
}

export function movementImproveSleepMaintain() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('everyday_movement', 'improve', 4), selectorFocus('sleep', 'maintain', 0)],
  });
}

export function trainingNutritionImprove(recoveryConstraint = false) {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('training', 'improve', 3), selectorFocus('nutrition', 'improve', 4)],
    recoveryConstraint,
  });
}

export function trainingRecoveryImprove() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('training', 'improve', 3), selectorFocus('recovery', 'improve', 5)],
    recoveryConstraint: true,
  });
}

export function sleepRecoveryImprove() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('sleep', 'improve', 5), selectorFocus('recovery', 'improve', 5)],
    recoveryConstraint: true,
  });
}

export function alcoholSleepImprove() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('alcohol', 'improve', 4), selectorFocus('sleep', 'improve', 3)],
  });
}

export function alcoholMovementMaintain() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('alcohol', 'improve', 3), selectorFocus('everyday_movement', 'maintain', 0)],
  });
}

export function healthyMaintain() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('everyday_movement', 'maintain', 0), selectorFocus('sleep', 'maintain', 0)],
  });
}

export function nutritionTrainingMaintain() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('nutrition', 'maintain', 0), selectorFocus('training', 'maintain', 0)],
  });
}

export function highNeedNutritionLowMovement() {
  return selectorWeeklyFocus({
    focuses: [selectorFocus('nutrition', 'improve', 5), selectorFocus('everyday_movement', 'improve', 3)],
  });
}

export const FROZEN_ACTION_BANK_IDS = DAILY_FOCUS_ACTION_BANK.map((action) => action.id);

export function isChallenge(intensity: DailyFocusIntensity): boolean {
  return intensity === 'challenge';
}
