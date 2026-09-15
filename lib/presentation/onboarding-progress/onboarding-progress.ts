import { t } from '@/lib/i18n';

export const ONBOARDING_MAJOR_STEP_COUNT = 6;

export const ONBOARDING_MAJOR_STEP_IDS = [
  'product-value',
  'legal',
  'lifestyle',
  'profile',
  'result',
  'account',
] as const;

export type OnboardingMajorStepId = (typeof ONBOARDING_MAJOR_STEP_IDS)[number];

const ONBOARDING_MAJOR_STEP_NUMBER: Record<OnboardingMajorStepId, number> = {
  'product-value': 1,
  legal: 2,
  lifestyle: 3,
  profile: 4,
  result: 5,
  account: 6,
};

export function onboardingMajorProgress(step: OnboardingMajorStepId): {
  current: number;
  total: number;
} {
  return {
    current: ONBOARDING_MAJOR_STEP_NUMBER[step],
    total: ONBOARDING_MAJOR_STEP_COUNT,
  };
}

export function formatOnboardingMajorProgress(step: OnboardingMajorStepId): string {
  const { current, total } = onboardingMajorProgress(step);
  return t('common.progress', { current, total });
}

/** Optional measurement screens stay on the Personal Profile major step. */
export function onboardingMajorStepForOptionalMeasurements(): OnboardingMajorStepId {
  return 'profile';
}
