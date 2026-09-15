import { liveCopy, t } from '@/lib/i18n';

export const AGE_CONFIRMATION_COPY = liveCopy({
  title: () => t('onboarding.ageConfirmation.title'),
  body: () => t('onboarding.ageConfirmation.body'),
  checkbox: () => t('onboarding.ageConfirmation.checkbox'),
  continue: () => t('common.continue'),
});

export function canSubmitAgeConfirmation(checked: boolean): boolean {
  return checked === true;
}

export function isAgeGatedOnboardingPath(pathname: string): boolean {
  return (
    pathname.includes('step-3') ||
    pathname.includes('step-4') ||
    pathname.includes('measurement-choice') ||
    pathname.includes('body-measurements') ||
    pathname.includes('step-5')
  );
}

export function resolveAgeGatedOnboardingAccess(hasConfirmed18Plus: boolean): 'allow' | 'block' {
  return hasConfirmed18Plus ? 'allow' : 'block';
}
