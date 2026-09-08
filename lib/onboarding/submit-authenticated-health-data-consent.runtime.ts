import { createCurrentHealthDataConsentGrant } from '@/lib/onboarding/pending-health-data-consent-store';
import { submitAuthenticatedHealthDataConsent } from '@/lib/onboarding/submit-authenticated-health-data-consent';
import { healthDataConsentService } from '@/lib/services/health-data-consent';

export function submitAuthenticatedHealthDataConsentRuntime(userId: string) {
  return submitAuthenticatedHealthDataConsent(userId, createCurrentHealthDataConsentGrant(), {
    insertGrant: (id, grant) => healthDataConsentService.insertGrant(id, grant),
    inspectActiveCurrentConsent: (id) => healthDataConsentService.inspectActiveCurrentConsent(id),
  });
}
