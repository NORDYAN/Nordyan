import {
  PRIVACY_POLICY_URL,
  isCurrentHealthDataConsentGrant,
  type HealthDataConsentGrant,
} from '@/lib/domain/health-data-consent';
import { liveCopy, t } from '@/lib/i18n';

export const HEALTH_DATA_CONSENT_COPY = liveCopy({
  title: () => t('onboarding.healthDataConsent.title'),
  body: () => t('onboarding.healthDataConsent.body'),
  bodySecondary: () => t('onboarding.healthDataConsent.bodySecondary'),
  checkbox: () => t('onboarding.healthDataConsent.checkbox'),
  policyLink: () => t('onboarding.healthDataConsent.policyLink'),
  saveError: () => t('onboarding.healthDataConsent.saveError'),
  continue: () => t('common.continue'),
});

export function canSubmitHealthDataConsent(checked: boolean): boolean {
  return checked === true;
}

export function isHealthOnboardingCollectionPath(pathname: string): boolean {
  return (
    pathname.includes('step-3') ||
    pathname.includes('step-4') ||
    pathname.includes('measurement-choice') ||
    pathname.includes('body-measurements')
  );
}

export function resolveHealthOnboardingCollectionAccess(input: {
  pendingGrant: HealthDataConsentGrant | null;
  serverHasActiveCurrent: boolean;
}): 'allow' | 'block' {
  if (isCurrentHealthDataConsentGrant(input.pendingGrant) || input.serverHasActiveCurrent) {
    return 'allow';
  }

  return 'block';
}

export { PRIVACY_POLICY_URL };
