import {
  bindPendingHealthDataConsentToUser,
  clearPendingHealthDataConsentForUser,
  getPendingHealthDataConsentBindState,
  getPendingHealthDataConsentForUser,
} from './pending-health-data-consent-storage';
import { persistPendingHealthDataConsent } from './persist-pending-health-data-consent';
import { healthDataConsentService } from '@/lib/services/health-data-consent';

export function persistPendingHealthDataConsentAfterAuth(userId: string) {
  return persistPendingHealthDataConsent(userId, {
    getBindState: getPendingHealthDataConsentBindState,
    bindToUser: bindPendingHealthDataConsentToUser,
    getPendingForUser: getPendingHealthDataConsentForUser,
    hasActiveCurrentConsent: (id) => healthDataConsentService.hasActiveCurrentConsent(id),
    insertGrant: (id, grant) => healthDataConsentService.insertGrant(id, grant),
    clearPendingForUser: clearPendingHealthDataConsentForUser,
  });
}
