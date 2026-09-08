import type {
  WeeklyFocusCheckInInput,
  WeeklyFocusEngineInput,
  WeeklyFocusLifestyleInput,
  WeeklyFocusSelectedArea,
} from './weekly-focus.types';

export function healthyLifestyle(
  overrides: Partial<WeeklyFocusLifestyleInput> = {},
): WeeklyFocusLifestyleInput {
  return {
    sleepQuality: 5,
    energy: 5,
    stress: 1,
    lessHealthyFoodFrequency: 'never',
    everydayActivity: 5,
    eatingQuality: 5,
    alcoholConsumption: 'none',
    ...overrides,
  };
}

export function healthyWeekly(
  overrides: Partial<WeeklyFocusCheckInInput> = {},
): WeeklyFocusCheckInInput {
  return {
    sleepQuality: 5,
    energy: 5,
    stress: 1,
    trainingFrequency: 'twice',
    everydayActivity: 5,
    eatingQuality: 5,
    alcoholConsumption: 'none',
    planAdherence: 3,
    ...overrides,
  };
}

export function engineInput(
  overrides: Partial<WeeklyFocusEngineInput> = {},
): WeeklyFocusEngineInput {
  return {
    weeklyCheckIn: healthyWeekly(),
    initialLifestyle: healthyLifestyle(),
    activityLevel: 'moderately_active',
    primaryFocus: null,
    previousFocuses: null,
    ...overrides,
  };
}

export function pairLabel(focuses: readonly WeeklyFocusSelectedArea[]): string {
  return focuses.map((item) => `${item.area}:${item.mode}:${item.needScore}`).join('|');
}
