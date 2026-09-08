import type { Result } from '@/lib/core';
import type { HealthDataConsentGrant } from '@/lib/domain/health-data-consent';

export type HealthDataConsentRepository = {
  hasActiveCurrentConsent(userId: string): Promise<Result<boolean>>;
  insertGrant(
    userId: string,
    grant: HealthDataConsentGrant,
  ): Promise<Result<{ inserted: boolean }>>;
};
